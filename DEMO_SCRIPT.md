# DisplaceOS — Demonstration Script (Uttarakhand Relief Scenario)

> **SIMULATION NOTICE:**  
> All facilities, personnel, contact numbers, and disaster scenarios documented herein are **strictly synthetic and fictional**. They are created for development, testing, and evaluation of the DisplaceOS coordination engine. No operational camps, government affiliations, or real live emergency incidents are implied.

---

## Scenario Overview: Monsoon Flash Flood & Landslide Response (Garhwal & Kumaon)

* **Disaster Simulation Context:** Severe monsoon cloudbursts in the Alaknanda and Mandakini river valleys have triggered localized landslides, cutting road connectivity along mountain stretches between Rishikesh and Chamoli. The Maldevta valley sector in Dehradun has sustained access disruption.
* **Operational Scope:** Fictional relief camps in Dehradun, Rudraprayag, Chamoli, Haridwar, Nainital, and Pithoragarh require critical supplies (woolen blankets, drinking water, rice, atta, dal, ORS packets, and trauma first-aid kits).
* **Core Logistics Workflow:**  
  $$\text{Camp Requisition} \longrightarrow \text{Zonal Stock Allocation} \longrightarrow \text{Mountain Transit Dispatch} \longrightarrow \text{Camp Delivery Confirmation}$$

---

## Synthetic Operators & Credentials

| Role | Synthetic Operator | System ID | Fictional Assignment | Quick Login Action |
| :--- | :--- | :--- | :--- | :--- |
| **Camp Manager** | **Asha Rawat** | `mgr-001` | Maldevta Relief Shelter (Dehradun) | Click **Camp Manager** card |
| **Regional Coordinator** | **Meera Joshi** | `coord-001` | Garhwal Central Division Depot (Rishikesh) | Click **Regional Coordinator** card |
| **Volunteer Courier** | **Ravi Bisht** | `vol-001` | Mountain Courier Network (Garhwal) | Click **Volunteer** card |
| **Administrator** | **Anjali Sharma** | `admin-001` | State Operations Centre (Dehradun HQ) | Click **Administrator** card |

---

## Step-by-Step Demonstration Walkthrough

### Step 1: Shelter Requisition (Camp Manager — Asha Rawat)

1. Open the application at [`http://localhost:5173/login`](http://localhost:5173/login).
2. Under **Demo Quick Login**, click the **Camp Manager** card (`Asha Rawat`).
3. You are redirected to `/dashboard`, showing:
   * Current Camp: **Maldevta Relief Shelter (Fictional)**.
   * District: Dehradun.
   * Active disaster context badge: *Monsoon flash flood & landslide simulation*.
4. Navigate to **Supply Requests** (`/requests`).
5. Click **+ New Request**:
   * Priority: **P1 — Critical Emergency**.
   * Notes: *"Approach road near Maldevta bridge washed out; 65 displaced families requiring immediate thermal blankets, rations, and potable water."*
   * Add Items:
     * **Heavy Woolen Blankets (Thermal):** 60 units.
     * **WHO-Standard ORS Rehydration Packets:** 100 boxes.
     * **Non-Perishable Rice (10kg Ration Bags):** 30 bags.
   * Click **Submit Relief Request**.

---

### Step 2: Zonal Stock Allocation & Reservation (Regional Coordinator — Meera Joshi)

1. Sign out or switch user to **Regional Coordinator** (`Meera Joshi`) via Quick Login.
2. Navigate to **Inventory** (`/inventory`):
   * Review Garhwal Central Division depot stock levels.
   * Notice Indian number formatting (`en-IN` lakhs/thousands) and standard depot units (bags, cans, boxes, tarps).
3. Navigate to **Supply Requests** (`/requests`):
   * Locate the pending P1 request from **Maldevta Relief Shelter**.
   * Click **Approve & Allocate Stock**.
4. **Behind the Scenes Transaction:**
   * The backend executes an atomic row lock on Garhwal inventory.
   * Stock is reserved: `quantity_available` is decremented and `quantity_reserved` is incremented.
   * Volunteer **Ravi Bisht** (`vol-001`) is assigned to the consignment manifest.
   * Request status transitions from `pending` to `allocated`.

---

### Step 3: Mountain Transit Dispatch (Volunteer Courier — Ravi Bisht)

1. Switch user to **Volunteer Courier** (`Ravi Bisht`) via Quick Login.
2. The dashboard updates to volunteer scope, showing assigned transport runs.
3. Navigate to **My Deliveries** (`/deliveries`):
   * Inspect the consignment manifest for **Maldevta Relief Shelter**.
   * Review mountain route advisories and access notes.
4. Click **Mark as Dispatched (Mountain Transit)**.
   * Status updates to `dispatched` with an IST timestamp recorded (`Asia/Kolkata`).
   * The consignment is now marked as in-transit across Garhwal mountain roads.

---

### Step 4: Receiving & Camp Delivery Confirmation (Asha Rawat / Ravi Bisht)

1. Once the convoy reaches the Maldevta shelter, click **Confirm Camp Delivery**.
2. **Behind the Scenes Accounting:**
   * Status transitions to `delivered`.
   * Reserved depot stock is cleared from `quantity_reserved` into delivered status.
   * The delivery timestamp is permanently logged.
   * Both Camp Manager and Coordinator dashboards immediately reflect the fulfilled quota.

---

### Step 5: State Operations Centre Overview (Administrator — Anjali Sharma)

1. Sign in as **Administrator** (`Anjali Sharma`).
2. Navigate to **Crisis Map** (`/map`):
   * MapLibre GL is centered on Uttarakhand coordinates (`79.2000° E, 30.1500° N`, zoom level 7.6).
   * Metric scale bar (km/m) positioned at bottom-right.
   * Inspect fictional relief camps across key districts:
     * **Dehradun:** Maldevta Relief Shelter (180/450 occupancy).
     * **Rudraprayag:** Rudraprayag Sangam Evacuation Camp (220/350 occupancy).
     * **Chamoli:** Joshimath-Pipalkoti Transit Camp (140/280 occupancy).
     * **Nainital:** Nainital Valley Emergency Shelter (95/300 occupancy).
     * **Pithoragarh:** Pithoragarh Foothills Staging Base (60/200 occupancy).
     * **Haridwar:** Haridwar Ganga Basin Camp (310/500 occupancy).
   * Click any facility marker to view fictional capacity, current occupancy, and district details.
3. Review **Operational Dashboard** (`/dashboard`):
   * Regional aggregate metrics with Indian numbering (`en-IN`).
   * Zonal stock distribution and low-stock indicators.
   * Fictional incident simulation stream.

---

## Technical Architecture Highlights

1. **ACID Transaction Row-Level Locking:** Prevents over-allocation even under high concurrent demand.
2. **Idempotency Protection:** `Idempotency-Key` prevents double-dispatch during erratic mountain network connectivity.
3. **Strict Production Security:** Development identity headers are safely rejected in production environments.
4. **Authentic Regional Localization:** Standard Hindi terminology, Indian numbering, and IST timestamps without garbled characters.
