# COS30049 SFC Digital Training and AI/IoT Monitoring Demo

Team repository working folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

This is the active team repository. The completed demo was synced from the local stable source copy `my-react-app1` onto a review branch so it can be tested before merging to `main`.

## Current Status

This project demonstrates the three Project Scope areas:

1. Interactive Digital Training Platform: seeded Park Guide web portal, Expo mobile preview, training modules, quizzes, progress, badges/certificates, notifications, files/resources, profile, and role boundaries.
2. Cybersecurity and Data Protection: demo login/register flow, role boundaries, `.env.example`, browser-safe evidence URLs, server-side incident validation, optional device-token ingestion, optional role checks, and documented production hardening steps.
3. AI/IoT Abnormal Activity Detection: AI camera incidents, IoT sensor incidents, Admin Incident Detection, Park Ranger response console, evidence serving, memory mode, and optional MySQL incident persistence.

The Park Guide training platform remains frontend-seeded for the demo. MySQL persistence is only implemented for AI/IoT monitoring incidents.

## UI And Asset Status

The demo uses a shared Citrus Energetic visual system:

- Deep forest green for official/primary areas.
- Warm citrus orange for actions and highlights.
- Soft yellow/cream backgrounds for warmth.
- Lime green for success/live/healthy states.
- Warm charcoal for dashboard contrast and readable text.

This consistency pass updated the Review Hub, Admin dashboard, Admin Incident Detection, Park Ranger Console, User Portal, and Mobile preview without changing AI model logic, backend incident API behavior, or MySQL schema.

Image optimization status:

- Shared generated logo: `images/sfc-citrus-logo.webp`, 17 KB, with app-local copies for Hub, Login, User, Admin/Ranger, and Mobile surfaces.
- Park Ranger now routes through the Admin shell, so the same optimized sidebar logo is visible on `/admin/ranger`.
- New generated hero: `images/citrus-rainforest-hero.webp`, 136 KB.
- User training images are now WebP files in `user_page/public/training/`.
- Optimized training images are below 100 KB each.
- `alerts/ai` evidence images were not optimized or deleted because they are runtime evidence.

## Local Structure

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/
├── .venv/
├── artifacts/clip_2class_touching_species.pt
├── datasets/touching-plants/
├── datasets/touching-wildlife/
├── models/hand_landmarker.task
├── alerts/ai/
├── alerts/iot/
├── scripts/run_ai_camera_monitor.py
├── admin_page/
├── user_page/
├── mobile_app/
└── user_login/
```

Local-only folders such as `.venv/`, `artifacts/`, `datasets/`, `models/`, `node_modules/`, `dist/`, and `.expo/` should not be committed. `alerts/ai/` and `alerts/iot/` are intentionally available for curated demo evidence.

## Setup

Install JavaScript dependencies:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm install
```

Create the Python environment inside this folder:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Prepare backend environment values from the example file:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
cp user_login/server/.env.example user_login/server/.env
```

Do not commit real `.env` files.

## Run The Full Demo

Memory mode is the safest first run:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
INCIDENT_STORAGE=memory \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

MySQL incident mode:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
INCIDENT_STORAGE=mysql \
DB_DATABASE=cos30049_assignment \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

If `INCIDENT_STORAGE=mysql` is selected and MySQL is offline, the backend starts in degraded mode when `INCIDENT_MYSQL_FALLBACK=memory`.

## MySQL Incident Persistence

Create the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
```

Apply the monitoring migration:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
```

Check stored incidents:

```bash
mysql -u root -p cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 5;"
```

Check IoT metadata and evidence rows:

```bash
mysql -u root -p cos30049_assignment \
  -e "SELECT i.public_id, m.sensor_id, m.distance_cm, m.threshold_cm, m.mqtt_topic FROM monitoring_incidents i JOIN monitoring_incident_iot_metadata m ON i.incident_id = m.incident_id ORDER BY i.occurred_at DESC LIMIT 10;"

mysql -u root -p cos30049_assignment \
  -e "SELECT i.public_id, e.file_name, e.browser_url, e.evidence_type FROM monitoring_incidents i JOIN monitoring_incident_evidence_files e ON i.incident_id = e.incident_id ORDER BY e.created_at DESC LIMIT 10;"
```

Only AI/IoT monitoring incidents use MySQL. Training records, guide profiles, module content, and certificate approval remain seeded frontend demo data.

## AI Camera Runtime

Activate the local venv first:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
source .venv/bin/activate
```

Run the realtime monitor:

```bash
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai \
  --backend-url http://localhost:4000
```

Expected behavior:

- MacBook camera is the default camera.
- `--camera-index` is useful for normal webcam selection.
- iPhone Continuity Camera is environment-dependent.
- It has worked when the MacBook connects to the iPhone hotspot.
- It has also worked when both MacBook and iPhone connect to Yoriichi's Router.
- Do not assume `--camera-index` always selects the iPhone camera.
- Press `q` or ESC to exit. The script releases the camera, closes OpenCV windows, and prints `Realtime camera stopped safely.`

Evidence output goes to:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
```

The backend serves evidence as browser-safe URLs:

```text
http://localhost:4000/evidence/ai/<filename>
```

## IoT Simulation

Run the full app or backend first, then publish a test IoT incident:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run publish:test-iot
```

The test publisher tries the configured MQTT broker first. If the public broker cannot complete a connection during the demo, it falls back to `POST http://localhost:4000/api/incidents` with the same `IOT_SENSOR` payload so the incident workflow can still be demonstrated.

The MQTT topic remains:

```text
ctip/sensor/plant-zone-01/proximity
```

The expected simulated incident is `source=IOT_SENSOR`, `event_type=ObjectCloseToPlant`, `sensor_id=plant-zone-01`, `location=Plant Zone 01`, `severity=low`, and incident status `New`.

Admin Incident Detection can also listen to the browser MQTT websocket. A real sensor reading opens the browser camera and saves one delayed, compressed JPEG when the payload has `status=triggered` or `distance_cm <= threshold_cm`. The backend stores the image under:

```text
alerts/iot/
```

and serves it through:

```text
http://localhost:4000/evidence/iot/<filename>
```

The browser posts this capture to `POST /api/incidents/iot-capture` with `X-Actor-Role: admin`, so the frontend does not expose `IOT_SENSOR_TOKEN`. The endpoint writes through the active memory/MySQL incident store. Admin and Park Ranger both read the same record from `GET /api/incidents`, render the same `/evidence/iot/<filename>` image, and update the same status through `PATCH /api/incidents/:id/status`.

Duplicate handling: if browser MQTT and backend MQTT receive the same physical sensor trigger, the backend first matches by `public_id`. If no shared ID exists, it merges IoT triggers with the same source, event type, sensor ID, and timestamp within a 10-second window. Browser capture evidence attaches to the existing incident instead of creating a duplicate.

Camera note: stop the browser preview before running `scripts/run_ai_camera_monitor.py` on the same physical camera. The browser preview and Python AI camera can compete for camera access.

## Cybersecurity Tutor Check

Detailed cybersecurity evidence is in:

```text
CYBERSECURITY_REVIEW.md
```

Generate local demo tokens. These are printed only; they are not written into `.env` automatically:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run generate:tokens
```

Enable optional cybersecurity demo mode by copying generated token values into your local shell or local `.env`:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
DEVICE_TOKEN_AUTH_ENABLED=true \
ROLE_CHECK_ENABLED=true \
AI_CAMERA_TOKEN="<copy-generated-ai-token>" \
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

Run the smoke test from another terminal with the same token values:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
DEVICE_TOKEN_AUTH_ENABLED=true \
ROLE_CHECK_ENABLED=true \
AI_CAMERA_TOKEN="<copy-generated-ai-token>" \
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" \
npm run security:smoke
```

Security controls now available for demonstration:

- `DEVICE_TOKEN_AUTH_ENABLED=false` keeps the current demo ingestion flow unchanged.
- `DEVICE_TOKEN_AUTH_ENABLED=true` requires AI camera and IoT device tokens for `POST /api/incidents`.
- `ROLE_CHECK_ENABLED=false` keeps current status update behavior unchanged.
- `ROLE_CHECK_ENABLED=true` allows status updates only from `X-Actor-Role: admin` or `X-Actor-Role: park_ranger`.
- `X-Actor-Role: park_guide` is rejected from incident status changes when role checks are enabled.

AI camera token mode:

```bash
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai \
  --backend-url http://localhost:4000 \
  --device-token "<copy-generated-ai-token>"
```

IoT token mode:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" npm run publish:test-iot
```

## Demo URLs

Open these after `npm run dev`:

```text
http://localhost:5173
http://localhost:5175/user
http://localhost:5174/admin
http://localhost:5174/admin/detection
http://localhost:5174/admin/ranger
http://localhost:8081
http://localhost:4000/api/health
http://localhost:4000/api/incidents
http://localhost:4000/api/incidents/summary
```

## API Checks

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
```

Patch an incident status:

```bash
curl -X PATCH http://localhost:4000/api/incidents/<INCIDENT_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"In Review"}'
```

Allowed statuses are:

```text
New, Reviewed, Acknowledged, In Review, Resolved, False Alarm
```

## Build And Syntax Checks

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm --prefix user_page run build
npm --prefix admin_page run build
node --check user_login/server/index.js
node --check scripts/dev-all.mjs
node --check scripts/hub-server.mjs
node --check user_login/server/scripts/publish-test-iot.js
node --check user_login/server/scripts/security-smoke-test.js
node --check user_login/server/scripts/generate-demo-tokens.js
source .venv/bin/activate
python -m py_compile scripts/run_ai_camera_monitor.py
```

## Cybersecurity Notes

- Real credentials belong in `.env`, not source code.
- `.env.example` uses safe local placeholders.
- Evidence responses use `/evidence/ai/<filename>` or `/evidence/iot/<filename>` and do not expose `/Users/...` paths to the frontend.
- Backend incident endpoints validate known incident source, event type, severity, status, and basic IoT fields.
- Optional AI/IoT device-token validation protects incident ingestion during the cybersecurity demo.
- Optional role checking protects incident status updates during the cybersecurity demo.
- Role boundaries are visible: Park Guide, Park Ranger, and Admin have different permissions.
- Login/Register/Forgot Password remains demo/partial. Existing backend auth endpoints hash passwords if the legacy MySQL auth schema is loaded, but frontend route protection is not production-grade.
- Production MQTT should use a private broker with authentication and TLS.
- Production camera/IoT ingestion should use HTTPS and device token authentication.
- MySQL stores AI/IoT incident records server-side; full training-platform MySQL integration is intentionally deferred.

## Known Limitations

- Login/register is a demo flow, not production authentication.
- Frontend route guards are not enforced in production style; optional role checks protect the incident status API only.
- Park Guide training content is frontend-seeded and local to the browser.
- The AI model depends on local model files under `artifacts/` and `models/`.
- MQTT public broker behavior depends on network availability.
- The IoT test publisher includes a local API fallback for lecturer-demo reliability when the public MQTT broker times out.
- Browser IoT capture uses the Admin page camera preview and should not be run at the same time as the standalone Python AI camera on the same physical camera.
- MySQL mode requires the local `cos30049_assignment` database and migration.
- This duplicate copy is for local demo review, not Git publishing.

## Screenshot Checklist

Capture:

1. Root hub at `http://localhost:5173`.
2. Login/Register and Park Guide portal.
3. User dashboard, modules, quiz, progress, certificates, notifications, files, profile, and help.
4. Mobile preview at `http://localhost:8081`.
5. Admin dashboard.
6. Admin Incident Detection with AI and IoT rows, evidence image, metadata, filters, and status update.
7. Park Ranger Console with urgent/new incidents and response actions.
8. `/api/health`, `/api/incidents`, and `/api/incidents/summary`.
9. `alerts/ai` and `alerts/iot` folders showing curated AI and IoT evidence.
10. MySQL query showing monitoring incidents, if running MySQL mode.
11. Citrus Energetic visual consistency across Hub, User, Admin, Ranger, and Mobile surfaces.
12. Shared logo appears in the Review Hub, Park Guide portal, Admin shell, Park Ranger route through the Admin shell, and Mobile preview.
13. `CYBERSECURITY_REVIEW.md` vulnerability assessment table.
14. `npm run security:smoke` output with token and role checks.
15. `/api/health` showing optional security-control state.
