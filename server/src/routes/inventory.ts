import { Router, Response } from "express";
import dbStore from "../db/store";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/inventory - fetch inventory, optionally filtered by region
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { region_id } = req.query;
    const inventory = await dbStore.getInventory(region_id as string);
    res.json(inventory);
  } catch (err: any) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/inventory/:id - fetch single inventory item
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await dbStore.getInventoryItem(req.params.id as string);
    if (!item) return res.status(404).json({ error: "Inventory item not found", code: "NOT_FOUND" });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/inventory - create inventory item
router.post("/", authenticate, requireRole("regional_coordinator", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { region_id, name, category, unit, quantity_available, reorder_threshold } = req.body;
    if (!region_id || !name) {
      return res.status(400).json({ error: "region_id and name are required", code: "VALIDATION_ERROR" });
    }

    const item = await dbStore.createInventoryItem({
      region_id,
      name,
      category: category || "other",
      unit: unit || "units",
      quantity_available: Math.max(0, Number(quantity_available) || 0),
      reorder_threshold: Number(reorder_threshold) || 10,
    });

    res.status(201).json(item);
  } catch (err: any) {
    console.error("Error creating inventory item:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
