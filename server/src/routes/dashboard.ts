import { Router, Response } from "express";
import dbStore from "../db/store";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/dashboard/stats - aggregated metrics for disaster response dashboard
router.get("/stats", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { region_id } = req.query;
    const stats = await dbStore.getDashboardStats(region_id as string);
    res.json(stats);
  } catch (err: any) {
    console.error("Error generating dashboard stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
