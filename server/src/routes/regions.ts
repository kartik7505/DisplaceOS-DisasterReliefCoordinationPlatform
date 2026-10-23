import { Router, Response } from "express";
import pool from "../db/pool";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, p.full_name AS coordinator_name
       FROM regions r
       LEFT JOIN profiles p ON p.id = r.coordinator_id
       WHERE r.is_active = true ORDER BY r.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
