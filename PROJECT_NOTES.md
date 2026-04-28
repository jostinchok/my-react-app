# Project Notes

## Current Project State

Checkpoint date: 2026-04-27.

This project is a Sarawak Forestry Corporation digital park guide training platform based on `Project Scope.pdf`.

Current working directory:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

The repo is still organized as separate surfaces:

- `user_page`: guide-facing website and current main implementation target.
- `mobile_app`: React Native / Expo guide-facing mobile app.
- `admin_page`: admin website.
- `admin_page/src/pages/ParkRangerConsole.jsx`: Park Ranger incident-response console.
- `user_login/server`: Express/MySQL backend.
- root project: review launcher and review hub.

Current active scope is Part 1: Interactive Digital Training Platform. The latest implementation pass rebuilt the `user_page` Park Guide/User side using front-end seeded demo data only. Express/MySQL integration is intentionally deferred.

## Current UI Direction

The user-side website is moving toward a citrus energetic theme:

- Fresh, modern, outdoors, nature-tech feeling.
- Citrus orange, lime, warm yellow, cream, leaf green, dark forest, and charcoal contrast.
- Rounded-but-controlled 8px cards, high-contrast dashboard panels, bright progress bars, clear chips, and realistic nature training visuals.
- Product-like user experience instead of a generic admin template.
- Mobile-responsive layout with sidebar collapse and card/grid breakpoints.

## Current Folder/File Structure

```text
my-react-app/
├── .venv/
├── Project Scope.pdf
├── README.md
├── PROJECT_NOTES.md
├── TODO.md
├── package.json
├── package-lock.json
├── index.html
├── scripts/
│   ├── dev-all.mjs
│   └── hub-server.mjs
├── login/
│   ├── hub.css
│   └── hub.js
├── user_page/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/training/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── data/trainingPlatform.js
├── mobile_app/
├── admin_page/
├── user_login/server/
├── alerts/
│   └── ai/
├── artifacts/
│   └── clip_2class_touching_species.pt
├── datasets/
│   ├── touching-plants/
│   └── touching-wildlife/
├── models/
│   └── hand_landmarker.task
└── images/
```

The Google Drive `cos30049-assignment-assets` package is only the download source.
After download, `artifacts/`, `datasets/`, and `models/` stay inside the project
working directory as local-only ignored folders. `.venv/` must be recreated
inside `my-react-app`, not moved from another checkout. `alerts/` stays inside
the repo and is not ignored so selected demo AI evidence can be committed.

## Important Files

- `Project Scope.pdf`: assignment source file.
- `package.json`: root launcher scripts for one-command review.
- `scripts/dev-all.mjs`: starts the review services.
- `scripts/hub-server.mjs`: serves the root review hub on `localhost:5173`.
- `index.html`: root review hub page.
- `login/hub.css` and `login/hub.js`: review hub styling and service checks.
- `user_page/src/App.jsx`: rebuilt guide-facing user portal UI.
- `user_page/src/App.css`: citrus energetic visual system and responsive layout.
- `user_page/src/index.css`: Vite/global reset cleanup.
- `user_page/src/data/trainingPlatform.js`: 10 front-end seeded modules, `User01`, `User02`, `User03`, schedules, certificates, notifications, resources, and role boundaries.
- `user_page/public/training/*.png`: generated training visuals for module artwork.
- `mobile_app/App.js`: current mobile app shell, not redesigned in the latest pass.
- `admin_page/src/Admin.jsx`: current admin dashboard shell, not redesigned in the latest pass.
- `user_login/server/index.js`: Express API server, not connected to the new training UI yet.
- `user_login/server/db.sql`: MySQL schema/seed baseline, not used by the new seeded frontend pass yet.
- `CTIP_AI_Camera_Training_and_Incident_Detection.ipynb`: AI/CV training, real-time camera detection, AI evidence saving, and shared AI/IoT incident schema documentation.
- `CTIP_IoT_Plant_Proximity_Monitor.ino`: ESP32 ultrasonic proximity sensor sketch publishing JSON to `ctip/sensor/plant-zone-01/proximity`.
- `admin_page/src/data/incidents.js`: seeded admin incident examples and summary helpers for AI Camera and IoT Sensor monitoring.
- `admin_page/src/pages/AIDetection.jsx`: seeded Admin Incident Dashboard table, filters, detail panel, evidence preview, metadata, notes, and local-only status changes.
- `admin_page/src/pages/ParkRangerConsole.jsx`: live Park Ranger Alert Console that reads `/api/incidents` and updates response status through `/api/incidents/:id/status`.
- `admin_page/src/Admin.jsx`: admin monitoring overview now summarizes seeded incident counts.
- `admin_page/src/Admin.css`: citrus incident dashboard styling, including table readability fixes.
- `admin_page/src/components/Sidebar.jsx`: admin menu label updated from Detection to Incidents.
- `admin_page/public/incidents/*.jpg`: AI evidence assets added for seeded admin incident examples.

## Files Changed

Latest user-side rebuild changed or added:

- `user_page/src/App.jsx`
- `user_page/src/App.css`
- `user_page/src/index.css`
- `user_page/src/data/trainingPlatform.js`
- `user_page/public/training/*.png`

Generated by build/checks and currently showing as changed or untracked:

- `user_page/dist/*`
- `user_page/package-lock.json`
- `user_page/node_modules/*`
- `mobile_app/package-lock.json`
- `user_login/server/node_modules/*`

Previously changed root review launcher/hub files still pending:

- `package.json`
- `package-lock.json`
- `index.html`
- `scripts/dev-all.mjs`
- `scripts/hub-server.mjs`
- `login/hub.css`
- `login/hub.js`

Checkpoint/docs files:

- `.gitignore`
- `PROJECT_NOTES.md`
- `TODO.md`
- `Project Scope.pdf` is currently untracked.
- `CTIP_2class_training_and_realtime_notebook.ipynb` was renamed to `CTIP_AI_Camera_Training_and_Incident_Detection.ipynb` and replaced with the updated AI/CV notebook content.
- `sketch_apr06a.ino` was renamed to `CTIP_IoT_Plant_Proximity_Monitor.ino` and replaced with the updated IoT proximity MQTT sketch.

## Key Decisions Made

- Use `user_page` as the main target for the Park Guide/User side.
- Keep front-end seeded demo data first; do not connect Express/MySQL yet.
- Replace the old 4-module setup with 10 modules from the brief.
- Seed three reviewable users: `User01`, `User02`, and `User03`.
- Add a demo user switcher so each user state can be reviewed quickly.
- Keep Park Guide/User permissions clearly separate from Admin permissions.
- Save project-used generated raster assets inside `user_page/public/training/`.
- Do not physically merge `user_page`, `mobile_app`, `admin_page`, and `user_login/server` into a single React app.

## Current Working Status

- The Park Guide/User source has been rebuilt around:
  - Dashboard
  - My Modules
  - Module Details
  - Learning Progress
  - Certificates / Badges
  - Notifications
  - Schedule
  - Saved Resources / Files
  - Profile
  - Help / Support
- `npm --prefix user_page run build` passed during the latest implementation pass.
- The frontend remains seeded locally through `user_page/src/data/trainingPlatform.js`.
- The root review launcher and hub are still separate from this latest UI pass.
- The broken module image path issue was fixed by normalizing Vite's `/user` base path before building `user_page/public/training/*` URLs.
- Verified working URLs:
  - `http://127.0.0.1:5175/user/`
  - `http://127.0.0.1:5175/user/training/protected-areas.png`
  - `http://127.0.0.1:5175/user/training/incident-ai-monitoring.png`

## Admin Incident Dashboard Status

- Admin Incident Dashboard has been implemented using seeded data.
- It supports AI Camera incidents and IoT Sensor incidents.
- AI Camera examples cover `TouchingPlants` and `TouchingWildlife` with alert image evidence and metadata such as confidence, margin, bbox, and probabilities.
- IoT Sensor examples cover `ObjectCloseToPlant` with sensor ID, location, distance, threshold, severity, and MQTT topic metadata.
- Incident review supports local UI status changes for `New`, `Reviewed`, and `False Alarm`.
- Data is local seeded data only through `admin_page/src/data/incidents.js`.
- Express/MySQL is still not connected.
- Changed files include:
  - `admin_page/src/data/incidents.js`
  - `admin_page/src/pages/AIDetection.jsx`
  - `admin_page/src/Admin.jsx`
  - `admin_page/src/Admin.css`
  - `admin_page/src/components/Sidebar.jsx`
  - AI evidence assets added under `admin_page/public/incidents/`.

## Live Incident Bridge Status

- Lightweight real-time alert synchronization has been implemented without Express/MySQL integration.
- `user_login/server/index.js` now has a runtime incident store backed by memory plus optional local JSON persistence at `user_login/server/data/incidents.runtime.json`.
- Backend incident API endpoints now exist:
  - `GET /api/incidents`
  - `POST /api/incidents`
  - `PATCH /api/incidents/:id/status`
  - `GET /api/incidents/summary`
- Runtime status updates now allow both admin review labels and Park Ranger response labels:
  - `New`
  - `Reviewed`
  - `Acknowledged`
  - `In Review`
  - `Resolved`
  - `False Alarm`
- Root `npm run dev` now checks `http://localhost:4000/api/health` before starting the backend. If a backend is already running, `scripts/dev-all.mjs` skips the duplicate backend start instead of letting port `4000` crash the whole launcher.
- If port `4000` is occupied by a non-backend process, the launcher warns with the `lsof -nP -iTCP:4000 -sTCP:LISTEN` command and continues starting the other review services.
- Backend serves AI evidence images from root `alerts/ai` at `/evidence/ai`.
- AI evidence image path preview has been fixed for live incidents:
  - backend uses `AI_EVIDENCE_DIR` when provided, otherwise defaults to repo root `alerts/ai`;
  - backend converts absolute local image paths into browser-safe `/evidence/ai/<filename>` values;
  - admin converts `/evidence/ai/...` into `http://localhost:4000/evidence/ai/...` before rendering images.
- Backend subscribes to MQTT topic `ctip/sensor/plant-zone-01/proximity` and normalizes IoT payloads into dashboard incidents.
- MQTT uses `mqtt://broker.hivemq.com:1883` by default for prototype testing only and should not crash the backend if the broker is unavailable.
- `admin_page/src/pages/AIDetection.jsx` now polls the live backend every 2.5 seconds and falls back to seeded demo incidents if the backend is offline.
- Admin status buttons call `PATCH /api/incidents/:id/status` when the backend is online and fall back to local-only updates when offline.
- `admin_page/src/pages/ParkRangerConsole.jsx` polls the same backend every 2.5 seconds and is scoped to incident response only. It does not expose user management, training module management, certificate approval, or system setting links.
- The review hub links directly to the Park Guide/User portal, Admin Dashboard, Admin Incident Detection, Park Ranger Alert Console, backend health, and incident API for smoother demo testing.
- `CTIP_AI_Camera_Training_and_Incident_Detection.ipynb` now posts saved AI alert incidents to `http://localhost:4000/api/incidents` using Python standard library HTTP calls, while continuing local evidence saving if the backend is offline.
- `scripts/run_ai_camera_monitor.py` supports `--project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app` for local-only model assets under the repo root, `--evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai` for repo-local AI evidence, `--camera-index` for normal webcam selection, and `--backend-url` for the backend origin. The default backend URL is `http://localhost:4000`.
- Express/MySQL is still intentionally not connected to training or incident persistence.

## Known Issues Or Risks

- Module image paths were fixed in `user_page/src/data/trainingPlatform.js`, but a final visual browser review is still needed to confirm all pages look right at desktop and mobile widths.
- `user_page/dist`, `node_modules`, and package-lock changes are noisy and should be reviewed carefully before commit.
- There is an unreferenced duplicate-looking generated image file, `user_page/public/training/incident-ai-monitoring copy.png`; do not delete it unless clearly confirmed safe.
- Admin and mobile have not yet been updated to match the citrus theme.
- Backend `/api/health` now reports API status without requiring MySQL, but database-specific checks still show offline until local MySQL is running and seeded.
- Training data is not yet persisted to MySQL.
- Live incident persistence is still prototype-level memory/local JSON, not MySQL.
- MQTT public broker delivery depends on internet access and public broker availability.
- MacBook built-in camera works as the default camera. iPhone Continuity Camera is environment-dependent: it has worked through iPhone hotspot and on Yoriichi's Router, but OpenCV camera index switching is not guaranteed to manually select the iPhone camera.
- `Project Scope.pdf` is untracked; decide whether to commit it as assignment reference material.

## Next Priority

Polish the already-built user-side experience before adding or redesigning more features.

Specifically check:

- Dashboard hero background image path.
- Module card and Module Details hero image rendering.
- Certificate page visual richness.
- Profile page layout density.
- Responsive layout at desktop and mobile widths.
- Keep frontend seeded data only; do not connect Express/MySQL yet.

For incident monitoring specifically, the next backend task is persistent MySQL integration after seeded/live runtime behavior and report evidence are stable.

## Rules / Instructions Not To Forget

- Do not start new feature work during checkpoint/cleanup tasks.
- Do not delete files unless clearly safe or explicitly approved.
- Keep front-end seeded data only for now.
- Do not connect Express/MySQL yet.
- Preserve existing repo surfaces: website, mobile app, admin app, backend.
- Work with the current GUI in `user_page`.
- Keep website and mobile design/function consistent when mobile work resumes.
- Use realistic seeded examples; avoid placeholder-only UI.
- Do not commit `.DS_Store`, local dependency folders, or generated build output unless explicitly required.
- Do not revert user or previous work unless explicitly asked.
