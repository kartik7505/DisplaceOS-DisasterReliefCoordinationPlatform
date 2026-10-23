import { Router, Response } from "express";
import pool from "../db/pool";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, r.name AS region_name, p.full_name AS manager_name
       FROM camps c
       JOIN regions r ON r.id = c.region_id
       LEFT JOIN profiles p ON p.id = c.manager_id
       WHERE c.is_active = true
       ORDER BY r.name, c.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows: [camp] } = await pool.query(
      `SELECT c.*, r.name AS region_name FROM camps c JOIN regions r ON r.id = c.region_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!camp) return res.status(404).json({ error: "Camp not found" });
    res.json(camp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
