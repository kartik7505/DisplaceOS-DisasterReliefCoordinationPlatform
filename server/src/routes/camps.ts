import { Router, Response } from "express";
import dbStore from "../db/store";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/camps - list camps, optionally filtered by region
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { region_id } = req.query;
    const camps = await dbStore.getCamps(region_id as string);
    res.json(camps);
  } catch (err: any) {
    console.error("Error fetching camps:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/camps/:id - get single camp details
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const camp = await dbStore.getCampById(req.params.id as string);
    if (!camp) return res.status(404).json({ error: "Camp not found", code: "NOT_FOUND" });
    res.json(camp);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
