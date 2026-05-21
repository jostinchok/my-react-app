# Project Notes

## Admin UI Polish Checkpoint - 2026-05-14

This checkpoint is for the user-requested branch `final-admin-ui-polish`, based on `main`. It is an Admin UI/UX polish pass only: no backend logic, JWT/auth checks, role checks, database schema, migrations, or demo account logic were changed.

Current polish state:

- Active branch: `final-admin-ui-polish`
- Base/local HEAD before the polish diff: `f9951caf1`
- Screenshot evidence was captured locally under `docs/demo-evidence/admin-ui-polish/`; do not stage or commit that folder unless explicitly requested.
- `ADMIN_UI_POLISH_EVIDENCE.md` records the exact screenshots, pages checked, role behavior check, and build/check results.
- Existing local runtime/untracked paths remain local-only, including `user_login/server/data/` and `docs/demo-evidence/`.
- Pre-existing root asset deletions shown by Git status were not part of this polish pass and were not reverted.

Verified during this pass:

- Admin Dashboard was checked with both collapsed and expanded sidebar states.
- Admin pages checked by screenshot: `/admin`, `/admin/course`, `/admin/training`, `/admin/course-requests`, `/admin/students`, `/admin/certificates`, `/admin/detection`, `/admin/ranger-review`, `/admin/sensor-rules`, `/admin/backend-map`, `/admin/analytics`, `/admin/users`, `/admin/permissions`, `/admin/announcements`, `/admin/inbox`, `/admin/help-desk`, and `/admin/audit-log`.
- Admin official status PATCH returned HTTP 200 using the selected incident's existing status.
- Park Ranger official status PATCH returned HTTP 403.
- Park Ranger recommendation returned HTTP 201 and the official incident status stayed unchanged.
- Plant incident wording remains user-facing as `Plucking Plants`.
- Required checks passed: `git diff --check`, `node --check scripts/dev-all.mjs`, `node --check scripts/hub-server.mjs`, `node --check user_login/server/index.js`, `npm --prefix admin_page run build`, `npm --prefix user_page run build`, and `cd login && npm exec vite build`.
- The Admin build still reports Vite's existing large-chunk warning only.

## Final Presentation Status - 2026-05-13

This checkpoint is for final presentation and real-time demo readiness only. Sprint #2 has already been submitted, so this branch should only receive documentation continuity updates and small demo-blocking admin/backend/AI-IoT fixes.

Current branch and remote state:

- Active branch: `main`
- Repository: `jostinchok/my-react-app`
- Pre-promotion checkpoint: `81101f68f` (`Update final demo evidence verification notes`)
- Latest pushed main checkpoint before this hotfix: `04a73968f` (`Add course certificates and admin module hero images`)
- `origin/shared-default-style-v12` pointed to the same checkpoint before the final promotion pass.
- `main` tracks `origin/main`.
- The final login/demo-readiness, CSS touch-up, course certificate, and module hero-image changes are included in pushed main history.
- Current final-demo hotfix work is on `main` because the user explicitly moved the final presentation branch to `main`.

Verified live system status on 2026-05-13:

- Admin page loads at `http://localhost:5174/admin`.
- Admin API health works at `http://localhost:4002/api/health`.
- Main backend health works at `http://localhost:4000/api/health`.
- Main backend incident persistence is active in MySQL with 51 incidents.
- Incident storage reports `requested=mysql`, `active=mysql`, `fallback=none`, and database status `connected`.
- MQTT is enabled and connected to `mqtt://broker.hivemq.com:1883` on topic `ctip/sensor/plant-zone-01/proximity`.
- Evidence routes are exposed at `/evidence/ai` and `/evidence/iot`; the backend redirects those root paths to trailing-slash static routes.
- Security flags report `deviceTokenAuthEnabled=true` and `roleCheckEnabled=true`.
- Official incident status updates are Admin-only through `statusUpdateRoles=["admin"]`.
- Ranger recommendation submission is enabled for Ranger roles through the recommendation endpoint; it must not mutate official incident status.

Latest evidence capture on 2026-05-13:

- Local screenshots were captured under `docs/demo-evidence/2026-05-13/` for backend health, Admin API health, Admin dashboard, Admin Incident Detection, Park Ranger Console, Ranger Review, Sensor Rules, Backend Map, Guide Account Management, and the Edit Guide Account modal.
- `git status --short --branch` confirmed `shared-default-style-v12`; before screenshot capture the only untracked path was `user_login/server/data/`.
- Main backend health returned `status=ok`, `persistence=mysql`, 51 incidents, MQTT connected, `deviceTokenAuthEnabled=true`, `roleCheckEnabled=true`, and `statusUpdateRoles=["admin"]`.
- Admin API health returned `status=ok` and `Admin backend connected to MySQL`.
- Admin route probes returned HTTP 200 for `/admin`, `/admin/detection`, `/admin/ranger`, `/admin/ranger-review`, `/admin/sensor-rules`, `/admin/backend-map`, and `/admin/students`.
- Admin official status update verification returned HTTP 200.
- Park Ranger official status update verification returned HTTP 403.
- Park Ranger recommendation verification returned HTTP 201 and the official incident status stayed unchanged.
- Concrete AI evidence check returned HTTP 200 for `/evidence/ai/2026-04-30_01-06-19_alert_TouchingWildlife.jpg`.
- Concrete IoT evidence check returned HTTP 200 for `/evidence/iot/IOT-BROWSER-2026-05-01T11-56-58-221Z-1777636623157.jpg`.
- Admin Incident Detection text verification found the visible plant label `Plucking Plants` and did not find the deprecated plant label.
- Park Ranger Console text verification found recommendation wording and no official status-change buttons.

Final login/demo-readiness touch-up on 2026-05-13:

- Login UI now has a compact demo account selector for `Admin Demo`, `User 1`, `User 2`, `User 3`, `Ranger 1`, `Ranger 2`, and `Ranger 3`.
- Demo login password is `1234` for each listed account.
- Main backend startup now ensures those demo auth accounts exist when the MySQL auth schema is available. No new auth API endpoint was added.
- Live backend login verification returned HTTP 200 for all seven demo accounts at `POST http://localhost:4000/api/auth/login`.
- Accepted Ranger recommendation headers are normalized to `park_ranger` for incident audit storage. Park Ranger still cannot officially change incident status.
- `npm exec vite build` passed from `login/`.
- Required checks passed: `git diff --check`, `node --check scripts/dev-all.mjs`, `node --check scripts/hub-server.mjs`, `node --check user_login/server/index.js`, and `npm --prefix admin_page run build`.
- Admin production build completed with Vite's large-chunk warning only.

Final CSS/readability touch-up on 2026-05-13:

- Added safe reusable aliases/utilities to `shared/default_style.css`; no existing `user_page` selectors were edited.
- Login now consumes the shared default style layer, has stronger focus states, safer small-height behavior, wrapped messages, and a responsive demo-account grid.
- Admin now has a final readability layer for dense presentation screens: consistent table/header contrast, chip/button sizing, focus rings, form text contrast, horizontal table scrolling, and narrower breakpoint behavior.
- `scripts/dev-all.mjs` now checks the actual Login route at `http://localhost:5176/login/`.
- `git diff --check`, `node --check scripts/dev-all.mjs`, `node --check scripts/hub-server.mjs`, `node --check user_login/server/index.js`, `npm --prefix admin_page run build`, and `cd login && npm exec vite build` passed after the CSS pass.

Final demo login and User Portal hotfix on 2026-05-13:

- The live login issue after switching demo accounts was traced to the auth rate limiter returning `429 Too Many Requests` after only five attempts per hour.
- The backend now applies CORS before auth rate limiting, skips rate limiting for `OPTIONS` preflight requests, and defaults `AUTH_RATE_LIMIT_MAX` to 60 attempts per hour for presentation account switching.
- JWT protection and backend role checks remain enabled; this change does not allow Park Ranger official status updates.
- The User Portal course shell now opens the `Item Detail` tab at the learning-item list, and guided buttons use clearer labels so Park Guides can reach item content during the demo.
- Restart `npm run dev` after pulling this hotfix so the running backend picks up the new rate-limit behavior.

Already pushed:

- The checkpoint through `81101f68f` is already present on `origin/shared-default-style-v12`.
- `main` is pushed through `04a73968f` before this local login/item-detail hotfix.
- Sprint #2 project claims are preserved as prototype-level AI/IoT incident workflow, MySQL incident persistence, MQTT support, device-token security, and role-based Admin/Ranger incident handling.
- Admin can perform official incident status updates.
- Park Ranger can view incidents, add field notes, and submit recommendations only.

Do not touch:

- `user_page` UI/UX files unless the user explicitly asks for a final-demo blocker on that surface. Another teammate owns general User Portal design work.
- Stashed user UI or training notebook changes.
- Branch changes unless the user explicitly asks.
- Local datasets, model artifacts, `.env` secrets, `.venv`, `node_modules`, `dist`, runtime database files, generated incident files, or `user_login/server/data/`.
- Runtime evidence under `alerts/ai` or `alerts/iot` unless the user explicitly asks.
- Package upgrades or `npm audit fix` unless a real demo-blocking issue requires it.

Known local issues:

- `user_login/server/data/` remains untracked runtime data and must stay uncommitted.
- `docs/demo-evidence/` remains untracked local screenshot evidence and must stay uncommitted unless explicitly requested.
- Existing MySQL/runtime incidents can still contain the legacy raw model event key for the old plant class. UI labels should display this as `Plucking Plants`; do not rewrite runtime database rows during final demo prep.
- The AI dataset folder still uses a legacy local plant-class folder name; do not rename it unless the code and local assets are intentionally migrated later.
- Public MQTT, local camera permissions, and MySQL service availability are environment-dependent.
- Evidence route roots return redirects to `/evidence/ai/` and `/evidence/iot/`; use concrete evidence filenames when demonstrating images.

Remaining final-demo risks:

- MySQL must be running before the backend starts, otherwise the demo cannot prove MySQL incident persistence.
- HiveMQ public broker availability can vary; have the local IoT API fallback ready.
- Camera permissions or unavailable AI model assets can block the live camera path; use curated existing evidence as the backup.
- Device-token and role-check environment variables must match the demo script before running the security smoke test.
- The User Portal is out of scope for this final readiness pass and should not be changed to fix admin demo issues.

Team repository folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

This is the active team repository. The completed lecturer-demo work was synced from the local stable source copy `my-react-app1` into this branch for review before merging to `main`.

## Architecture Snapshot

- Root hub: `http://localhost:5173`
- Park Guide web portal: `user_page`, Vite, `http://localhost:5175/user`
- Admin portal: `admin_page`, Vite, `http://localhost:5174/admin`
- Admin training API: `admin_page/adminServer.js`, Express, `http://localhost:4002`
- Park Guide user API: `user_page/server/index.js`, Express, `http://localhost:4001`
- Admin Incident Detection: `http://localhost:5174/admin/detection`
- Park Ranger Alert Console: `http://localhost:5174/ranger`
- Mobile preview: `mobile_app`, Expo web, `http://localhost:8081`
- Backend API: `user_login/server`, Express, `http://localhost:4000`
- AI camera script: `scripts/run_ai_camera_monitor.py`
- Evidence folders: `alerts/ai` for AI camera evidence and `alerts/iot` for browser-captured IoT evidence.
- MySQL database for monitoring incidents: `cos30049_assignment`
- MySQL database for training platform demo data: `park_guide_database`

The training platform now has a demo MySQL integration for Admin-created courses, modules, Canvas-style module items, module hero images, course resources, guide accounts, enrollment requests, and course-level certificates. AI/IoT monitoring incidents still use the separate monitoring incident API and must keep the Admin-only official status workflow.

## Latest Main State: Canvas-Style Course Builder

- `main` includes the Canvas-style Admin Course builder. Admin can create courses, modules, and module items from `/admin/course`.
- Supported Canvas module item types are `page`, `text`, `file`, `image`, `video`, `link`, `quiz`, and `checklist`.
- Canvas module items are stored in `course_module_items` through `user_login/server/migrations/003_canvas_module_items.sql`; the Admin training API also ensures the table before Canvas item operations.
- The Park Guide User Portal reads Canvas-style module items from the user API and renders them as learning items. It supports item preview, media/resource display, quiz interaction, checklist rendering, persisted completion state, and local fallback when the progress API is unavailable.
- The Park Guide User Portal now groups backend modules into a Canvas-like course shell with global SFC Digital Portal navigation plus course-level Overview, Modules, Item Detail, Progress, Files, and Completion navigation.
- `npm run seed:canvas-demo` posts to the Admin API seed endpoint and inserts the three presentation courses into MySQL: SFC Field Response Essentials, Sarawak Protected Wildlife Awareness, and SFC Park Guide Orientation.
- Persistent Canvas learning progress now has a User API and MySQL migration for item completion and quiz attempts. Admin can view persisted guide progress through the Admin training API and `/admin/students`.
- AI/IoT monitoring incidents remain separate from training content. Admin remains responsible for official incident status changes; Park Ranger can add field notes and recommendations only.

## Citrus Energetic UI System

Palette:

- Deep forest green: `#0b3b28` and `#175f3e` for official navigation, admin command surfaces, ranger response headers, and trustworthy system areas.
- Warm citrus orange: `#ff7a1a` for primary actions, active filters, review highlights, and demo call-to-action controls.
- Soft yellow/cream: `#fff8e6`, `#fff9e9`, and `#ffd23f` for warm page backgrounds, learning cards, and approachable guide-facing surfaces.
- Lime green: `#a8e64a` and `#8ac926` for healthy/live/success state, progress indicators, and completion badges.
- Warm charcoal: `#1e2a22` for high-contrast dashboard text and command-center structure.

Component rules:

- Logo usage: use the shared generated Citrus logo as a small app mark in the Hub, User/Park Guide portal, Admin shell, Park Ranger route, and Mobile preview. Keep the optimized WebP/PNG copies below 150 KB and do not use the original generated PNG directly.
- Cards use rounded corners, light borders, cream/white surfaces, and soft green/citrus shadows.
- Buttons use pill or rounded shapes, strong font weight, citrus gradients for primary actions, and forest/cream contrast for secondary actions.
- Status badges use compact rounded pills with source/status-specific colors; live/healthy states should use lime/green, active review states use citrus/yellow, and risk states use warm red/orange.
- Tables use light cream rows, readable dark text, uppercase headers, clear hover/selected states, and no low-contrast dark body rows.
- Evidence images use rounded frames, stable aspect ratios, `object-fit: cover`, and browser-safe URLs such as `/evidence/ai/<filename>` and `/evidence/iot/<filename>`.
- Page spacing uses dashboard-like grids, 16-28px gaps, and wide cards only where the content needs scanning.

Role identity:

- User/Park Guide: warm citrus learning portal with friendly cream cards, orange actions, and progress-focused visuals.
- Admin: command center with warm charcoal/forest structure, citrus cards, monitoring summaries, and clear review hierarchy.
- Park Ranger: field response console with forest green headers, urgent incident emphasis, and citrus response buttons.
- Hub: neutral launcher using the same palette, rainforest hero, service health badges, and direct links.
- Mobile: simplified version of the Park Guide theme with cream surfaces, forest text, and citrus actions.

## Expected Local Structure

```text
my-react-app/
├── .venv/
├── artifacts/clip_2class_touching_species.pt
├── datasets/<plant-class dataset folder>/
├── datasets/touching-wildlife/
├── models/hand_landmarker.task
├── alerts/ai/
└── alerts/iot/
```

`.venv`, `artifacts`, `datasets`, and `models` are local-only. `alerts/ai` and `alerts/iot` are intentionally retained for curated demo evidence.

## Local Asset Setup Contract

Local AI/CV assets are distributed outside GitHub through the shared Google Drive folder. The current documentation uses `<GOOGLE_DRIVE_FOLDER_URL>` as a placeholder unless the real shared URL is provided later.

Teammate setup commands:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3 -m pip install gdown
python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"
python3 scripts/check_required_assets.py
```

`scripts/check_required_assets.py` verifies `artifacts/clip_2class_touching_species.pt`, `models/hand_landmarker.task`, both dataset folders, `alerts/ai`, `alerts/iot`, and `.env`. `scripts/download_assets_gdrive.py` downloads into `.asset-download-tmp/`, copies `artifacts/`, `models/`, and `datasets/` without replacing existing files, creates alert evidence folders, and runs the checker.

Downloaded `artifacts`, `datasets`, `models`, `.asset-download-tmp`, real `.env`, `.venv`, `node_modules`, `dist`, and personal alert images must stay out of Git. AI dataset improvement remains future work and is not part of this merge.

## Project Scope Audit

| Component | Classification | Notes |
| --- | --- | --- |
| Review Hub | Demo-ready | Links all demo surfaces, API endpoints, role notes, and optional security-control notes. |
| Login/Register/Forgot Password | Demo-ready / Auth-enhanced | Demo role accounts and localStorage demo session are visible. Backend auth endpoints hash passwords if the legacy MySQL auth schema is loaded. Frontend route/session hardening remains deferred. |
| Park Guide/User Portal | Demo-ready | Dashboard, module catalog, module detail, quiz, progress view, certificates, notifications, schedule, resources, profile, help, User01/User02/User03 switcher, and visible Park Guide boundaries. Admin-created Canvas courses/modules/items and course resources can load from the user API. Canvas item completion and quiz attempts persist through the User API when `004_canvas_learning_progress.sql` is applied, with local fallback if the API/database is unavailable. |
| Mobile Preview | Partial / Demo-ready | Expo web preview exists for mobile-facing evidence and reads the user training module API when available. Screens are simpler than the full web portal. |
| Admin Dashboard | Demo-ready | Admin command-center overview remains available at `/admin`. |
| Admin Course / Training / Guide / Certificate Pages | Demo-ready | Admin can create/edit/delete Canvas-style courses, modules, and module items; supported item types are page, text, file, image, video, external link, quiz, and checklist. Admin can also select/upload module hero images, upload/download/delete course resources, review enrollment requests, manage guide accounts, view persisted Canvas learning progress, and issue course-level certificates through the admin API after full course completion. |
| Admin Incident Detection | Demo-ready | Shows AI_CAMERA and IOT_SENSOR incidents, summary cards, filters, table, selected detail panel, AI evidence, AI metadata, IoT metadata, fallback/live states, ranger recommendations, and official status updates. Sends admin role header for optional role-check mode. |
| Park Ranger Console | Demo-ready | Standalone `/ranger` page with Ranger login/logout, profile management, escalated/high-severity notifications, sent recommendation review, urgent/new incidents, evidence, metadata, field notes, and Recommend Acknowledged/In Review/Resolved/False Alarm actions. Ranger recommendations do not change the official incident status. |
| Backend API | Demo-ready | `/api/health`, `/api/incidents`, `/api/incidents/summary`, `POST /api/incidents`, `PATCH /api/incidents/:id/status`, `POST /api/incidents/:id/escalate`, and `POST /api/incidents/:id/ranger-recommendation` use MySQL by default for monitoring incidents and support validation, optional tokens, and optional role checks. Official status updates are Admin-only when role checks are enabled. |
| AI camera script | Demo-ready | Supports `--project-dir`, `--evidence-dir`, `--camera-index`, `--backend-url`, optional `--device-token`, automatic `AI_CAMERA_TOKEN` loading from `.env`, JPG/JSON evidence, backend POST, and safe shutdown. |
| IoT simulation / physical sensor support | Partial / Demo-ready | `npm run publish:test-iot` publishes ObjectCloseToPlant payloads to `ctip/sensor/plant-zone-01/proximity` and supports token mode. Physical sensor deployment is environment-dependent. |
| MySQL incident persistence | Demo-ready | Default `INCIDENT_STORAGE=mysql` mode uses `cos30049_assignment`, `ctip_user`, and monitoring tables for AI/IoT incidents only. Memory mode remains an emergency/testing fallback only. |
| Cybersecurity controls | Partial / Demo-ready | `CYBERSECURITY_REVIEW.md`, `.env.example`, browser-safe evidence URLs, payload validation, optional device tokens, optional role checks, demo auth notes, smoke test script, and production hardening recommendations are available. |
| Evidence/screenshot readiness | Demo-ready | README, WORKFLOW, and CYBERSECURITY_REVIEW include screenshot checklists and exact URLs/commands. |

## Monitoring Incident Contract

Supported sources:

```text
AI_CAMERA
IOT_SENSOR
```

Supported event types:

```text
PluckingPlants
TouchingWildlife
ObjectCloseToPlant
```

Supported statuses:

```text
New
Reviewed
Acknowledged
In Review
Resolved
False Alarm
```

Frontend evidence must use browser-safe URLs such as:

```text
/evidence/ai/example.jpg
/evidence/iot/example.jpg
```

Absolute local paths such as `/Users/...` should not be returned to the frontend.

IoT browser capture contract:

- Admin Incident Detection listens to the browser MQTT websocket on `ctip/sensor/plant-zone-01/proximity`.
- A payload is treated as a trigger when `status=triggered` or `distance_cm <= threshold_cm`.
- The browser opens the camera, waits for the frame, delays 2 seconds, compresses one JPEG to max 1280x720, and posts it to `POST /api/incidents/iot-capture`.
- The backend saves the image in `alerts/iot` and returns `/evidence/iot/<filename>`.
- The route uses `X-Actor-Role: admin` instead of exposing `IOT_SENSOR_TOKEN` in frontend code.
- The incident is written through the active memory/MySQL store, so Admin and Park Ranger read the same incident and status from `GET /api/incidents`.
- Deduplication first matches a stable `public_id`; otherwise IoT triggers with the same source, event type, sensor ID, and timestamp within 10 seconds are merged.

## Security Notes

- Real `.env` files must remain local.
- Database credentials are loaded from environment variables, not hardcoded source.
- The backend validates allowed incident source, event type, severity, status, and basic IoT fields.
- AI camera and IoT ingestion can require device tokens with `DEVICE_TOKEN_AUTH_ENABLED=true`.
- Official incident status changes require the Admin role header with `ROLE_CHECK_ENABLED=true`.
- Park Ranger can view incidents, add field notes, and submit status-outcome recommendations for Admin review without changing `incident.status`.
- Canvas training content is connected between Admin and the Park Guide User Portal. Item-level completion and quiz attempts now have User API persistence, and Admin can review guide progress summaries from the Admin training API.
- Admin, Park Ranger, and Park Guide role boundaries are clearly shown in the demo.
- Frontend route guards are intentionally not enforced in production style; this remains documented as a limitation for the tutor check.
- Production MQTT should use a private broker with authentication and TLS.
- Production AI camera and IoT ingestion should require HTTPS and device tokens.
- SSDLC/vulnerability assessment evidence can reference this notes file, `.env.example`, validation code, role-boundary screenshots, and API health/error behavior.

## Recent Demo Prep Changes

- Localized runbook and notebook examples to `/Users/chiayuenkai/Desktop/GitHub/my-react-app`.
- Updated the root hub with direct links for Login/Register, Park Guide, Admin, Admin Detection, Park Ranger, Mobile Preview, API Health, Incidents API, and Incidents Summary API.
- Polished Admin Incident Detection for clearer summary cards, filters, table readability, selected detail panel, evidence preview, metadata, loading, empty, and offline fallback states.
- Polished Park Ranger Console as a response-only field console with urgent incidents, field notes, recommendation actions, and role boundaries.
- Added a demo-safe IoT test publisher fallback: MQTT remains the first path, but public-broker timeouts can fall back to the local incidents API with the same IOT_SENSOR payload.
- Updated documentation for MySQL-first incident persistence, AI camera runtime, IoT simulation, cybersecurity notes, and final screenshot evidence.
- Added an Admin-facing Canvas learning progress summary so `/admin/students` can show guide completion percentage, completed item counts, and latest quiz score from persisted MySQL progress.
- Completed a Citrus Energetic UI consistency pass across the hub, Admin dashboard, Admin Incident Detection, Park Ranger Console, User Portal, and Mobile preview.
- Selectively integrated the useful training-platform features from `origin/New_version` without merging its incident role regression or generated files: Admin course/module/resource management, guide management, course-level certificate issuing, enrollment requests, user resource visibility, and mobile module visibility now share backend data.
- Added the Canvas-style course/module/item builder to the Admin Course page and connected its module items into the Park Guide User Portal learning-item renderer.
- Generated and applied a shared Citrus logo mark across the hub, login surfaces, User Portal, Admin sidebar, Park Ranger route through the Admin shell, and Mobile preview. Optimized copies are 17 KB WebP for browser UI and 80 KB PNG for favicon/mobile usage.
- Fixed the Park Ranger route to render through the Admin shell/sidebar, keeping logo placement and navigation consistent for final demo screenshots.
- Added one generated Sarawak rainforest hero image at `images/citrus-rainforest-hero.webp` and optimized it to 136 KB for the hub background.
- Optimized frontend training images into WebP files under `user_page/public/training/`; each optimized training image is below 100 KB and the large unused PNG originals were removed from the public frontend folder.
- Added demo-safe cybersecurity controls for the tutor check: optional AI/IoT device tokens, Admin-only official status-update role checks, Park Ranger recommendation checks, generated token helper, security smoke test script, and `CYBERSECURITY_REVIEW.md`.
- Completed IoT browser-camera evidence integration: `/api/incidents/iot-capture` saves compressed captures to `alerts/iot`, serves `/evidence/iot/<filename>`, writes through memory/MySQL incident storage, and deduplicates browser/backend MQTT triggers.
- Updated run instructions so `/api/health` should show `persistence=mysql`, `requested=mysql`, `active=mysql`, and `fallback=none` for the lecturer demo.
- Added local asset setup and verification scripts for teammates: `scripts/download_assets_gdrive.py` and `scripts/check_required_assets.py`.


## V16 SQL-Based Canvas Demo Records

The Canvas-style demo courses are now available through `database/demo_canvas_courses.sql`.

Official setup:

~~~bash
mysql -u root -p cos30049_assignment < database/demo_canvas_courses.sql
~~~

This creates real MySQL records for `courses`, `training_modules`, `lessons`, and `course_module_items`.

The Admin Course Builder, Admin Training Overview, and User Portal read these records through backend APIs. `npm run seed:canvas-demo` remains only as an optional developer helper.
