# DisplaceOS API Contract

> **Version:** 1.0.0-rc1  
> **Target Release:** Disaster Relief Coordination Platform  
> **Base URL:** `http://localhost:4000/api` (Local) / `/api` (Production / Vite proxy)  
> **Status Tagging:** `[IMPLEMENTED]` vs `[PLANNED]`

---

## 1. Authentication & Security Model

### Authentication Mechanism
Requests authenticate via either:
1. **Supabase JWT:** `Authorization: Bearer <access_token>` (Production / Live mode)
2. **Development / Automated Test Mode:** When `NODE_ENV !== "production"` or `ALLOW_DEV_AUTH=true`:
   - `x-user-id: <uuid>` (Profile ID)
   - `x-user-role: admin | regional_coordinator | camp_manager | volunteer`
   - `x-user-region: <uuid>` (Optional, scope coordinator to region)
   - `x-user-camp: <uuid>` (Optional, scope manager to camp)

### Error Format
All errors return consistent JSON:
```json
{
  "error": "Human readable error description",
  "code": "ERROR_CODE_ENUM",
  "details": {}
}
```

Standard Status Codes:
- `400 Bad Request`: Validation failure, negative quantities, missing fields
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Role not authorized for this action or scope mismatch
- `404 Not Found`: Resource ID not found
- `409 Conflict`: Competing allocation, duplicate idempotency key, or state machine conflict
- `500 Internal Server Error`: Server exception

---

## 2. Roles & Permissions Matrix

| Role | Camp Scope | Region Scope | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **`admin`** | Global | Global | Full read/write access to all resources and transitions. |
| **`regional_coordinator`** | All camps in region | Assigned region | View camp requests, reserve & allocate regional inventory, assign volunteers. |
| **`camp_manager`** | Assigned camp | Regional read | Create supply requests, view camp stock, track incoming dispatches. |
| **`volunteer`** | Assigned tasks | Assigned region | View assigned dispatches, trigger `dispatched` and `delivered` transitions. |

---

## 3. Data Dictionary & Enumerations

### Request Statuses (Strict Sequential Lifecycle)
```
[pending] ──(approve)──> [approved] ──(allocate)──> [allocated] ──(dispatch)──> [dispatched] ──(deliver)──> [delivered]
    │                         │                          │
    └──(cancel)───────────────┴──(cancel)────────────────┴──(cancel)──> [cancelled]
```

- `pending`: Request submitted by Camp Manager; awaiting regional review.
- `approved`: Validated by Regional Coordinator; awaiting stock allocation.
- `allocated`: Stock locked/reserved from regional inventory; volunteer assigned.
- `dispatched`: Volunteer has departed warehouse with physical supplies in transit.
- `delivered`: Supplies handed over at camp; reserved inventory officially deducted; request completed.
- `cancelled`: Terminated before dispatch; all reserved quantities returned to available stock.

### Supply Categories
- `food`
- `water`
- `medicine`
- `shelter`
- `clothing`
- `hygiene`
- `tools`
- `other`

### Standard Quantity Units
- `bags` (e.g. Rice 5kg, grain)
- `bottles` (e.g. Bottled water 1L)
- `kits` (e.g. First Aid kits, Hygiene kits)
- `units` (e.g. Emergency blankets)
- `packs` (e.g. Emergency rations)
- `sheets` (e.g. Tarpaulin)
- `bundles` (e.g. Medicines)
- `boxes` (e.g. General supplies)

---

## 4. Endpoints Specification

### 4.1 System & Health

#### `GET /api/health` `[IMPLEMENTED]`
- **Description:** Server liveness and readiness probe.
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-23T13:30:00.000Z",
  "env": "development"
}
```

---

### 4.2 Regions & Camps

#### `GET /api/regions` `[IMPLEMENTED]`
- **Description:** List disaster response regions.
- **Access:** Authenticated
- **Response `200 OK`:**
```json
[
  {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "name": "North Zone",
    "description": "Northern flood relief region",
    "center_lat": 28.7041,
    "center_lng": 77.1025,
    "is_active": true,
    "created_at": "2026-10-01T00:00:00Z"
  }
]
```

#### `GET /api/camps` `[IMPLEMENTED]`
- **Description:** List relief camps with current occupancy and capacities.
- **Access:** Authenticated
- **Query Params:** `region_id` (optional UUID)
- **Response `200 OK`:**
```json
[
  {
    "id": "camp-001-uuid",
    "name": "Alpha Relief Camp",
    "region_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "region_name": "North Zone",
    "capacity": 500,
    "current_occupancy": 342,
    "lat": 28.6139,
    "lng": 77.2090,
    "is_active": true
  }
]
```

---

### 4.3 Regional Inventory / Warehouses

#### `GET /api/inventory` `[IMPLEMENTED]`
- **Description:** Fetch stock items with available vs reserved counts.
- **Access:** Authenticated
- **Query Params:** `region_id` (UUID, required for non-admins)
- **Response `200 OK`:**
```json
[
  {
    "id": "inv-001-uuid",
    "region_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "name": "Bottled Water (1L)",
    "category": "water",
    "unit": "bottles",
    "quantity_available": 1800,
    "quantity_reserved": 200,
    "reorder_threshold": 200,
    "updated_at": "2026-10-23T12:00:00Z"
  }
]
```

#### `POST /api/inventory` `[IMPLEMENTED]`
- **Description:** Add or restock inventory items.
- **Access:** `admin`, `regional_coordinator`
- **Request Body:**
```json
{
  "region_id": "a1b2c3d4-0000-0000-0000-000000000001",
  "name": "First Aid Kits",
  "category": "medicine",
  "unit": "kits",
  "quantity_available": 100,
  "reorder_threshold": 20
}
```

---

### 4.4 Supply Requests & Lifecycle Workflow

#### `POST /api/requests` `[IMPLEMENTED]`
- **Description:** Camp Manager submits a new supply request. Supports `Idempotency-Key` header.
- **Access:** `camp_manager`, `admin`
- **Headers:** `Idempotency-Key: <unique-string>` (Optional but recommended)
- **Request Body:**
```json
{
  "camp_id": "camp-001-uuid",
  "priority": 1,
  "notes": "Urgent drinking water shortage due to localized contamination",
  "items": [
    {
      "inventory_id": "inv-001-uuid",
      "quantity_requested": 500
    }
  ]
}
```
- **Response `201 Created`:**
```json
{
  "id": "req-001-uuid",
  "camp_id": "camp-001-uuid",
  "requested_by": "user-uuid",
  "status": "pending",
  "priority": 1,
  "notes": "Urgent drinking water shortage",
  "created_at": "2026-10-23T13:30:00Z",
  "items": [
    {
      "id": "item-001-uuid",
      "inventory_id": "inv-001-uuid",
      "quantity_requested": 500,
      "quantity_allocated": null
    }
  ]
}
```

#### `GET /api/requests` `[IMPLEMENTED]`
- **Description:** List supply requests scoped to caller role.
- **Access:** Authenticated
- **Query Params:** `status`, `camp_id`, `region_id`
- **Response `200 OK`:** Array of SupplyRequest objects with nested items and status metadata.

#### `GET /api/requests/:id` `[IMPLEMENTED]`
- **Description:** Retrieve specific request by ID with full item details and audit events.
- **Access:** Authorized user (Admin, Region Coordinator, Requesting Manager, or Assigned Volunteer)

#### `POST /api/requests/:id/approve` `[IMPLEMENTED]`
- **Description:** Coordinator approves request for allocation.
- **Access:** `regional_coordinator`, `admin`
- **Response `200 OK`:** Updated request with status `"approved"`.

#### `POST /api/requests/:id/allocate` `[IMPLEMENTED]`
- **Description:** Atomic transaction: reserves stock in regional warehouse and assigns volunteer.
- **Access:** `regional_coordinator`, `admin`
- **Concurrency Protection:** PostgreSQL `SELECT ... FOR UPDATE` row-locking prevents competing over-allocation.
- **Request Body:**
```json
{
  "assigned_volunteer": "volunteer-user-uuid",
  "allocations": [
    {
      "inventory_id": "inv-001-uuid",
      "quantity_allocated": 500
    }
  ]
}
```
- **Response `200 OK`:** Request updated to status `"allocated"`.
- **Response `409 Conflict`:** Insufficient available inventory to satisfy requested quantity.

#### `POST /api/requests/:id/dispatch` `[IMPLEMENTED]`
- **Description:** Assigned volunteer or coordinator marks physical supplies in transit.
- **Access:** Assigned `volunteer`, `admin`
- **Response `200 OK`:** Request updated to status `"dispatched"`, `dispatched_at` timestamp recorded.

#### `POST /api/requests/:id/deliver` `[IMPLEMENTED]`
- **Description:** Confirms handover at camp. Atomically deducts reserved stock and finalizes request.
- **Access:** Assigned `volunteer`, `camp_manager`, `admin`
- **Response `200 OK`:** Request updated to status `"delivered"`, `delivered_at` timestamp recorded.

#### `POST /api/requests/:id/cancel` `[IMPLEMENTED]`
- **Description:** Cancels request. If previously allocated, releases reserved stock back to available pool.
- **Access:** `camp_manager` (if pending/approved), `regional_coordinator`, `admin`
- **Request Body:**
```json
{
  "reason": "Alternative supply sourced locally"
}
```
- **Response `200 OK`:** Request updated to status `"cancelled"`.

---

## 5. Audit Logging & Verification

Every state transition records an entry in the `activity_log` table:
```json
{
  "actor_id": "uuid",
  "action": "request.allocated",
  "entity_type": "supply_request",
  "entity_id": "req-uuid",
  "details": {
    "assigned_volunteer": "vol-uuid",
    "items_allocated": [{"inventory_id": "inv-uuid", "quantity": 500}]
  }
}
```
