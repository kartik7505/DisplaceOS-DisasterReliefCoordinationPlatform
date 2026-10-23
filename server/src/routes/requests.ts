import { Router } from "express";
import pool from "../db/pool";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { Response } from "express";

const router = Router();

// GET /api/requests - list requests visible to the authenticated user
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId } = req.user!;
    let query = `
      SELECT sr.*, 
             c.name AS camp_name,
             p.full_name AS requester_name,
             vol.full_name AS volunteer_name,
             json_agg(json_build_object(
               ''id'', ri.id,
               ''inventory_id'', ri.inventory_id,
               ''name'', inv.name,
               ''category'', inv.category,
               ''unit'', inv.unit,
               ''quantity_requested'', ri.quantity_requested,
               ''quantity_allocated'', ri.quantity_allocated
             ) ORDER BY ri.created_at) AS items
      FROM supply_requests sr
      JOIN camps c ON c.id = sr.camp_id
      JOIN profiles p ON p.id = sr.requested_by
      LEFT JOIN profiles vol ON vol.id = sr.assigned_volunteer
      LEFT JOIN request_items ri ON ri.request_id = sr.id
      LEFT JOIN inventory inv ON inv.id = ri.inventory_id
    `;
    const params: string[] = [];
    const where: string[] = [];

    if (role === "camp_manager") {
      where.push(`sr.requested_by = $${params.length + 1}`);
      params.push(userId);
    } else if (role === "volunteer") {
      where.push(`sr.assigned_volunteer = $${params.length + 1}`);
      params.push(userId);
    }
    // admin and regional_coordinator see all

    if (where.length > 0) query += " WHERE " + where.join(" AND ");
    query += " GROUP BY sr.id, c.name, p.full_name, vol.full_name ORDER BY sr.created_at DESC";

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/requests - camp manager creates a new request
router.post("/", authenticate, requireRole("camp_manager", "admin"), async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { camp_id, priority = 2, notes, items } = req.body;
    if (!camp_id || !items?.length) {
      return res.status(400).json({ error: "camp_id and items are required" });
    }
    const { rows: [request] } = await client.query(
      `INSERT INTO supply_requests (camp_id, requested_by, priority, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [camp_id, req.user!.userId, priority, notes]
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO request_items (request_id, inventory_id, quantity_requested)
         VALUES ($1, $2, $3)`,
        [request.id, item.inventory_id, item.quantity_requested]
      );
    }
    await client.query(
      `INSERT INTO activity_log (actor_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user!.userId, "request_created", "supply_request", request.id, { priority, notes }]
    );
    await client.query("COMMIT");
    res.status(201).json(request);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// PATCH /api/requests/:id/approve - coordinator approves + allocates stock
router.patch("/:id/approve", authenticate, requireRole("regional_coordinator", "admin"), async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const { assigned_volunteer, allocations } = req.body;

    const { rows: [request] } = await client.query(
      `SELECT * FROM supply_requests WHERE id = $1 AND status = ''pending''`,
      [id]
    );
    if (!request) return res.status(404).json({ error: "Request not found or not pending" });

    // Apply allocations to inventory
    for (const alloc of (allocations || [])) {
      const { inventory_id, quantity } = alloc;
      const { rowCount } = await client.query(
        `UPDATE inventory
         SET quantity_available = quantity_available - $1,
             quantity_reserved = quantity_reserved + $1
         WHERE id = $2 AND quantity_available >= $1`,
        [quantity, inventory_id]
      );
      if (!rowCount) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: `Insufficient stock for item ${inventory_id}` });
      }
      await client.query(
        `UPDATE request_items SET quantity_allocated = $1
         WHERE request_id = $2 AND inventory_id = $3`,
        [quantity, id, inventory_id]
      );
    }

    const { rows: [updated] } = await client.query(
      `UPDATE supply_requests
       SET status = ''allocated'', approved_by = $1, approved_at = NOW(), assigned_volunteer = $2
       WHERE id = $3 RETURNING *`,
      [req.user!.userId, assigned_volunteer || null, id]
    );

    await client.query(
      `INSERT INTO activity_log (actor_id, action, entity_type, entity_id)
       VALUES ($1, ''request_approved'', ''supply_request'', $2)`,
      [req.user!.userId, id]
    );
    await client.query("COMMIT");
    res.json(updated);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// PATCH /api/requests/:id/dispatch - volunteer marks dispatched
router.patch("/:id/dispatch", authenticate, requireRole("volunteer", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rows: [updated] } = await pool.query(
      `UPDATE supply_requests
       SET status = ''dispatched'', dispatched_at = NOW()
       WHERE id = $1 AND assigned_volunteer = $2 AND status = ''allocated''
       RETURNING *`,
      [id, req.user!.userId]
    );
    if (!updated) return res.status(404).json({ error: "Request not found or not allocated to you" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/requests/:id/deliver - volunteer confirms delivery
router.patch("/:id/deliver", authenticate, requireRole("volunteer", "admin"), async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const { rows: [request] } = await client.query(
      `UPDATE supply_requests
       SET status = ''delivered'', delivered_at = NOW()
       WHERE id = $1 AND assigned_volunteer = $2 AND status = ''dispatched''
       RETURNING *`,
      [id, req.user!.userId]
    );
    if (!request) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Request not found or not dispatched" });
    }
    // Release reserved stock (subtract from reserved)
    const { rows: items } = await client.query(
      `SELECT inventory_id, quantity_allocated FROM request_items WHERE request_id = $1`,
      [id]
    );
    for (const item of items) {
      if (item.quantity_allocated) {
        await client.query(
          `UPDATE inventory SET quantity_reserved = quantity_reserved - $1 WHERE id = $2`,
          [item.quantity_allocated, item.inventory_id]
        );
      }
    }
    await client.query(
      `INSERT INTO activity_log (actor_id, action, entity_type, entity_id)
       VALUES ($1, ''request_delivered'', ''supply_request'', $2)`,
      [req.user!.userId, id]
    );
    await client.query("COMMIT");
    res.json(request);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

export default router;
