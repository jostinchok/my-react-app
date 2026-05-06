# TODO / Demo Readiness Checklist

Working folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

Git is available in this team repo branch for the final checkpoint. Do not stage real `.env`, `.venv`, `node_modules`, `datasets`, `artifacts`, `models`, `dist`, or `.DS_Store`.

## Top Priority: Canvas Learning Progress

The Canvas-style course/module/item builder is connected from Admin to the Park Guide User Portal. Item progress and quiz attempts now have User API/MySQL persistence; the remaining production-ready follow-up is Admin-facing progress review.

- [x] Add server-side persistence for a user completing a Canvas module item.
- [x] Add server-side persistence for a user submitting a Canvas quiz item and its result.
- [x] After persistence is implemented, refresh the User Portal and confirm completed items and quiz state are preserved when the User API/database is running.
- [ ] Add an Admin-facing view that reads each guide's Canvas progress summary.
- [ ] Keep AI/IoT incident records separate from training progress and keep Admin as the only official incident status updater.

## Project Scope Checklist

| Component | Classification | Demo check |
| --- | --- | --- |
| Review Hub | Demo-ready | Open `http://localhost:5173`; show all direct links, role notes, and optional cybersecurity-control notes. |
| Login/Register/Forgot Password | Demo-ready / Auth-enhanced | Show database-backed login/register/forgot-password OTP flow. Explain production JWT/session route protection is deferred. |
| User/Park Guide portal | Demo-ready | Open `http://localhost:5175/user`; switch User01/User02/User03; show dashboard, API-linked Canvas modules/items, item preview, quiz interaction, checklist rendering, media/resources, persisted completion state with local fallback, certificates, notifications, schedule, profile, and help. |
| Mobile Preview | Partial / Demo-ready | Open `http://localhost:8081`; show mobile-style access to training/account surfaces and backend-loaded modules when the user API is running. |
| Admin Dashboard | Demo-ready | Open `http://localhost:5174/admin`; confirm admin landing page loads. |
| Admin Course / Training / Guide / Badge Pages | Demo-ready | Open `/admin/course`, `/admin/training`, `/admin/course-requests`, `/admin/students`, and `/admin/badge`; confirm Canvas courses/modules/items, resources, guides, enrollment requests, and badges use the admin API. |
| Admin Incident Detection | Demo-ready | Open `http://localhost:5174/admin/detection`; show AI and IoT rows, summary cards, filters, evidence, metadata, ranger recommendations, fallback/live states, and Admin official status update. |
| Park Ranger Console | Demo-ready | Open `http://localhost:5174/admin/ranger`; show response-only role, urgent incidents, field notes, and recommendation buttons. Ranger recommendations do not change official incident status. |
| Backend API | Demo-ready | `curl http://localhost:4000/api/health`; confirm `persistence=mysql`, `requested=mysql`, and `active=mysql`. |
| AI camera script | Demo-ready | Run `scripts/run_ai_camera_monitor.py` from local `.venv`; use `--device-token` when token auth is enabled; press `q` or ESC to stop safely. |
| IoT simulation / physical sensor support | Partial / Demo-ready | Run `cd user_login/server && npm run publish:test-iot` or trigger the physical sensor while Admin Detection is open. Browser capture saves curated evidence under `alerts/iot`, serves `/evidence/iot/<filename>`, and shares the same memory/MySQL incident record with Park Ranger; Admin remains the final status decision maker. |
| MySQL incident persistence | Demo-ready | Apply migration, run with `INCIDENT_STORAGE=mysql` and `INCIDENT_MYSQL_FALLBACK=none`, then query `monitoring_incidents`. |
| Cybersecurity controls | Partial / Demo-ready | Show `CYBERSECURITY_REVIEW.md`, `.env.example`, token generator, optional device tokens, optional role checks, validation behavior, and smoke test output. |
| Evidence/screenshot readiness | Demo-ready | Use README, WORKFLOW, and CYBERSECURITY_REVIEW screenshot checklists. |
| Citrus Energetic UI consistency | Done / Demo-ready | Hub, User Portal, Admin Dashboard, Admin Detection, Park Ranger, and Mobile preview now share the same forest/citrus/cream/lime visual system. |
| Shared demo logo | Done / Demo-ready | Generated logo mark is optimized and applied to the Hub, login surfaces, User Portal, Admin shell, Park Ranger route through Admin navigation, and Mobile preview. |
| Frontend image optimization | Done / Demo-ready | Generated hub hero is 136 KB; training images are WebP files below 100 KB each; `alerts/ai` evidence remains untouched. |

## Before Lecturer Demo

- [ ] Run `npm install` from `/Users/chiayuenkai/Desktop/GitHub/my-react-app`.
- [ ] Recreate `.venv` inside this folder if needed.
- [ ] Install Google Drive helper with `python3 -m pip install gdown`.
- [ ] Download local-only AI assets with `python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"`.
- [ ] Run `python3 scripts/check_required_assets.py`.
- [ ] Confirm `artifacts/clip_2class_touching_species.pt` exists locally.
- [ ] Confirm `models/hand_landmarker.task` exists locally.
- [ ] Confirm `datasets/touching-plants` and `datasets/touching-wildlife` exist locally.
- [ ] Confirm `.env` exists locally and is not staged.
- [ ] Confirm `alerts/ai` contains a few clean demo JPG/JSON evidence pairs.
- [ ] Confirm `alerts/iot` exists for browser-captured IoT evidence.
- [ ] Run `npm --prefix user_page run build`.
- [ ] Run `npm --prefix admin_page run build`.
- [ ] Run `node --check user_login/server/index.js`.
- [ ] Run `node --check scripts/dev-all.mjs`.
- [ ] Run `node --check scripts/hub-server.mjs`.
- [ ] Run `node --check user_login/server/scripts/publish-test-iot.js`.
- [ ] Run `node --check user_login/server/scripts/security-smoke-test.js`.
- [ ] Run `node --check user_login/server/scripts/generate-demo-tokens.js`.
- [ ] Run `source .venv/bin/activate && python -m py_compile scripts/run_ai_camera_monitor.py`.
- [ ] Generate local demo tokens with `cd user_login/server && npm run generate:tokens`.
- [ ] If showing cybersecurity controls, start app with `DEVICE_TOKEN_AUTH_ENABLED=true ROLE_CHECK_ENABLED=true`.
- [ ] Run `cd user_login/server && npm run security:smoke` with the same token values.
- [ ] Run backend API checks in MySQL mode and confirm `/api/health` does not show `active=memory`.
- [ ] Confirm `/api/health` shows `roleCheckEnabled=true` and `statusUpdateRoles` does not include `park_ranger` when role checks are enabled.
- [ ] Create `cos30049_assignment`, apply migration, create/reset `ctip_user`, and run MySQL mode.
- [ ] Create/import `park_guide_database` with `database/db.sql`, then apply `user_login/server/migrations/002_training_platform_tables.sql` for Admin/User training linkage.
- [ ] Apply `user_login/server/migrations/003_canvas_module_items.sql` for Canvas-style module item storage if the table is not already present.
- [ ] Apply `user_login/server/migrations/004_canvas_learning_progress.sql` for Canvas item completion and quiz-attempt persistence.
- [ ] In Admin Course, create or review one Canvas course, module, and item, then open the User Portal and confirm the item renders from the user API.
- [ ] In Admin Detection, trigger IoT once and confirm the 2-second delayed 720p browser capture appears in both Admin and Park Ranger.
- [ ] In Park Ranger Console, submit a recommendation with a field note and confirm the visible official status remains unchanged until Admin updates it.
- [ ] Confirm browser MQTT and backend MQTT do not duplicate the same IoT trigger; same `public_id` or same source/event/sensor within 10 seconds should merge.
- [ ] Capture screenshots listed in README/WORKFLOW.
- [x] Confirm the shared Citrus logo is visible in the hub, User Portal sidebar, Admin sidebar, Park Ranger page through Admin, and Mobile preview.
- [ ] Manually review the UI surfaces for final screenshot framing after starting `npm run dev`.

## Intentionally Deferred

- Admin-facing Canvas guide progress summary UI beyond the User API summary endpoint.
- Production-grade training enrollment approvals, certificate templates, and audit trails beyond the current demo CRUD/API linkage.
- Production-grade authentication and password reset.
- Production-grade JWT/session route protection.
- Private MQTT broker with TLS/authentication.
- Device-token rotation/revocation UI and audit review UI.
- Automated sync from memory fallback incidents into MySQL.
- Further AI threshold/model retraining.
- AI dataset improvement and collection of larger training data.

## Quick Safety Checks

Local-only folders should stay local:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
find . -path './.git' -prune -o -name '.DS_Store' -print
```

Expected: no output outside `.git`.

Check old paths are gone:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
rg "<old absolute repo path>"
```

Expected: no old absolute runbook paths.

Asset setup commands:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3 -m pip install gdown
python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"
python3 scripts/check_required_assets.py
```

Do not commit downloaded `artifacts/`, `datasets/`, `models/`, `.asset-download-tmp/`, real `.env`, `.venv`, `node_modules`, `dist`, or personal alert images.
