# TODO

## Immediate Next Tasks

- Verify login and register work end-to-end with MySQL running and seeded.
- Test admin registration creates a record with `role_id = 1` (admin) in the `users` table.
- Test guide registration creates a record with `role_id = 2` (guide) and a matching `guide_profiles` row.
- Confirm logout clears `localStorage` and returns to the login screen on both portals.
- Verify `user_page` no longer requires a manual browser refresh after logout/login transitions.
- Keep polishing the existing `user_page` Park Guide/User rebuild.
- Visually confirm all module images render on:
  - Dashboard hero image area.
  - Module card image areas.
  - Module Details hero image.
  - Certificate cards with module artwork.
- Polish Dashboard spacing and image balance.
- Polish Module cards and Module Details hero image composition.
- Polish Certificates page visual richness.
- Polish Profile page layout so it feels less empty.
- Check responsive layout at desktop and mobile widths.
- Fix any remaining admin visual polish issues.
- Capture admin incident dashboard screenshots for report evidence.
- Verify live AI/IoT alert sync in the Admin Incident Dashboard.
- Verify AI evidence previews load from `http://localhost:4000/evidence/ai/...` in the admin detail panel.
- Keep frontend seeded data only for now.
- Do not connect Express/MySQL training data yet (auth/login IS now connected).

## Bugs To Fix

- Visual browser review is still needed after the image path helper fix.
- Working tree currently shows generated/install artifact noise under `user_page/dist`, `user_page/node_modules`, and `user_login/server/node_modules`.
- `user_page` build can fail after dependency churn if Rollup optional native packages are missing.
- Backend `/api/health` no longer requires MySQL for incident-sync testing, but it still reports the database as offline until MySQL is running and seeded.
- Root review hub service checks can show backend offline when MySQL is unavailable even though Express itself starts.
- MQTT public broker testing can fail if internet access or the public broker is unavailable; backend should keep running.
- AI evidence path fix is implemented: backend uses configurable `AI_EVIDENCE_DIR`, admin resolves backend evidence URLs.
- Auth login/register requires MySQL to be running and `park_guide_database` seeded; shows "Cannot connect to server" error otherwise.
- Admin register route sets `role_id = 1`; verify the `roles` table seed has `role_id = 1` mapped to `admin` in `db.sql`.
- Keep monitoring auth transitions for regressions after the hook-order fix in `user_page/src/App.jsx`.

## Latest Modification Notes (2026-04-27)

- Added auth gate and role-based auth flows for both portals, connected to backend MySQL auth endpoints.
- Added forgot-password and reset-password UI flows in both portals.
- Added Vite `/api` proxy in `user_page` and `admin_page` to backend `http://localhost:4000` for local development.
- Fixed `user_page` login/logout transition bug that previously required manual refresh:
  - Cause: hook-order instability from returning auth UI before all hooks were declared.
  - Fix: moved auth gate return below hook declarations in `user_page/src/App.jsx`.

## Improvements To Consider

- Add proper `.gitignore` rules for generated build/dependency folders after confirming whether this assignment repo expects them tracked.
- Replace alert-based UI feedback with polished toast messages (auth screens currently use inline error text).
- Add loading/empty/error states for future API-backed sections.
- Add "Forgot password" flow to auth screens (backend endpoint exists at `POST /api/auth/forgot-password`).
- Add session token / JWT so auth survives page refresh without relying solely on `localStorage` plain object.
- Redesign admin and mobile to match the citrus energetic website theme after the user website is stable.
- Add backend endpoints for training modules, quiz progress, notifications, certificates, and file metadata later.
- Live backend/API bridge for AI JSON and IoT MQTT events is now implemented with memory/local JSON storage.
- Add a seeded MySQL setup guide and one command/script for local database import later.
- Add MySQL-backed incident persistence after the live runtime demo and report evidence are stable.
- Add lightweight tests or smoke checks for website build and review launcher.

## Items That Should Not Be Changed Yet

- Do not add optional VR/AR until required Part 1, security, and monitoring requirements are stable.
- Do not physically merge `user_page`, `mobile_app`, `admin_page`, and `user_login/server` into one source app.
- Do not replace the current website GUI with a completely unrelated template.
- Do not remove existing admin/mobile/backend folders.
- Do not delete assignment artifacts such as `Project Scope.pdf`, `Alerts/`, `models/`, or the CTIP notebook unless explicitly requested.
- Do not connect Express/MySQL for training data yet (auth IS now intentionally connected).
- Do not connect Express/MySQL for the Admin Incident Dashboard until the seeded UI and report evidence are stable.
- Do not commit `.DS_Store`, local `node_modules`, or generated `dist` output unless the user explicitly decides the repo must track them.
- Do not remove the `user_login/server/.env` file from `.gitignore`; it contains local DB credentials.

## Auth System — How To Use

### Prerequisites
- MySQL 8 running locally on port 3306.
- `park_guide_database` created and seeded: `mysql -u root -p < user_login/server/db.sql`
- `user_login/server/.env` configured with the correct `DB_PASSWORD`.

### Start All Services
```
npm install        # run once from repo root
npm run dev        # starts hub (5173), user (5175), admin (5174), backend (4000)
```

### Portal Chooser
Open `http://localhost:5173` — the hub landing page now shows a **"Choose Your Portal"** section. Click the card to go to the login screen for that portal.

### Test Credentials (seeded)
| Portal | Email | Password |
|---|---|---|
| Admin | `admin@test.com` | `1234` |
| User / Guide | `guide@test.com` | `1234` |

### Register a New Account
- Click **Register** on the login screen.
- Admin portal: creates an `admin` role account (`role_id = 1`).
- User portal: creates a `guide` role account (`role_id = 2`) + a `guide_profiles` row.
- After successful registration the user is automatically signed in.

### Logout
- Admin portal: fixed **Logout** button in the top-right corner.
- User portal: **Logout** button in the topbar next to Reset Demo.
- Logout clears `localStorage` (`sfc_admin_user` / `sfc_guide_user`) and returns to the login screen.

### Auth Files Added
| File | Purpose |
|---|---|
| `admin_page/src/App.jsx` | Auth wrapper; shows login/register gate before AdminPage |
| `admin_page/src/components/AuthPortal.jsx` | Admin login/register/forgot-password UI |
| `admin_page/src/components/AuthPortal.css` | Admin auth screen styling |
| `user_page/src/components/AuthPortal.jsx` | Guide login/register/forgot-password UI |
| `user_page/src/components/AuthPortal.css` | Guide auth screen styling |
| `user_login/server/.env` | Local DB + MQTT config (not committed) |

### Backend Auth Endpoints
| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/auth/login` | Body: `{ email, password, role }`. Role must match DB role. |
| `POST` | `/api/auth/register` | Body: `{ name, email, password, role }`. Role: `admin` or `guide`. |
| `POST` | `/api/auth/forgot-password` | Body: `{ email }`. Generates reset token for existing account. |
| `POST` | `/api/auth/reset-password` | Body: `{ email, token, newPassword }`. Resets account password when token is valid. |
