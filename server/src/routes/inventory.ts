import { Router, Response } from "express";
import pool from "../db/pool";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { region_id } = req.query;
    const params: string[] = [];
    let where = "";
    if (region_id) {
      params.push(region_id as string);
      where = "WHERE i.region_id = $1";
    }
    const { rows } = await pool.query(
      `SELECT i.*, r.name AS region_name FROM inventory i
       JOIN regions r ON r.id = i.region_id
       ${where}
       ORDER BY i.category, i.name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireRole("regional_coordinator", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { region_id, name, category, unit, quantity_available, reorder_threshold } = req.body;
    if (!region_id || !name) return res.status(400).json({ error: "region_id and name required" });
    const { rows: [item] } = await pool.query(
      `INSERT INTO inventory (region_id, name, category, unit, quantity_available, reorder_threshold)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [region_id, name, category || "other", unit || "units", quantity_available || 0, reorder_threshold || 10]
    );
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/restock", authenticate, requireRole("regional_coordinator", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: "Positive quantity required" });
    const { rows: [item] } = await pool.query(
      `UPDATE inventory
       SET quantity_available = quantity_available + $1, last_restocked_at = NOW()
       WHERE id = $2 RETURNING *`,
      [quantity, req.params.id]
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
