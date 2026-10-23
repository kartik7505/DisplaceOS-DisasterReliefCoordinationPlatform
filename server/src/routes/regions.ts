import { Router, Response } from "express";
import dbStore from "../db/store";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/regions - list active disaster relief regions
router.get("/", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const regions = await dbStore.getRegions();
    res.json(regions);
  } catch (err: any) {
    console.error("Error fetching regions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/regions/:id - get single region details
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const region = await dbStore.getRegionById(req.params.id as string);
    if (!region) return res.status(404).json({ error: "Region not found", code: "NOT_FOUND" });
    res.json(region);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
