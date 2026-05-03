# Project Notes

Team repository folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

This is the active team repository. The completed lecturer-demo work was synced from the local stable source copy `my-react-app1` into this branch for review before merging to `main`.

## Architecture Snapshot

- Root hub: `http://localhost:5173`
- Park Guide web portal: `user_page`, Vite, `http://localhost:5175/user`
- Admin portal: `admin_page`, Vite, `http://localhost:5174/admin`
- Admin Incident Detection: `http://localhost:5174/admin/detection`
- Park Ranger Alert Console: `http://localhost:5174/admin/ranger`
- Mobile preview: `mobile_app`, Expo web, `http://localhost:8081`
- Backend API: `user_login/server`, Express, `http://localhost:4000`
- AI camera script: `scripts/run_ai_camera_monitor.py`
- Evidence folders: `alerts/ai` for AI camera evidence and `alerts/iot` for browser-captured IoT evidence.
- MySQL database for monitoring incidents only: `cos30049_assignment`

The training platform is seeded frontend demo data. The backend and MySQL integration are scoped to AI/IoT monitoring incidents only.

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
├── datasets/touching-plants/
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

`scripts/check_required_assets.py` verifies `artifacts/clip_2class_touching_species.pt`, `models/hand_landmarker.task`, both dataset folders, `alerts/ai`, `alerts/iot`, and `user_login/server/.env`. `scripts/download_assets_gdrive.py` downloads into `.asset-download-tmp/`, copies `artifacts/`, `models/`, and `datasets/` without replacing existing files, creates alert evidence folders, and runs the checker.

Downloaded `artifacts`, `datasets`, `models`, `.asset-download-tmp`, real `.env`, `.venv`, `node_modules`, `dist`, and personal alert images must stay out of Git. AI dataset improvement remains future work and is not part of this merge.

## Project Scope Audit

| Component | Classification | Notes |
| --- | --- | --- |
| Review Hub | Demo-ready | Links all demo surfaces, API endpoints, role notes, and optional security-control notes. |
| Login/Register/Forgot Password | Partial / Demo-ready | Demo role accounts and localStorage demo session are visible. Backend auth endpoints hash passwords if the legacy MySQL auth schema is loaded. Production route/session auth is deferred. |
| Park Guide/User Portal | Demo-ready | Dashboard, module catalog, module detail, quiz, progress, certificates, notifications, schedule, resources, profile, help, User01/User02/User03 switcher, and visible Park Guide boundaries. |
| Mobile Preview | Partial / Demo-ready | Expo web preview exists for mobile-facing evidence. Screens are simpler than the full web portal. |
| Admin Dashboard | Demo-ready | Admin command-center overview remains available at `/admin`. |
| Admin Incident Detection | Demo-ready | Shows AI_CAMERA and IOT_SENSOR incidents, summary cards, filters, table, selected detail panel, AI evidence, AI metadata, IoT metadata, fallback/live states, and status updates. Sends admin role header for optional role-check mode. |
| Park Ranger Console | Demo-ready | Response-only view with urgent/new incidents, evidence, metadata, field notes, and Acknowledged/In Review/Resolved/False Alarm actions. Sends park_ranger role header for optional role-check mode. |
| Backend API | Demo-ready | `/api/health`, `/api/incidents`, `/api/incidents/summary`, `POST /api/incidents`, and `PATCH /api/incidents/:id/status` use MySQL by default for monitoring incidents and support validation, optional tokens, and optional role checks. |
| AI camera script | Demo-ready | Supports `--project-dir`, `--evidence-dir`, `--camera-index`, `--backend-url`, optional `--device-token`, automatic `AI_CAMERA_TOKEN` loading from `user_login/server/.env`, JPG/JSON evidence, backend POST, and safe shutdown. |
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
TouchingPlants
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
- Incident status changes can require Admin or Park Ranger role headers with `ROLE_CHECK_ENABLED=true`.
- Admin, Park Ranger, and Park Guide role boundaries are clearly shown in the demo.
- Frontend route guards are intentionally not enforced in production style; this remains documented as a limitation for the tutor check.
- Production MQTT should use a private broker with authentication and TLS.
- Production AI camera and IoT ingestion should require HTTPS and device tokens.
- SSDLC/vulnerability assessment evidence can reference this notes file, `.env.example`, validation code, role-boundary screenshots, and API health/error behavior.

## Recent Demo Prep Changes

- Localized runbook and notebook examples to `/Users/chiayuenkai/Desktop/GitHub/my-react-app`.
- Updated the root hub with direct links for Login/Register, Park Guide, Admin, Admin Detection, Park Ranger, Mobile Preview, API Health, Incidents API, and Incidents Summary API.
- Polished Admin Incident Detection for clearer summary cards, filters, table readability, selected detail panel, evidence preview, metadata, loading, empty, and offline fallback states.
- Polished Park Ranger Console as a response-only field console with urgent incidents, field notes, status actions, and role boundaries.
- Added a demo-safe IoT test publisher fallback: MQTT remains the first path, but public-broker timeouts can fall back to the local incidents API with the same IOT_SENSOR payload.
- Updated documentation for MySQL-first incident persistence, AI camera runtime, IoT simulation, cybersecurity notes, and final screenshot evidence.
- Completed a Citrus Energetic UI consistency pass across the hub, Admin dashboard, Admin Incident Detection, Park Ranger Console, User Portal, and Mobile preview.
- Generated and applied a shared Citrus logo mark across the hub, login surfaces, User Portal, Admin sidebar, Park Ranger route through the Admin shell, and Mobile preview. Optimized copies are 17 KB WebP for browser UI and 80 KB PNG for favicon/mobile usage.
- Fixed the Park Ranger route to render through the Admin shell/sidebar, keeping logo placement and navigation consistent for final demo screenshots.
- Added one generated Sarawak rainforest hero image at `images/citrus-rainforest-hero.webp` and optimized it to 136 KB for the hub background.
- Optimized frontend training images into WebP files under `user_page/public/training/`; each optimized training image is below 100 KB and the large unused PNG originals were removed from the public frontend folder.
- Added demo-safe cybersecurity controls for the tutor check: optional AI/IoT device tokens, optional Admin/Park Ranger status-update role checks, generated token helper, security smoke test script, and `CYBERSECURITY_REVIEW.md`.
- Completed IoT browser-camera evidence integration: `/api/incidents/iot-capture` saves compressed captures to `alerts/iot`, serves `/evidence/iot/<filename>`, writes through memory/MySQL incident storage, and deduplicates browser/backend MQTT triggers.
- Updated run instructions so `/api/health` should show `persistence=mysql`, `requested=mysql`, `active=mysql`, and `fallback=none` for the lecturer demo.
- Added local asset setup and verification scripts for teammates: `scripts/download_assets_gdrive.py` and `scripts/check_required_assets.py`.
