import { Router, Response } from "express";
import dbStore from "../db/store";
import { authenticate, requireRole, requireCampAccess, AuthRequest } from "../middleware/auth";
import { idempotency } from "../middleware/idempotency";

const router = Router();

// GET /api/requests - list requests visible to the authenticated user
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { role, userId } = req.user!;
    const { status, camp_id, region_id } = req.query;

    const requests = await dbStore.getRequests({
      role,
      userId,
      status: status as string,
      campId: camp_id as string,
      regionId: region_id as string,
    });

    res.json(requests);
  } catch (err: any) {
    console.error("Error fetching requests:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error" });
  }
});

// GET /api/requests/:id - single request details
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const request = await dbStore.getRequestById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found", code: "NOT_FOUND" });
    }

    // Role-based authorization check
    const { role, userId } = req.user!;
    if (role === "camp_manager" && request.requested_by !== userId && req.user?.camp_id !== request.camp_id) {
      return res.status(403).json({ error: "Access denied to request from other camps", code: "FORBIDDEN" });
    }
    if (role === "volunteer" && request.assigned_volunteer && request.assigned_volunteer !== userId && request.status !== "allocated") {
      return res.status(403).json({ error: "Access restricted to your assigned deliveries", code: "FORBIDDEN" });
    }

    res.json(request);
  } catch (err: any) {
    console.error("Error fetching request by ID:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error" });
  }
});

// POST /api/requests - camp manager submits a new supply request
router.post(
  "/",
  authenticate,
  requireRole("camp_manager", "admin"),
  requireCampAccess,
  idempotency,
  async (req: AuthRequest, res: Response) => {
    try {
      const { camp_id, priority = 2, notes, items } = req.body;

      if (!camp_id) {
        return res.status(400).json({ error: "camp_id is required", code: "VALIDATION_ERROR" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "At least one supply item must be requested", code: "VALIDATION_ERROR" });
      }

      for (const item of items) {
        if (!item.inventory_id || typeof item.quantity_requested !== "number" || item.quantity_requested <= 0) {
          return res.status(400).json({
            error: "Each item must specify inventory_id and a positive quantity_requested",
            code: "VALIDATION_ERROR",
          });
        }
      }

      const newRequest = await dbStore.createRequest({
        camp_id,
        requested_by: req.user!.userId,
        requester_name: req.user!.email?.split("@")[0] || "Camp Manager",
        priority: Math.min(5, Math.max(1, Number(priority))),
        notes,
        items,
      });

      res.status(201).json(newRequest);
    } catch (err: any) {
      console.error("Error creating request:", err);
      res.status(err.statusCode || 500).json({ error: err.message || "Internal server error", code: err.code });
    }
  }
);

// Approve request (handler supporting both POST and PATCH)
const handleApprove = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await dbStore.approveRequest(id, req.user!.userId);
    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error", code: err.code });
  }
};
router.post("/:id/approve", authenticate, requireRole("regional_coordinator", "admin"), idempotency, handleApprove);
router.patch("/:id/approve", authenticate, requireRole("regional_coordinator", "admin"), idempotency, handleApprove);

// Allocate request with row-locking and stock reservation (handler supporting both POST and PATCH)
const handleAllocate = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { assigned_volunteer, allocations } = req.body;
    const updated = await dbStore.allocateRequest(
      id,
      req.user!.userId,
      assigned_volunteer,
      allocations
    );
    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error", code: err.code });
  }
};
router.post("/:id/allocate", authenticate, requireRole("regional_coordinator", "admin"), idempotency, handleAllocate);
router.patch("/:id/allocate", authenticate, requireRole("regional_coordinator", "admin"), idempotency, handleAllocate);

// Dispatch request (handler supporting both POST and PATCH)
const handleDispatch = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await dbStore.dispatchRequest(id, req.user!.userId, req.user!.role);
    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error", code: err.code });
  }
};
router.post("/:id/dispatch", authenticate, requireRole("volunteer", "admin"), idempotency, handleDispatch);
router.patch("/:id/dispatch", authenticate, requireRole("volunteer", "admin"), idempotency, handleDispatch);

// Deliver request (handler supporting both POST and PATCH)
const handleDeliver = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await dbStore.deliverRequest(id, req.user!.userId, req.user!.role);
    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error", code: err.code });
  }
};
router.post("/:id/deliver", authenticate, requireRole("volunteer", "camp_manager", "admin"), idempotency, handleDeliver);
router.patch("/:id/deliver", authenticate, requireRole("volunteer", "camp_manager", "admin"), idempotency, handleDeliver);

// Cancel request (handler supporting both POST and PATCH)
const handleCancel = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const updated = await dbStore.cancelRequest(id, req.user!.userId, reason);
    res.json(updated);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error", code: err.code });
  }
};
router.post("/:id/cancel", authenticate, requireRole("camp_manager", "regional_coordinator", "admin"), idempotency, handleCancel);
router.patch("/:id/cancel", authenticate, requireRole("camp_manager", "regional_coordinator", "admin"), idempotency, handleCancel);

export default router;
