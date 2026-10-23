process.env.NODE_ENV = "test";

const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { app } = require("../dist/index");
const { dbStore } = require("../dist/db/store");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

beforeEach(() => {
  dbStore.resetMemoryState();
  process.env.NODE_ENV = "test";
  delete process.env.SUPABASE_JWT_SECRET;
});

// Helper for making HTTP requests
async function api(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

describe("1. System Health & Public Endpoints", () => {
  test("GET /api/health returns ok", async () => {
    const res = await api("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.data.status, "ok");
    assert.ok(res.data.timestamp);
  });
});

describe("2. Production Authentication Security & Forged Headers", () => {
  test("In production mode, forged dev headers without token are strictly rejected (401)", async () => {
    process.env.NODE_ENV = "production";
    const res = await api("/api/regions", {
      headers: {
        "x-user-id": "attacker-id",
        "x-user-role": "admin",
      },
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.code, "PRODUCTION_AUTH_REQUIRED");
  });

  test("In production mode, missing token returns 401 Unauthorized", async () => {
    process.env.NODE_ENV = "production";
    const res = await api("/api/regions");
    assert.equal(res.status, 401);
    assert.equal(res.data.code, "UNAUTHORIZED");
  });

  test("In production mode, invalid token signature is rejected (401)", async () => {
    process.env.NODE_ENV = "production";
    process.env.SUPABASE_JWT_SECRET = "super-secret-production-key";
    const forgedToken = jwt.sign({ sub: "hacker", role: "admin" }, "wrong-secret-key");

    const res = await api("/api/regions", {
      headers: {
        Authorization: `Bearer ${forgedToken}`,
      },
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.code, "INVALID_TOKEN");
  });

  test("In production mode, valid JWT verifies identity and ignores client dev headers", async () => {
    process.env.NODE_ENV = "production";
    const secret = "production-supabase-jwt-secret-xyz";
    process.env.SUPABASE_JWT_SECRET = secret;

    const validToken = jwt.sign(
      { sub: "legit-coord-1", role: "regional_coordinator", email: "coord@displaceos.org" },
      secret
    );

    const res = await api("/api/regions", {
      headers: {
        Authorization: `Bearer ${validToken}`,
        "x-user-role": "admin", // Malicious attempt to elevate role via header
      },
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });
});

describe("3. Development Authentication & Role Validation", () => {
  test("Invalid user role specified in dev headers returns 400 Bad Request", async () => {
    const res = await api("/api/regions", {
      headers: {
        "x-user-id": "user-1",
        "x-user-role": "superman",
      },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.code, "INVALID_ROLE");
  });

  test("Missing credentials in dev mode returns 401 Unauthorized", async () => {
    const res = await api("/api/regions");
    assert.equal(res.status, 401);
    assert.equal(res.data.code, "UNAUTHORIZED");
  });

  test("Valid dev headers authenticate successfully", async () => {
    const res = await api("/api/regions", {
      headers: {
        "x-user-id": "coord-001",
        "x-user-role": "regional_coordinator",
      },
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.length >= 3);
  });
});

describe("4. Role-Based Access Control (RBAC) & Scope Enforcement", () => {
  test("Volunteer cannot approve or allocate supply requests (403)", async () => {
    const res = await api("/api/requests/req-001/approve", {
      method: "POST",
      headers: {
        "x-user-id": "vol-001",
        "x-user-role": "volunteer",
      },
    });
    assert.equal(res.status, 403);
    assert.equal(res.data.code, "FORBIDDEN");
  });

  test("Camp Manager cannot allocate requests (403)", async () => {
    const res = await api("/api/requests/req-001/allocate", {
      method: "POST",
      headers: {
        "x-user-id": "mgr-001",
        "x-user-role": "camp_manager",
      },
      body: {
        assigned_volunteer: "vol-001",
      },
    });
    assert.equal(res.status, 403);
    assert.equal(res.data.code, "FORBIDDEN");
  });

  test("Camp manager cannot submit supply request for a different camp (403 scope restriction)", async () => {
    const res = await api("/api/requests", {
      method: "POST",
      headers: {
        "x-user-id": "mgr-001",
        "x-user-role": "camp_manager",
        "x-user-camp": "camp-001",
      },
      body: {
        camp_id: "camp-002", // Mismatch with assigned camp-001
        items: [{ inventory_id: "inv-001", quantity_requested: 50 }],
      },
    });
    assert.equal(res.status, 403);
    assert.equal(res.data.code, "CAMP_SCOPE_VIOLATION");
  });

  test("Volunteer cannot dispatch a request assigned to another volunteer (403)", async () => {
    // req-002 is assigned to vol-001
    const res = await api("/api/requests/req-002/dispatch", {
      method: "POST",
      headers: {
        "x-user-id": "vol-other-999",
        "x-user-role": "volunteer",
      },
    });
    assert.equal(res.status, 403);
  });
});

describe("5. End-to-End Workflow: Request ➔ Allocate ➔ Dispatch ➔ Deliver with Stock Accounting", () => {
  test("Complete supply lifecycle tracks inventory reservations and deductions accurately", async () => {
    // Check baseline inventory for inv-001 (Rice): available 500, reserved 50
    const invBefore = await dbStore.getInventoryItem("inv-001");
    assert.ok(invBefore);
    const initialAvail = invBefore.quantity_available;
    const initialRes = invBefore.quantity_reserved;

    // Step 1: Camp manager creates request for 100 bags of rice
    const createRes = await api("/api/requests", {
      method: "POST",
      headers: {
        "x-user-id": "mgr-001",
        "x-user-role": "camp_manager",
        "x-user-camp": "camp-001",
      },
      body: {
        camp_id: "camp-001",
        priority: 1,
        notes: "Urgent rice supply needed",
        items: [{ inventory_id: "inv-001", quantity_requested: 100 }],
      },
    });
    assert.equal(createRes.status, 201);
    const requestId = createRes.data.id;
    assert.equal(createRes.data.status, "pending");

    // Inventory should NOT change yet on creation
    const invAfterCreate = await dbStore.getInventoryItem("inv-001");
    assert.equal(invAfterCreate.quantity_available, initialAvail);
    assert.equal(invAfterCreate.quantity_reserved, initialRes);

    // Step 2: Regional Coordinator allocates 100 bags and assigns volunteer vol-001
    const allocRes = await api(`/api/requests/${requestId}/allocate`, {
      method: "POST",
      headers: {
        "x-user-id": "coord-001",
        "x-user-role": "regional_coordinator",
      },
      body: {
        assigned_volunteer: "vol-001",
        allocations: [{ inventory_id: "inv-001", quantity_allocated: 100 }],
      },
    });
    assert.equal(allocRes.status, 200);
    assert.equal(allocRes.data.status, "allocated");
    assert.equal(allocRes.data.assigned_volunteer, "vol-001");

    // Inventory check: available should decrease by 100, reserved increase by 100
    const invAfterAlloc = await dbStore.getInventoryItem("inv-001");
    assert.equal(invAfterAlloc.quantity_available, initialAvail - 100);
    assert.equal(invAfterAlloc.quantity_reserved, initialRes + 100);

    // Step 3: Assigned volunteer marks dispatched
    const dispatchRes = await api(`/api/requests/${requestId}/dispatch`, {
      method: "POST",
      headers: {
        "x-user-id": "vol-001",
        "x-user-role": "volunteer",
      },
    });
    assert.equal(dispatchRes.status, 200);
    assert.equal(dispatchRes.data.status, "dispatched");
    assert.ok(dispatchRes.data.dispatched_at);

    // Step 4: Assigned volunteer marks delivered at camp
    const deliverRes = await api(`/api/requests/${requestId}/deliver`, {
      method: "POST",
      headers: {
        "x-user-id": "vol-001",
        "x-user-role": "volunteer",
      },
    });
    assert.equal(deliverRes.status, 200);
    assert.equal(deliverRes.data.status, "delivered");
    assert.ok(deliverRes.data.delivered_at);

    // Inventory check after delivery: reserved stock is released (decreased by 100), available remains decremented
    const invAfterDelivery = await dbStore.getInventoryItem("inv-001");
    assert.equal(invAfterDelivery.quantity_available, initialAvail - 100);
    assert.equal(invAfterDelivery.quantity_reserved, initialRes);
  });
});

describe("6. Cancellation & Stock Restitution", () => {
  test("Cancelling an allocated request returns reserved stock back to available pool", async () => {
    const invBefore = await dbStore.getInventoryItem("inv-002");
    assert.ok(invBefore);
    const startAvail = invBefore.quantity_available;
    const startRes = invBefore.quantity_reserved;

    // Create & allocate a request
    const createRes = await api("/api/requests", {
      method: "POST",
      headers: { "x-user-id": "mgr-001", "x-user-role": "camp_manager" },
      body: {
        camp_id: "camp-001",
        priority: 2,
        items: [{ inventory_id: "inv-002", quantity_requested: 200 }],
      },
    });
    const reqId = createRes.data.id;

    await api(`/api/requests/${reqId}/allocate`, {
      method: "POST",
      headers: { "x-user-id": "coord-001", "x-user-role": "regional_coordinator" },
      body: {
        assigned_volunteer: "vol-001",
        allocations: [{ inventory_id: "inv-002", quantity_allocated: 200 }],
      },
    });

    const invAllocated = await dbStore.getInventoryItem("inv-002");
    assert.equal(invAllocated.quantity_available, startAvail - 200);
    assert.equal(invAllocated.quantity_reserved, startRes + 200);

    // Now Cancel
    const cancelRes = await api(`/api/requests/${reqId}/cancel`, {
      method: "POST",
      headers: { "x-user-id": "coord-001", "x-user-role": "regional_coordinator" },
      body: { reason: "Flood receded, no longer needed" },
    });
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.data.status, "cancelled");

    // Inventory must be fully restored!
    const invRestored = await dbStore.getInventoryItem("inv-002");
    assert.equal(invRestored.quantity_available, startAvail);
    assert.equal(invRestored.quantity_reserved, startRes);
  });
});

describe("7. Concurrency & Competing Allocation Locks", () => {
  test("Concurrent competing allocations prevent over-allocation and negative inventory", async () => {
    // Create new inventory item with exactly 50 units available
    const item = await dbStore.createInventoryItem({
      region_id: "a1b2c3d4-0000-0000-0000-000000000001",
      name: "Specialized Water Filters",
      category: "water",
      unit: "units",
      quantity_available: 50,
      reorder_threshold: 5,
    });

    // Create Request 1 (asking 35 units)
    const req1 = await dbStore.createRequest({
      camp_id: "camp-001",
      requested_by: "mgr-001",
      priority: 1,
      items: [{ inventory_id: item.id, quantity_requested: 35 }],
    });

    // Create Request 2 (asking 35 units)
    const req2 = await dbStore.createRequest({
      camp_id: "camp-002",
      requested_by: "mgr-002",
      priority: 1,
      items: [{ inventory_id: item.id, quantity_requested: 35 }],
    });

    // Fire both allocations concurrently! Total requested = 70, but only 50 available
    const [res1, res2] = await Promise.all([
      api(`/api/requests/${req1.id}/allocate`, {
        method: "POST",
        headers: { "x-user-id": "coord-001", "x-user-role": "regional_coordinator" },
        body: { assigned_volunteer: "vol-001" },
      }),
      api(`/api/requests/${req2.id}/allocate`, {
        method: "POST",
        headers: { "x-user-id": "coord-001", "x-user-role": "regional_coordinator" },
        body: { assigned_volunteer: "vol-002" },
      }),
    ]);

    // Exactly one must succeed (200) and one must fail with 409 Conflict
    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [200, 409]);

    const failed = res1.status === 409 ? res1 : res2;
    assert.equal(failed.data.code, "INSUFFICIENT_STOCK");

    // Final available stock must be exactly 15 (50 - 35), NEVER negative!
    const updatedItem = await dbStore.getInventoryItem(item.id);
    assert.equal(updatedItem.quantity_available, 15);
    assert.equal(updatedItem.quantity_reserved, 35);
  });
});

describe("8. Idempotency & Duplicate Request Protection", () => {
  test("Duplicate submission with same Idempotency-Key returns cached response without duplicate creation", async () => {
    const key = "idem-test-req-" + Date.now();
    const payload = {
      camp_id: "camp-001",
      priority: 3,
      notes: "First Aid replenish",
      items: [{ inventory_id: "inv-003", quantity_requested: 10 }],
    };

    // First submission
    const res1 = await api("/api/requests", {
      method: "POST",
      headers: {
        "x-user-id": "mgr-001",
        "x-user-role": "camp_manager",
        "idempotency-key": key,
      },
      body: payload,
    });
    assert.equal(res1.status, 201);
    const originalId = res1.data.id;

    // Duplicate submission with same key and body
    const res2 = await api("/api/requests", {
      method: "POST",
      headers: {
        "x-user-id": "mgr-001",
        "x-user-role": "camp_manager",
        "idempotency-key": key,
      },
      body: payload,
    });

    assert.equal(res2.status, 201);
    assert.equal(res2.headers.get("idempotent-replay"), "true");
    assert.equal(res2.data.id, originalId);
  });

  test("Reusing Idempotency-Key with different payload triggers 409 Conflict", async () => {
    const key = "idem-conflict-" + Date.now();

    await api("/api/requests", {
      method: "POST",
      headers: {
        "x-user-id": "mgr-001",
        "x-user-role": "camp_manager",
        "idempotency-key": key,
      },
      body: {
        camp_id: "camp-001",
        priority: 1,
        items: [{ inventory_id: "inv-001", quantity_requested: 10 }],
      },
    });

    // Same key, different body
    const resConflict = await api("/api/requests", {
      method: "POST",
      headers: {
        "x-user-id": "mgr-001",
        "x-user-role": "camp_manager",
        "idempotency-key": key,
      },
      body: {
        camp_id: "camp-001",
        priority: 4, // Changed priority!
        items: [{ inventory_id: "inv-001", quantity_requested: 50 }],
      },
    });

    assert.equal(resConflict.status, 409);
    assert.equal(resConflict.data.code, "IDEMPOTENCY_CONFLICT");
  });
});

describe("9. Dashboard Aggregated Metrics", () => {
  test("GET /api/dashboard/stats returns operational metrics", async () => {
    const res = await api("/api/dashboard/stats", {
      headers: {
        "x-user-id": "coord-001",
        "x-user-role": "regional_coordinator",
      },
    });

    assert.equal(res.status, 200);
    assert.ok(typeof res.data.totalCamps === "number");
    assert.ok(typeof res.data.totalOccupancy === "number");
    assert.ok(typeof res.data.pendingRequests === "number");
    assert.ok(typeof res.data.lowStockItems === "number");
  });
});
