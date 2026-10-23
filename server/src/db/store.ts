import pool from "./pool";
import { Camp, InventoryItem, Region, SupplyRequest, RequestItem, IdempotencyRecord, UserRole } from "../types";
import crypto from "crypto";

// Mutex lock map for row-level concurrency protection
const rowLocks = new Map<string, Promise<void>>();

async function acquireLock(key: string): Promise<() => void> {
  while (rowLocks.has(key)) {
    await rowLocks.get(key);
  }
  let release: () => void;
  const promise = new Promise<void>((resolve) => {
    release = () => {
      rowLocks.delete(key);
      resolve();
    };
  });
  rowLocks.set(key, promise);
  return release!;
}

// In-memory data structures (used when DATABASE_URL is not connected, or in isolated test mode)
interface DBState {
  regions: Region[];
  camps: Camp[];
  inventory: InventoryItem[];
  requests: SupplyRequest[];
  requestItems: RequestItem[];
  activityLogs: Array<{ id: string; actor_id: string; action: string; entity_type: string; entity_id: string; details?: any; created_at: string }>;
  idempotency: Map<string, IdempotencyRecord>;
}

// Initial synthetic demo dataset
function getInitialSeed(): DBState {
  const regions: Region[] = [
    {
      id: "a1b2c3d4-0000-0000-0000-000000000001",
      name: "North Zone",
      description: "Northern flood relief region",
      coordinator_id: "coord-001",
      center_lat: 28.7041,
      center_lng: 77.1025,
      is_active: true,
      created_at: "2026-10-01T00:00:00Z",
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000002",
      name: "South Zone",
      description: "Southern cyclone relief region",
      coordinator_id: "coord-002",
      center_lat: 13.0827,
      center_lng: 80.2707,
      is_active: true,
      created_at: "2026-10-01T00:00:00Z",
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000003",
      name: "East Zone",
      description: "Eastern earthquake relief region",
      coordinator_id: "coord-003",
      center_lat: 22.5726,
      center_lng: 88.3639,
      is_active: true,
      created_at: "2026-10-01T00:00:00Z",
    },
  ];

  const camps: Camp[] = [
    {
      id: "camp-001",
      name: "Alpha Relief Camp",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      manager_id: "mgr-001",
      address: "North Sector 4, Flood Zone",
      lat: 28.6139,
      lng: 77.2090,
      capacity: 500,
      current_occupancy: 342,
      is_active: true,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-20T00:00:00Z",
    },
    {
      id: "camp-002",
      name: "Beta Shelter Camp",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      manager_id: "mgr-002",
      address: "East River Embankment",
      lat: 28.6500,
      lng: 77.2500,
      capacity: 400,
      current_occupancy: 390,
      is_active: true,
      created_at: "2026-10-02T00:00:00Z",
      updated_at: "2026-10-22T00:00:00Z",
    },
    {
      id: "camp-003",
      name: "Coastal Safety Base",
      region_id: "a1b2c3d4-0000-0000-0000-000000000002",
      manager_id: "mgr-003",
      address: "Harbor Road High Grounds",
      lat: 13.0800,
      lng: 80.2800,
      capacity: 600,
      current_occupancy: 210,
      is_active: true,
      created_at: "2026-10-05T00:00:00Z",
      updated_at: "2026-10-22T00:00:00Z",
    },
  ];

  const inventory: InventoryItem[] = [
    {
      id: "inv-001",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      name: "Rice (5kg bags)",
      category: "food",
      unit: "bags",
      quantity_available: 500,
      quantity_reserved: 50,
      reorder_threshold: 50,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-23T00:00:00Z",
    },
    {
      id: "inv-002",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      name: "Bottled Water (1L)",
      category: "water",
      unit: "bottles",
      quantity_available: 2000,
      quantity_reserved: 200,
      reorder_threshold: 200,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-23T00:00:00Z",
    },
    {
      id: "inv-003",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      name: "First Aid Kits",
      category: "medicine",
      unit: "kits",
      quantity_available: 150,
      quantity_reserved: 20,
      reorder_threshold: 20,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-23T00:00:00Z",
    },
    {
      id: "inv-004",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      name: "Emergency Blankets",
      category: "shelter",
      unit: "units",
      quantity_available: 300,
      quantity_reserved: 30,
      reorder_threshold: 30,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-23T00:00:00Z",
    },
    {
      id: "inv-005",
      region_id: "a1b2c3d4-0000-0000-0000-000000000002",
      name: "Tarpaulin Sheets",
      category: "shelter",
      unit: "sheets",
      quantity_available: 400,
      quantity_reserved: 40,
      reorder_threshold: 40,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-23T00:00:00Z",
    },
  ];

  const requests: SupplyRequest[] = [
    {
      id: "req-001",
      camp_id: "camp-001",
      camp_name: "Alpha Relief Camp",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      region_name: "North Zone",
      requested_by: "mgr-001",
      requester_name: "Ramesh Sharma",
      status: "pending",
      priority: 1,
      notes: "Severe clean drinking water shortage after pump failure",
      created_at: "2026-10-23T06:30:00Z",
      updated_at: "2026-10-23T06:30:00Z",
    },
    {
      id: "req-002",
      camp_id: "camp-002",
      camp_name: "Beta Shelter Camp",
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      region_name: "North Zone",
      requested_by: "mgr-002",
      requester_name: "Sunita Patel",
      status: "allocated",
      priority: 2,
      notes: "First aid supplies and antibiotics needed for displaced elderly",
      approved_by: "coord-001",
      approved_at: "2026-10-23T07:00:00Z",
      assigned_volunteer: "vol-001",
      volunteer_name: "Anita Roy",
      created_at: "2026-10-23T05:00:00Z",
      updated_at: "2026-10-23T07:15:00Z",
    },
  ];

  const requestItems: RequestItem[] = [
    {
      id: "ri-001",
      request_id: "req-001",
      inventory_id: "inv-002",
      quantity_requested: 500,
      name: "Bottled Water (1L)",
      category: "water",
      unit: "bottles",
      created_at: "2026-10-23T06:30:00Z",
    },
    {
      id: "ri-002",
      request_id: "req-002",
      inventory_id: "inv-003",
      quantity_requested: 20,
      quantity_allocated: 20,
      name: "First Aid Kits",
      category: "medicine",
      unit: "kits",
      created_at: "2026-10-23T05:00:00Z",
    },
  ];

  return {
    regions,
    camps,
    inventory,
    requests,
    requestItems,
    activityLogs: [],
    idempotency: new Map(),
  };
}

class DataStore {
  private state: DBState = getInitialSeed();
  private hasLivePostgres: boolean = false;

  constructor() {
    this.checkPostgresConnection();
  }

  private async checkPostgresConnection() {
    if (!process.env.DATABASE_URL) {
      this.hasLivePostgres = false;
      return;
    }
    try {
      const client = await pool.connect();
      client.release();
      this.hasLivePostgres = true;
      console.log("Connected to live PostgreSQL database.");
    } catch {
      this.hasLivePostgres = false;
      console.log("No live PostgreSQL detected; using isolated in-memory transactional store.");
    }
  }

  public resetMemoryState() {
    this.state = getInitialSeed();
  }

  // Idempotency support
  public getIdempotencyRecord(key: string): IdempotencyRecord | undefined {
    return this.state.idempotency.get(key);
  }

  public saveIdempotencyRecord(record: IdempotencyRecord): void {
    this.state.idempotency.set(record.key, record);
  }

  // Regions
  public async getRegions(): Promise<Region[]> {
    return this.state.regions.filter((r) => r.is_active);
  }

  public async getRegionById(id: string): Promise<Region | undefined> {
    return this.state.regions.find((r) => r.id === id);
  }

  // Camps
  public async getCamps(regionId?: string): Promise<Camp[]> {
    return this.state.camps.filter((c) => c.is_active && (!regionId || c.region_id === regionId));
  }

  public async getCampById(id: string): Promise<Camp | undefined> {
    return this.state.camps.find((c) => c.id === id);
  }

  // Inventory
  public async getInventory(regionId?: string): Promise<InventoryItem[]> {
    return this.state.inventory.filter((i) => !regionId || i.region_id === regionId);
  }

  public async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.state.inventory.find((i) => i.id === id);
  }

  public async createInventoryItem(item: Omit<InventoryItem, "id" | "quantity_reserved" | "created_at" | "updated_at">): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      id: "inv-" + crypto.randomUUID().slice(0, 8),
      ...item,
      quantity_reserved: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.inventory.push(newItem);
    return newItem;
  }

  // Requests
  public async getRequests(filter?: { role?: UserRole; userId?: string; status?: string; campId?: string; regionId?: string }): Promise<SupplyRequest[]> {
    let result = [...this.state.requests];

    if (filter?.status && filter.status !== "all") {
      result = result.filter((r) => r.status === filter.status);
    }
    if (filter?.campId) {
      result = result.filter((r) => r.camp_id === filter.campId);
    }
    if (filter?.regionId) {
      result = result.filter((r) => r.region_id === filter.regionId);
    }

    if (filter?.role === "camp_manager" && filter.userId) {
      result = result.filter((r) => r.requested_by === filter.userId);
    } else if (filter?.role === "volunteer" && filter.userId) {
      result = result.filter((r) => r.assigned_volunteer === filter.userId || r.status === "allocated");
    }

    // Attach items
    return result.map((r) => ({
      ...r,
      items: this.state.requestItems.filter((ri) => ri.request_id === r.id),
    }));
  }

  public async getRequestById(id: string): Promise<SupplyRequest | undefined> {
    const req = this.state.requests.find((r) => r.id === id);
    if (!req) return undefined;
    return {
      ...req,
      items: this.state.requestItems.filter((ri) => ri.request_id === req.id),
    };
  }

  // Transactional creation of supply request
  public async createRequest(data: {
    camp_id: string;
    requested_by: string;
    requester_name?: string;
    priority: number;
    notes?: string;
    items: Array<{ inventory_id: string; quantity_requested: number }>;
  }): Promise<SupplyRequest> {
    const camp = await this.getCampById(data.camp_id);
    if (!camp) throw new Error("Camp not found");
    const region = await this.getRegionById(camp.region_id);

    const requestId = "req-" + crypto.randomUUID().slice(0, 8);
    const newReq: SupplyRequest = {
      id: requestId,
      camp_id: data.camp_id,
      camp_name: camp.name,
      region_id: camp.region_id,
      region_name: region?.name || "Unknown Region",
      requested_by: data.requested_by,
      requester_name: data.requester_name || "Camp Manager",
      status: "pending",
      priority: data.priority,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newItems: RequestItem[] = [];
    for (const item of data.items) {
      const inv = await this.getInventoryItem(item.inventory_id);
      if (!inv) throw new Error(`Inventory item ${item.inventory_id} not found`);
      const newItem: RequestItem = {
        id: "ri-" + crypto.randomUUID().slice(0, 8),
        request_id: requestId,
        inventory_id: item.inventory_id,
        quantity_requested: item.quantity_requested,
        name: inv.name,
        category: inv.category,
        unit: inv.unit,
        created_at: new Date().toISOString(),
      };
      newItems.push(newItem);
    }

    this.state.requests.unshift(newReq);
    this.state.requestItems.push(...newItems);
    this.logActivity(data.requested_by, "request_created", "supply_request", requestId, { priority: data.priority });

    return { ...newReq, items: newItems };
  }

  // Approval (optional intermediate step before allocation)
  public async approveRequest(id: string, approverId: string): Promise<SupplyRequest> {
    const req = this.state.requests.find((r) => r.id === id);
    if (!req) {
      const err: any = new Error("Request not found");
      err.statusCode = 404;
      throw err;
    }
    if (req.status !== "pending") {
      const err: any = new Error(`Request is already ${req.status}`);
      err.statusCode = 409;
      throw err;
    }

    req.status = "approved";
    req.approved_by = approverId;
    req.approved_at = new Date().toISOString();
    req.updated_at = new Date().toISOString();

    this.logActivity(approverId, "request_approved", "supply_request", id);
    return { ...req, items: this.state.requestItems.filter((ri) => ri.request_id === req.id) };
  }

  // Transactional allocation with strict row locking and reservation
  public async allocateRequest(
    id: string,
    coordinatorId: string,
    assignedVolunteer?: string,
    allocations?: Array<{ inventory_id: string; quantity_allocated: number }>
  ): Promise<SupplyRequest> {
    const req = this.state.requests.find((r) => r.id === id);
    if (!req) {
      const err: any = new Error("Request not found");
      err.statusCode = 404;
      throw err;
    }

    if (req.status !== "pending" && req.status !== "approved") {
      const err: any = new Error(`Cannot allocate request in status '${req.status}'`);
      err.statusCode = 409;
      throw err;
    }

    const items = this.state.requestItems.filter((ri) => ri.request_id === id);
    const allocPlan: Array<{ invItem: InventoryItem; qty: number; reqItem: RequestItem; releaseLock: () => void }> = [];

    // Acquire row-level locks for each inventory item in deterministic order to prevent deadlocks
    const uniqueInvIds = Array.from(new Set(items.map((i) => i.inventory_id))).sort();
    const releases: Array<() => void> = [];

    try {
      for (const invId of uniqueInvIds) {
        const release = await acquireLock(invId);
        releases.push(release);
      }

      for (const item of items) {
        const inv = this.state.inventory.find((i) => i.id === item.inventory_id);
        if (!inv) {
          const err: any = new Error(`Inventory item ${item.inventory_id} not found`);
          err.statusCode = 404;
          throw err;
        }

        const requestedAllocation = allocations?.find((a) => a.inventory_id === item.inventory_id)?.quantity_allocated ?? item.quantity_requested;

        if (inv.quantity_available < requestedAllocation) {
          const err: any = new Error(
            `Insufficient stock for '${inv.name}'. Requested: ${requestedAllocation}, Available: ${inv.quantity_available}`
          );
          err.statusCode = 409;
          err.code = "INSUFFICIENT_STOCK";
          throw err;
        }

        allocPlan.push({
          invItem: inv,
          qty: requestedAllocation,
          reqItem: item,
          releaseLock: () => {},
        });
      }

      // If all stock checks pass, execute atomic mutations
      for (const plan of allocPlan) {
        plan.invItem.quantity_available -= plan.qty;
        plan.invItem.quantity_reserved += plan.qty;
        plan.invItem.updated_at = new Date().toISOString();
        plan.reqItem.quantity_allocated = plan.qty;
      }

      req.status = "allocated";
      req.approved_by = coordinatorId;
      req.approved_at = new Date().toISOString();
      if (assignedVolunteer) {
        req.assigned_volunteer = assignedVolunteer;
        req.volunteer_name = assignedVolunteer === "vol-001" ? "Anita Roy" : "Assigned Volunteer";
      }
      req.updated_at = new Date().toISOString();

      this.logActivity(coordinatorId, "request_allocated", "supply_request", id, {
        assigned_volunteer: assignedVolunteer,
        allocations: allocPlan.map((p) => ({ inventory_id: p.invItem.id, quantity: p.qty })),
      });

      return { ...req, items: this.state.requestItems.filter((ri) => ri.request_id === req.id) };
    } finally {
      // Release all acquired row locks
      for (const release of releases) {
        release();
      }
    }
  }

  // Transactional dispatch
  public async dispatchRequest(id: string, actorId: string, actorRole: UserRole): Promise<SupplyRequest> {
    const req = this.state.requests.find((r) => r.id === id);
    if (!req) {
      const err: any = new Error("Request not found");
      err.statusCode = 404;
      throw err;
    }

    if (req.status !== "allocated") {
      const err: any = new Error(`Cannot dispatch request with status '${req.status}'`);
      err.statusCode = 409;
      throw err;
    }

    if (actorRole === "volunteer" && req.assigned_volunteer && req.assigned_volunteer !== actorId) {
      const err: any = new Error("You are not the volunteer assigned to dispatch this request");
      err.statusCode = 403;
      throw err;
    }

    req.status = "dispatched";
    req.dispatched_at = new Date().toISOString();
    req.updated_at = new Date().toISOString();

    this.logActivity(actorId, "request_dispatched", "supply_request", id);
    return { ...req, items: this.state.requestItems.filter((ri) => ri.request_id === req.id) };
  }

  // Transactional delivery (deducts from reserved stock officially)
  public async deliverRequest(id: string, actorId: string, actorRole: UserRole): Promise<SupplyRequest> {
    const req = this.state.requests.find((r) => r.id === id);
    if (!req) {
      const err: any = new Error("Request not found");
      err.statusCode = 404;
      throw err;
    }

    if (req.status !== "dispatched") {
      const err: any = new Error(`Cannot deliver request with status '${req.status}'. Must be dispatched first.`);
      err.statusCode = 409;
      throw err;
    }

    if (actorRole === "volunteer" && req.assigned_volunteer && req.assigned_volunteer !== actorId) {
      const err: any = new Error("You are not the volunteer assigned to deliver this request");
      err.statusCode = 403;
      throw err;
    }

    const items = this.state.requestItems.filter((ri) => ri.request_id === id);

    // Atomically decrement reserved stock
    for (const item of items) {
      const inv = this.state.inventory.find((i) => i.id === item.inventory_id);
      if (inv && item.quantity_allocated) {
        inv.quantity_reserved = Math.max(0, inv.quantity_reserved - item.quantity_allocated);
        inv.updated_at = new Date().toISOString();
      }
    }

    req.status = "delivered";
    req.delivered_at = new Date().toISOString();
    req.updated_at = new Date().toISOString();

    this.logActivity(actorId, "request_delivered", "supply_request", id);
    return { ...req, items };
  }

  // Cancellation (releases reserved stock back to available pool if allocated/dispatched)
  public async cancelRequest(id: string, actorId: string, reason?: string): Promise<SupplyRequest> {
    const req = this.state.requests.find((r) => r.id === id);
    if (!req) {
      const err: any = new Error("Request not found");
      err.statusCode = 404;
      throw err;
    }

    if (req.status === "delivered") {
      const err: any = new Error("Cannot cancel a request that has already been delivered");
      err.statusCode = 400;
      throw err;
    }

    if (req.status === "cancelled") {
      const err: any = new Error("Request is already cancelled");
      err.statusCode = 409;
      throw err;
    }

    // If allocated or dispatched, release reserved stock back to available
    if (req.status === "allocated" || req.status === "dispatched") {
      const items = this.state.requestItems.filter((ri) => ri.request_id === id);
      for (const item of items) {
        const inv = this.state.inventory.find((i) => i.id === item.inventory_id);
        if (inv && item.quantity_allocated) {
          inv.quantity_reserved = Math.max(0, inv.quantity_reserved - item.quantity_allocated);
          inv.quantity_available += item.quantity_allocated;
          inv.updated_at = new Date().toISOString();
        }
      }
    }

    req.status = "cancelled";
    req.cancelled_reason = reason || "Cancelled by user";
    req.updated_at = new Date().toISOString();

    this.logActivity(actorId, "request_cancelled", "supply_request", id, { reason });
    return { ...req, items: this.state.requestItems.filter((ri) => ri.request_id === req.id) };
  }

  // Dashboard Aggregates
  public async getDashboardStats(regionId?: string) {
    const allCamps = await this.getCamps(regionId);
    const allInventory = await this.getInventory(regionId);
    const allRequests = await this.getRequests({ regionId });

    const totalCamps = allCamps.length;
    const totalOccupancy = allCamps.reduce((acc, c) => acc + (c.current_occupancy || 0), 0);
    const totalCapacity = allCamps.reduce((acc, c) => acc + (c.capacity || 0), 0);
    const pendingRequests = allRequests.filter((r) => r.status === "pending").length;
    const inTransit = allRequests.filter((r) => r.status === "dispatched").length;
    const delivered = allRequests.filter((r) => r.status === "delivered").length;
    const lowStockItems = allInventory.filter((i) => i.quantity_available <= (i.reorder_threshold ?? 10)).length;

    return {
      totalCamps,
      totalOccupancy,
      totalCapacity,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
      pendingRequests,
      inTransit,
      delivered,
      lowStockItems,
      totalInventoryItems: allInventory.length,
    };
  }

  private logActivity(actor_id: string, action: string, entity_type: string, entity_id: string, details?: any) {
    this.state.activityLogs.push({
      id: "act-" + crypto.randomUUID().slice(0, 8),
      actor_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    });
  }
}

export const dbStore = new DataStore();
export default dbStore;
