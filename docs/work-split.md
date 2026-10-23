# Multi-Device Work Split Agreement (DisplaceOS)

**Repository:** `https://github.com/kartik7505/DisplaceOS-DisasterReliefCoordinationPlatform.git`  
**Target Deadline:** 4:30 PM IST (Checkpoint Target: 2:40 PM IST)  
**Branch:** `backend-work` (Dedicated backend and integration branch)

---

## 1. Ownership & Boundary Matrix

| Domain | Laptop 1 (This Machine) | Laptop 2 (Frontend Machine) |
| :--- | :--- | :--- |
| **Primary Scope** | Backend implementation, database, concurrency, security, final integration | Frontend UI/UX, responsive views, interactive components, client-side state |
| **Owned Paths** | `server/**`<br/>`server/src/db/**` (migrations, schemas, seed)<br/>`docs/api-contract.md`<br/>`docs/work-split.md`<br/>`package.json` (root)<br/>`.env.example`<br/>`BUILD_STATUS.md`<br/>`.ai-analytics/**` (Laptop 1 logs) | `client/**`<br/>`client/src/**`<br/>`client/package.json`<br/>`client/index.html`<br/>`client/vite.config.ts`<br/>`client/tailwind.config.js`<br/>`FRONTEND_STATUS.md`<br/>`.ai-analytics/**` (Laptop 2 logs) |
| **Branching Rule** | Works on `backend-work`; coordinates branch PR / merge | Works on dedicated branch or merges upstream `backend-work` checkpoint |
| **No-Touch Guarantee** | **Laptop 1 will NOT modify any file inside `client/` after this shared checkpoint.** | Laptop 2 does not modify `server/` or core backend database files. |

---

## 2. Shared Interface Contract

- The single source of truth for all API communication is **[`docs/api-contract.md`](./api-contract.md)**.
- Both teams must keep field names, route paths, HTTP verbs, and error payloads strictly aligned with `api-contract.md`.
- In local development:
  - Backend runs on `http://localhost:4000`
  - Frontend runs on `http://localhost:5173` with Vite proxy `/api` -> `http://localhost:4000`
  - In demo/offline mode, frontend continues to utilize `client/src/lib/demoData.ts` fallback when backend is unavailable.

---

## 3. Communication & Integration Protocol

1. **Shared Checkpoint**: Laptop 1 pushes initial stable checkpoint commit with passing client/server build, database schema, and documentation.
2. **Independent Progress**:
   - Laptop 2 pulls checkpoint and refines client UI according to `docs/api-contract.md`.
   - Laptop 1 completes PostgreSQL transactional integrity, role-based authorization, idempotency, and automated test suite.
3. **Final Integration**: At integration milestone (~2:40 PM IST), Laptop 1 connects live API tests with client build to verify end-to-end workflow:
   `camp manager request` ➔ `coordinator allocate` ➔ `volunteer dispatch` ➔ `delivered`.
