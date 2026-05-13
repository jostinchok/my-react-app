# End-to-End Lecturer Demo Workflow

Use this workflow from the team repository folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

This workflow is for local lecturer demonstration from the team repo branch before merging to `main`.

## Terminal 1: Run The Full App

Standard MySQL mode:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
INCIDENT_STORAGE=mysql \
INCIDENT_MYSQL_FALLBACK=none \
DB_DATABASE=cos30049_assignment \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
IOT_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/iot" \
npm run dev
```

Expected health storage:

```text
incidents.persistence = mysql
incidents.storage.requested = mysql
incidents.storage.active = mysql
incidents.storage.fallback = none
```

Expected services:

```text
Backend API: http://localhost:4000
Admin training API: http://localhost:4002
Park Guide user API: http://localhost:4001
Root hub: http://localhost:5173
Admin app: http://localhost:5174/admin
User app: http://localhost:5175/user
Mobile preview: http://localhost:8081
```

Visual identity check:

- Confirm the shared Citrus logo appears on the Review Hub, User Portal sidebar, Admin sidebar, Park Ranger route through the Admin shell, and Mobile preview header.
- Keep the original generated logo source out of the app runtime; use the optimized WebP/PNG copies already placed in each app.
- Use `/admin/ranger` for the Park Ranger screenshot so the route includes the Admin shell/sidebar and shared logo.
- For the cybersecurity tutor check, also open `CYBERSECURITY_REVIEW.md` and show that the route access is demo-open while API-level token/role controls can be enabled.

## Terminal 0: Local Asset Setup

Run this once on a teammate machine before AI camera testing:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3 -m pip install gdown
python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"
python3 scripts/check_required_assets.py
```

The Google Drive URL is a placeholder until the shared folder link is inserted. If the folder is private, set it to "Anyone with the link can view" or download `artifacts/`, `models/`, and `datasets/` manually into the repo root.

Required local-only assets:

```text
artifacts/clip_2class_touching_species.pt
models/hand_landmarker.task
datasets/<plant-class dataset folder>/
datasets/touching-wildlife/
alerts/ai/
alerts/iot/
.env
```

Do not commit downloaded assets, `.env`, `.venv`, `node_modules`, `dist`, `.asset-download-tmp`, or personal camera evidence. AI dataset improvement remains future work and is not part of this merge.

## Cybersecurity Tutor Mode

Generate local demo tokens:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run generate:tokens
```

Start the full app with optional security controls. Use the generated values locally only:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
DEVICE_TOKEN_AUTH_ENABLED=true \
ROLE_CHECK_ENABLED=true \
INCIDENT_STORAGE=mysql \
INCIDENT_MYSQL_FALLBACK=none \
DB_DATABASE=cos30049_assignment \
AI_CAMERA_TOKEN="<copy-generated-ai-token>" \
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
IOT_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/iot" \
npm run dev
```

Run the automated security smoke test in another terminal:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
DEVICE_TOKEN_AUTH_ENABLED=true \
ROLE_CHECK_ENABLED=true \
AI_CAMERA_TOKEN="<copy-generated-ai-token>" \
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" \
npm run security:smoke
```

Expected evidence:

- `/api/health` returns security-control state.
- Invalid incident source is rejected.
- Invalid status is rejected.
- `/api/incidents` does not expose `/Users/...`.
- Wrong AI/IoT tokens return `401`.
- Correct AI/IoT tokens return `201`.
- `park_guide` status patch returns `403`.
- `park_ranger` official status patches return `403`.
- `park_ranger` recommendation posts return `201`.
- `admin` status patches return `200`.

## Terminal 2: API And MySQL Checks

API health:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
```

Create MySQL database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
```

Create or reset the app database user:

```bash
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'ctip_user'@'localhost' IDENTIFIED BY 'user'; ALTER USER 'ctip_user'@'localhost' IDENTIFIED BY 'user'; GRANT ALL PRIVILEGES ON cos30049_assignment.* TO 'ctip_user'@'localhost'; FLUSH PRIVILEGES;"
```

Apply migration:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
```

Apply the training platform schema and migrations for Admin Canvas course/module/item linkage:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS park_guide_database;"
mysql -u root -p park_guide_database < database/db.sql
mysql -u root -p park_guide_database < user_login/server/migrations/002_training_platform_tables.sql
mysql -u root -p park_guide_database < user_login/server/migrations/003_canvas_module_items.sql
mysql -u root -p park_guide_database < user_login/server/migrations/004_canvas_learning_progress.sql
```

After Terminal 1 has started the Admin training API on `http://localhost:4002`, insert the three demo Canvas courses through the backend/API/database flow:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm run seed:canvas-demo
```

Check tables:

```bash
mysql -u root -p cos30049_assignment -e "SHOW TABLES;"
```

Check latest incidents:

```bash
mysql -u root -p cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 5;"
```

Check latest incidents using the app user:

```bash
MYSQL_PWD=user mysql -u ctip_user -h localhost -P 3306 cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 5;"
```

Check IoT metadata and evidence rows:

```bash
mysql -u root -p cos30049_assignment \
  -e "SELECT i.public_id, m.sensor_id, m.distance_cm, m.threshold_cm, m.mqtt_topic FROM monitoring_incidents i JOIN monitoring_incident_iot_metadata m ON i.incident_id = m.incident_id ORDER BY i.occurred_at DESC LIMIT 10;"

mysql -u root -p cos30049_assignment \
  -e "SELECT i.public_id, e.file_name, e.browser_url, e.evidence_type FROM monitoring_incidents i JOIN monitoring_incident_evidence_files e ON i.incident_id = e.incident_id ORDER BY e.created_at DESC LIMIT 10;"
```

Patch official status as Admin:

```bash
curl -X PATCH http://localhost:4000/api/incidents/<INCIDENT_ID>/status \
  -H "Content-Type: application/json" \
  -H "X-Actor-Role: admin" \
  -d '{"status":"In Review"}'
```

Submit a Park Ranger field note and recommendation:

```bash
curl -X POST http://localhost:4000/api/incidents/<INCIDENT_ID>/ranger-recommendation \
  -H "Content-Type: application/json" \
  -H "X-Actor-Role: park_ranger" \
  -d '{"recommendation":"Recommend False Alarm","note":"Ranger checked the area and recommends Admin review as false alarm."}'
```

## Canvas Training Demo Flow

Use this flow to show that Admin-created Canvas content reaches the Park Guide User Portal:

1. Open `http://localhost:5174/admin/course`.
2. Create or select a course.
3. Add a module inside the course.
4. Add at least one Canvas module item.
5. Open `http://localhost:5175/user`, enroll or select a matching module, and confirm the learning item appears from the user API.

Supported Canvas item preview checks:

- Page/text: preview rich text or body content in the module detail pane.
- File: show the file/resource frame and download/open action when a file URL exists.
- Image: show the image frame.
- Video: show the video frame or video URL action.
- External link: show the link action and metadata.
- Quiz: answer the quiz interaction and confirm the local result changes the module item state.
- Checklist: tick checklist rows and confirm the checklist renders clearly.

Persistent progress check:

- Canvas item completion and quiz results save through the User API when MySQL is running and `004_canvas_learning_progress.sql` has been applied. Mark an item complete, submit a quiz, refresh the User Portal, and verify completion/quiz state remains. If the API/database is unavailable, the Portal shows a local fallback progress message.
- Admin progress review: open `http://localhost:5174/admin/students` and confirm each guide card shows Canvas completion percentage, completed item count, quiz attempt count, and latest quiz score from `http://localhost:4002/api/admin/canvas-progress-summary`.

## Terminal 3: AI Camera Monitor

On Chia's Mac, run the camera with the project Conda Python:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
/opt/homebrew/Caskroom/miniconda/base/envs/cos30049/bin/python scripts/run_ai_camera_monitor.py --backend-url http://localhost:4000 --camera-index 0
```

Generic teammate fallback: prepare Python from the local venv:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
source .venv/bin/activate
```

Run the AI camera from the generic local venv:

```bash
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai \
  --backend-url http://localhost:4000
```

When `DEVICE_TOKEN_AUTH_ENABLED=true`, the script reads `AI_CAMERA_TOKEN` from `.env` automatically. Use `--device-token` only to override it:

```bash
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai \
  --backend-url http://localhost:4000 \
  --device-token "<copy-generated-ai-token>"
```

Optional normal webcam index:

```bash
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai \
  --backend-url http://localhost:4000 \
  --camera-index 1
```

Camera notes:

- MacBook camera is the default.
- `--camera-index` helps with normal webcams.
- iPhone Continuity Camera is environment-dependent.
- It has worked when MacBook connects to the iPhone hotspot.
- It has also worked when both MacBook and iPhone connect to Yoriichi's Router.
- Do not claim camera index switching always selects the iPhone camera.
- Press `q` or ESC to exit safely.

Check output:

```bash
ls -lah alerts/ai
curl http://localhost:4000/api/incidents
```

## Terminal 4: IoT Simulation

Publish a test IoT proximity alert:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run publish:test-iot
```

Publish a test IoT proximity alert when `DEVICE_TOKEN_AUTH_ENABLED=true`:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" npm run publish:test-iot
```

The script tries the configured MQTT broker first. If the public broker times out, it falls back to posting the same simulated incident to the local backend API.

Expected incident fields:

```text
source = IOT_SENSOR
event_type = ObjectCloseToPlant
sensor_id = plant-zone-01
location = Plant Zone 01
distance_cm = simulated distance
threshold_cm = 20
status = New
severity = low
topic = ctip/sensor/plant-zone-01/proximity
```

Then check:

```bash
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
```

## Terminal 5: Browser IoT Evidence Capture

Open both response views:

```text
http://localhost:5174/admin/detection
http://localhost:5174/admin/ranger
```

In Admin Incident Detection:

1. Click `Start Camera`, or let the IoT trigger open the preview.
2. Click `Test Trigger`, or trigger the physical proximity sensor.
3. Wait for the 2-second camera warmup.
4. Confirm one compressed JPEG is captured at max 1280x720.
5. Confirm the saved URL starts with `/evidence/iot/`.
6. Confirm the same incident and image appear in Park Ranger.
7. Submit a Park Ranger recommendation, then update the official status from Admin Incident Detection and refresh both pages.

Backend verification:

```bash
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
ls -lah alerts/iot
```

The browser posts captures to `POST /api/incidents/iot-capture` with `X-Actor-Role: admin`. The frontend does not expose `IOT_SENSOR_TOKEN`; the backend writes the incident through the active memory/MySQL incident store.

Duplicate handling:

- If browser MQTT and backend MQTT share the same `public_id`, the backend updates the existing incident instead of creating a duplicate.
- If there is no shared ID, IoT records with the same source, event type, sensor ID, and timestamp within 10 seconds are merged.
- The saved browser evidence is attached to the existing incident when possible.

Camera contention note:

- The Admin browser preview and `scripts/run_ai_camera_monitor.py` can compete for the same physical camera.
- Stop the browser preview before running the standalone Python AI camera on that same camera.

## Browser Tabs To Open

```text
http://localhost:5173
http://localhost:5175/user
http://localhost:5174/admin
http://localhost:5174/admin/course
http://localhost:5174/admin/training
http://localhost:5174/admin/course-requests
http://localhost:5174/admin/students
http://localhost:5174/admin/badge
http://localhost:5174/admin/detection
http://localhost:5174/admin/ranger
http://localhost:8081
http://localhost:4000/api/health
http://localhost:4001/api/health
http://localhost:4001/api/training-modules
http://localhost:4002/api/health
http://localhost:4002/api/courses
http://localhost:4000/api/incidents
http://localhost:4000/api/incidents/summary
```

## Visual Consistency Checks

The demo should now read as one Citrus Energetic system:

- Hub: rainforest launcher, forest/citrus hero, rounded service cards, live status pills.
- User/Park Guide: warm citrus learning portal, cream cards, orange actions, lime progress states.
- Admin Dashboard: command-center view with charcoal/forest structure and citrus monitoring cards.
- Admin Training Pages: cream/citrus course manager, backend-linked module overview, guide accounts, enrollment requests, and badge issuing.
- Admin Incident Detection: consistent filters, table badges, evidence frame, metadata cards, ranger recommendations, and official status controls.
- Park Ranger Console: forest field-response identity, urgent queue, evidence panel, field notes, and citrus recommendation actions.
- Mobile Preview: simplified Park Guide palette with cream surfaces and citrus actions.

Image rule for report/demo assets:

- Hero images should stay below 500 KB.
- Card thumbnails should stay below 150 KB.
- Do not optimize or delete `alerts/ai` runtime evidence.
- Current generated hub hero is `images/citrus-rainforest-hero.webp` at 136 KB.
- Current user training WebP images are below 100 KB each.

## Manual Demo Order

1. Open `http://localhost:5173` and show the root hub cards and service links.
2. Open Login/Register/Forgot Password, then Park Guide/User Portal at `http://localhost:5175/user`.
3. Switch User01/User02/User03.
4. Show backend course list, selected course shell, internal Overview/Modules/Item Detail/Progress/Files/Completion navigation, item preview, quiz interaction, checklist rendering, persisted completion state with local fallback, certificates/badges, notifications, schedule, admin resources/files, profile, and help/permission guide.
5. Open mobile preview at `http://localhost:8081` and show backend-loaded modules.
6. Open Admin Dashboard at `http://localhost:5174/admin`.
7. Open Admin Course/Training pages and create or review a Canvas course, module, and module item. Confirm page, text, file, image, video, external link, quiz, and checklist item previews as time allows.
8. Open Admin Course Requests, Students, and Badge pages to show linked guide account and certificate workflows.
9. Open Admin Incident Detection at `http://localhost:5174/admin/detection`.
10. Show summary cards, filters, AI_CAMERA row, IOT_SENSOR row, evidence image, AI metadata, IoT metadata, ranger recommendations, and Admin official status update.
11. Open Park Ranger Console at `http://localhost:5174/admin/ranger`.
12. Show response-only role boundary, urgent/new incident queue, selected detail, evidence, field notes, and recommendation buttons.
13. Run AI camera or IoT simulation.
14. Refresh Admin and Ranger pages and show the same backend incident data.
15. Submit a Ranger recommendation, then patch official status from the Admin UI or curl and show persistence in API/MySQL.
16. For cybersecurity check, show `CYBERSECURITY_REVIEW.md`, `.env.example`, token generation, smoke test PASS output, and `/api/health` security state.
17. Capture final screenshots after confirming the Citrus Energetic theme is consistent across Hub, User, Admin, Ranger, and Mobile.

## Screenshot Checklist

Capture:

```text
1. Root hub with all demo links.
2. Park Guide dashboard.
3. Canvas module catalog, item preview, quiz, checklist, and media/resource display.
4. Local progress view and certificates/badges.
5. Notifications, resources/files, profile, and permission guide.
6. Mobile preview.
7. Admin dashboard.
8. Admin Incident Detection with AI and IoT rows.
9. Admin selected incident detail with AI evidence image.
10. Admin IoT metadata card.
11. Park Ranger response console.
12. Park Ranger recommendation submission.
13. /api/health.
14. /api/incidents.
15. /api/incidents/summary.
16. alerts/ai folder with JPG/JSON evidence.
17. alerts/iot folder with browser-captured IoT evidence.
18. MySQL query showing monitoring incidents if MySQL mode is used.
19. MySQL query showing IoT metadata and evidence file rows.
20. CYBERSECURITY_REVIEW.md vulnerability table.
21. Security smoke test output.
22. /api/health with security settings.
```

## Verification Commands

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm install
python3 scripts/check_required_assets.py
npm --prefix user_page run build
npm --prefix admin_page run build
node --check user_login/server/index.js
node --check user_page/server/index.js
node --check admin_page/adminServer.js
node --check scripts/dev-all.mjs
node --check scripts/hub-server.mjs
node --check user_login/server/scripts/publish-test-iot.js
node --check user_login/server/scripts/security-smoke-test.js
node --check user_login/server/scripts/generate-demo-tokens.js
source .venv/bin/activate
python -m py_compile scripts/run_ai_camera_monitor.py
```

## Troubleshooting

If a port is already in use:

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:5174 -sTCP:LISTEN
lsof -nP -iTCP:5175 -sTCP:LISTEN
lsof -nP -iTCP:8081 -sTCP:LISTEN
```

If `/api/health` still shows `requested=memory` or `active=memory`, stop and restart the backend after confirming `.env` has `INCIDENT_STORAGE=mysql`.

Emergency memory mode is available only when MySQL is unavailable:

```bash
INCIDENT_STORAGE=memory \
INCIDENT_MYSQL_FALLBACK=memory \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

If the camera script cannot import OpenCV or MediaPipe, recreate and activate `.venv` inside `my-react-app`:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If live evidence does not appear, confirm the backend and script use the same evidence folder:

```bash
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai"
IOT_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/iot"
```

Frontend evidence should render through:

```text
http://localhost:4000/evidence/ai/<filename>
http://localhost:4000/evidence/iot/<filename>
```
