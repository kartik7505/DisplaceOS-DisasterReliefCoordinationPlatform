# DisplaceOS — Disaster Relief Coordination Platform

**Regional Deployment:** Uttarakhand Node — Garhwal & Kumaon Mountain Districts  
**Repository Branch:** `backend-work`  
**License:** MIT

> ⚠️ **IMPORTANT SIMULATION NOTICE:**  
> All relief facilities, personnel, phone numbers, inventory records, and disaster incident cards presented in this platform are **strictly fictional and synthetic**. They are created for testing, evaluation, and demonstration purposes only. They do **not** represent live emergency incidents, active operational camps, or official government agencies.

---

## 1. Overview & Core Mission

DisplaceOS is a mission-critical disaster relief coordination platform engineered to manage emergency supply chains during natural disasters in complex mountain terrain. The platform coordinates four primary operational roles across a four-stage supply lifecycle:

$$\textbf{Camp Requisition} \longrightarrow \textbf{Zonal Stock Allocation} \longrightarrow \textbf{Mountain Transit Dispatch} \longrightarrow \textbf{Camp Delivery Confirmation}$$

### Uttarakhand Disaster Simulation Scenario
* **Context:** Synthetic monsoon cloudburst and landslide scenarios along the Alaknanda and Mandakini river valleys disrupting road connectivity across Dehradun, Rudraprayag, and Chamoli mountain corridors.
* **Locally Relevant Relief Items:**
  * **Food Rations:** Non-Perishable Rice (10kg bags), Whole Wheat Atta (10kg sacks), Arhar & Chana Dal (5kg bags).
  * **Hydration:** Packaged Drinking Water (20L Jerry Cans).
  * **Shelter & Warmth:** Thermal Heavy Woolen Blankets, Heavy-Duty Waterproof Tarpaulins (12×18 ft).
  * **Medical Supplies:** Emergency Trauma First-Aid & Dressing Kits, WHO-Standard ORS Rehydration Packets.
  * **Hygiene & Maternal:** Family Hygiene Kits, Sanitary Pads (Multipack of 24), Infant Care & Baby Formula Supplies.

---

## 2. Synthetic Indian Personnel & Roles

All test identities preserve stable database UUIDs and RBAC security boundaries:

| Role | Operator Name | System ID | Designated Area |
| :--- | :--- | :--- | :--- |
| **Administrator** | **Anjali Sharma** | `admin-001` | State Operations Centre, Dehradun HQ |
| **Regional Coordinator** | **Meera Joshi** | `coord-001` | Garhwal Central Division Depot, Rishikesh |
| **Camp Manager** | **Asha Rawat** | `mgr-001` | Maldevta Relief Shelter, Dehradun |
| **Volunteer** | **Ravi Bisht** | `vol-001` | Mountain Courier Network, Garhwal |

---

## 3. Indian Presentation & Localization Standards

* **Number Formatting:** Standard `en-IN` numbering (`formatNumberIN` formatted as e.g., `1,25,000` units).
* **Currency:** Indian Rupee (`₹`) applied exclusively to monetary budgets.
* **Timestamps:** Rendered in Indian Standard Time (`Asia/Kolkata`, IST: UTC+5:30) while storing pure UTC ISO-8601 strings internally.
* **Phone Formatting:** Standard Indian format `+91 98XXX XXXXX` (clearly marked fictional).
* **Interface Language:** Clear, accessible English language across all operational displays.
* **Clean UTF-8:** Zero corrupted characters or broken encoding artifacts (`??`, `Ã—`, `â€”`).

---

## 4. Architecture & Technology Stack

* **Frontend:** React 18, TypeScript, TailwindCSS, Zustand (state management), MapLibre GL (crisis map centered on Uttarakhand: `[79.2000, 30.1500]`, zoom 7.6).
* **Backend:** Node.js, Express 5, TypeScript.
* **Database & Data Store:**
  * PostgreSQL (Supabase / pg) with transactional schema (`server/src/db/schema.sql`).
  * In-memory ACID fallback store with row-level mutex locking on inventory items to prevent concurrent over-allocation.
* **Security & Hardening:**
  * Strict production authentication: dev headers (`x-user-role`, `x-user-camp`) are rejected in production mode.
  * In non-production demo mode, role headers allow seamless testing of RBAC policies.
  * Idempotency protection (`Idempotency-Key` header with SHA-256 payload hashing) prevents double-allocation on retried mountain mobile connections.

---

## 5. Quick Start & Local Development

### Prerequisites
* Node.js v18+ (tested on Node v24.20.0)
* Python 3.10+ (for prompt governance verification)

### Running the Services

1. **Install Dependencies:**
   ```bash
   npm install --prefix client
   npm install --prefix server
   ```

2. **Start Backend (Port 4000):**
   ```bash
   npm run dev --prefix server
   ```
   *Health Check:* `http://localhost:4000/api/health`

3. **Start Frontend (Port 5173):**
   ```bash
   npm run dev --prefix client
   ```
   *Application URL:* `http://localhost:5173/`

4. **Run Backend Test Suite:**
   ```bash
   npm test --prefix server
   ```
   *(Executes 18 comprehensive tests covering RBAC, row locking, stock accounting, idempotency, and security boundaries).*

---

## 6. Database Migrations

* `server/src/db/schema.sql`: Full DDL schema for regions, camps, inventory, requests, request items, and audit logs.
* `server/src/db/seed.sql`: Baseline synthetic Uttarakhand relief facilities and inventory.
* `server/src/db/migrations/002_uttarakhand_synthetic_data.sql`: Scoped non-destructive migration that updates synthetic entities without dropping tables or altering real operational records.

---

## 7. Demonstration Script

For a comprehensive step-by-step evaluation walkthrough, consult [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).

---

## 8. AI Prompt Governance Kit

Every prompt a team member provides to an AI assistant in this repository is logged word for word to `.ai-analytics/<member>.jsonl`, committed with their work, and categorized on a fixed rubric.

### Enforced Rules
- Log every prompt, word for word, to `.ai-analytics/`.
- Prompt logs are append-only; tampering breaks the SHA-256 hash chain.
- Verify log integrity at any time:
  ```bash
  python3 scripts/log_prompt.py verify
  python3 scripts/log_prompt.py report
  ```
