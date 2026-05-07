# COS30049 SFC Digital Training and AI/IoT Monitoring Demo

Team repository working folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

This is the active team repository. The completed demo was synced from the local stable source copy `my-react-app1` onto a review branch so it can be tested before merging to `main`.

## Current Status

This project demonstrates the three Project Scope areas:

1. Interactive Digital Training Platform: backend-linked Admin Canvas-style course/module/item management, Park Guide web portal, Expo mobile preview, training modules, item previews, quiz interaction, checklist rendering, media/resources, persisted completion state with local fallback, badges/certificates, notifications, profile, and role boundaries.
2. Cybersecurity and Data Protection: demo login/register flow, role boundaries, `.env.example`, browser-safe evidence URLs, server-side incident validation, optional device-token ingestion, optional role checks, and documented production hardening steps.
3. AI/IoT Abnormal Activity Detection: AI camera incidents, IoT sensor incidents, Admin Incident Detection, Park Ranger recommendation console, evidence serving, and MySQL-backed monitoring incident persistence.

The Park Guide training platform now has demo MySQL-backed Admin-to-User linkage for Canvas-style courses, modules, module items, resources, guide accounts, enrollment requests, badges, item completion, and quiz attempts. MySQL persistence remains the default for AI/IoT monitoring incidents through the separate monitoring incident API.

## UI And Asset Status

The demo uses a shared Citrus Energetic visual system:

- Deep forest green for official/primary areas.
- Warm citrus orange for actions and highlights.
- Soft yellow/cream backgrounds for warmth.
- Lime green for success/live/healthy states.
- Warm charcoal for dashboard contrast and readable text.

This consistency pass updated the Review Hub, Admin dashboard, Admin Incident Detection, Park Ranger Console, User Portal, and Mobile preview while preserving AI model logic and the MySQL monitoring schema.

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
cp .env.example .env
```

Do not commit real `.env` files.

## Local Asset Setup

The AI/CV model weights, MediaPipe task file, and training datasets are intentionally not committed to GitHub because they are large local assets. Teammates should download them from the shared Google Drive folder, place them inside this repo, and verify the structure before running the AI camera.

Required local structure:

```text
my-react-app/
├── artifacts/
│   └── clip_2class_touching_species.pt
├── models/
│   └── hand_landmarker.task
├── datasets/
│   ├── touching-plants/
│   └── touching-wildlife/
├── alerts/
│   ├── ai/
│   └── iot/
└── .env
```

Install the Google Drive helper:

```bash
python3 -m pip install gdown
```

Download local assets. Replace the placeholder with the shared Google Drive folder link:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3 scripts/download_assets_gdrive.py \
  --url "<GOOGLE_DRIVE_FOLDER_URL>"
```

Verify local assets:

```bash
python3 scripts/check_required_assets.py
```

If the Google Drive folder is private, set it to "Anyone with the link can view" or download manually. Manual fallback: download `artifacts/`, `models/`, and `datasets/` from Google Drive and place those folders directly inside `my-react-app`.

Do not commit downloaded `artifacts/`, `datasets/`, `models/`, `.asset-download-tmp/`, `.venv/`, `node_modules/`, real `.env`, or personal alert images. Curated AI evidence already tracked in Git can remain; personal `alerts/iot` camera captures should stay local unless explicitly approved.

Teammate quick-start after this branch is merged:

```bash
cd /path/to/my-react-app
git checkout main
git pull origin main
npm install
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python3 -m pip install gdown
python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"
python3 scripts/check_required_assets.py
cp .env.example .env
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
mysql -u root -p park_guide_database < database/db.sql
mysql -u root -p park_guide_database < user_login/server/migrations/002_training_platform_tables.sql
mysql -u root -p park_guide_database < user_login/server/migrations/003_canvas_module_items.sql
mysql -u root -p park_guide_database < user_login/server/migrations/004_canvas_learning_progress.sql
npm run dev
```

AI dataset improvement remains future work and is not part of this merge.

## Run The Full Demo

The standard demo run uses MySQL for AI/IoT incidents. Start MySQL first, confirm `cos30049_assignment` exists, then run:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
INCIDENT_STORAGE=mysql \
INCIDENT_MYSQL_FALLBACK=none \
DB_DATABASE=cos30049_assignment \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
IOT_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/iot" \
npm run dev
```

Health should show MySQL, not local JSON memory:

```json
"persistence": "mysql",
"storage": {
  "requested": "mysql",
  "active": "mysql",
  "status": "online",
  "fallback": "none"
}
```

Memory mode is only for emergency local testing. Do not use it for the lecturer demo unless MySQL is unavailable.

## MySQL Incident Persistence

Create the database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
```

Create the local app database user used by `.env.example`:

```bash
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'ctip_user'@'localhost' IDENTIFIED BY 'user'; GRANT ALL PRIVILEGES ON cos30049_assignment.* TO 'ctip_user'@'localhost'; FLUSH PRIVILEGES;"
```

If `ctip_user` already existed with an older password, reset it:

```bash
mysql -u root -p -e "ALTER USER 'ctip_user'@'localhost' IDENTIFIED BY 'user'; GRANT ALL PRIVILEGES ON cos30049_assignment.* TO 'ctip_user'@'localhost'; FLUSH PRIVILEGES;"
```

Apply the monitoring migration:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
```

## Training Platform Persistence

The Admin training API runs on `http://localhost:4002` and the Park Guide user API runs on `http://localhost:4001`. They share the training database tables for:

- courses and modules
- Canvas-style module items in `course_module_items`
- course resources
- guide accounts and course assignments
- enrollment requests
- badges and issued certifications
- Canvas item completion and quiz-attempt progress

Supported Canvas module item types are:

```text
page, text, file, image, video, link, quiz, checklist
```

Apply the base training schema, the selective training-platform migration, the Canvas module item migration, and the Canvas learning-progress migration:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS park_guide_database;"
mysql -u root -p park_guide_database < database/db.sql
mysql -u root -p park_guide_database < user_login/server/migrations/002_training_platform_tables.sql
mysql -u root -p park_guide_database < user_login/server/migrations/003_canvas_module_items.sql
mysql -u root -p park_guide_database < user_login/server/migrations/004_canvas_learning_progress.sql
```

Admin demo routes:

```text
http://localhost:5174/admin/course
http://localhost:5174/admin/training
http://localhost:5174/admin/course-requests
http://localhost:5174/admin/guides
http://localhost:5174/admin/badge
```

Park Guide and mobile surfaces read the same module/resource data when the APIs are running:

```text
http://localhost:5175/user
http://localhost:8081
http://localhost:4001/api/training-modules
http://localhost:4001/api/canvas-progress?userId=1
http://localhost:4001/api/canvas-progress/summary?userId=1
http://localhost:4002/api/courses
http://localhost:4002/api/courses/<COURSE_ID>/canvas
http://localhost:4002/api/admin/canvas-progress-summary
```

Check stored incidents:

```bash
mysql -u root -p cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 5;"
```

Check with the app user:

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

AI/IoT monitoring incidents use the monitoring MySQL database and remain separate from training content. The training platform has demo MySQL-backed linkage for Admin-created Canvas courses, modules, module items, resources, guide accounts, enrollment requests, badges, item completion, quiz attempts, and Admin-facing guide progress summaries.

## AI Camera Runtime

On Chia's Mac, use the project Conda Python for the local camera demo:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
/opt/homebrew/Caskroom/miniconda/base/envs/cos30049/bin/python scripts/run_ai_camera_monitor.py --backend-url http://localhost:4000 --camera-index 0
```

Generic teammate fallback: activate the local venv first:

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

When backend token auth is enabled, the script automatically reads `AI_CAMERA_TOKEN` from `.env` if `--device-token` is not provided.

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

The browser posts this capture to `POST /api/incidents/iot-capture` with `X-Actor-Role: admin`, so the frontend does not expose `IOT_SENSOR_TOKEN`. The endpoint writes through the active memory/MySQL incident store. Admin and Park Ranger both read the same record from `GET /api/incidents` and render the same `/evidence/iot/<filename>` image. Admin makes official status decisions through `PATCH /api/incidents/:id/status`; Park Ranger submits field notes and recommended outcomes through `POST /api/incidents/:id/ranger-recommendation` without changing the official status.

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
- `ROLE_CHECK_ENABLED=false` keeps demo endpoints open for local review.
- `ROLE_CHECK_ENABLED=true` allows official status updates only from `X-Actor-Role: admin`.
- `ROLE_CHECK_ENABLED=true` allows ranger field-note recommendations from `X-Actor-Role: park_ranger`.
- `X-Actor-Role: park_guide` is rejected from incident status changes when role checks are enabled.

AI camera token mode:

```bash
/opt/homebrew/Caskroom/miniconda/base/envs/cos30049/bin/python scripts/run_ai_camera_monitor.py \
  --backend-url http://localhost:4000 \
  --camera-index 0 \
  --device-token "<copy-generated-ai-token>"
```

`--device-token` is only needed when overriding the token from `.env` or from the shell `AI_CAMERA_TOKEN` variable.

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

Patch an official incident status as Admin:

```bash
curl -X PATCH http://localhost:4000/api/incidents/<INCIDENT_ID>/status \
  -H "Content-Type: application/json" \
  -H "X-Actor-Role: admin" \
  -d '{"status":"In Review"}'
```

Allowed statuses are:

```text
New, Reviewed, Acknowledged, In Review, Resolved, False Alarm
```

Submit a Park Ranger field note and recommendation without changing official status:

```bash
curl -X POST http://localhost:4000/api/incidents/<INCIDENT_ID>/ranger-recommendation \
  -H "Content-Type: application/json" \
  -H "X-Actor-Role: park_ranger" \
  -d '{"recommendation":"Recommend Resolved","note":"Ranger checked the evidence and recommends Admin review as resolved."}'
```

## Forgot Password / OTP Email Setup

The Forgot Password flow sends a **6-digit OTP** via Gmail SMTP. The OTP is stored as a SHA-256 hash in `password_reset_tokens` and expires in **5 minutes**.

### 1. Create a Gmail App Password

1. Go to your Google Account → **Security** → **2-Step Verification** → **App Passwords**.
2. Create an app password for "Mail".
3. Copy the 16-character password.

### 2. Set email variables in `.env`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="SFC Digital Park Guide <your-email@gmail.com>"
APP_BASE_URL=http://localhost:5176/login
VITE_LOGIN_URL=http://localhost:5173/login/
VITE_USER_URL=http://localhost:5175/user
VITE_ADMIN_URL=http://localhost:5174/admin
```

### 3. How it works

1. User clicks **Forgot Password?** on the login page.
2. User enters their registered email and clicks **Send OTP**.
3. Server generates a 6-digit OTP, stores its SHA-256 hash with a 5-minute expiry in `password_reset_tokens`, and emails the code.
4. User enters the OTP and new password on step 2 of the form.
5. Server verifies the hash, checks expiry and single-use status, updates `password_hash`, and marks the token used.

### 4. Test the flow

Start the backend server, then open the login page at `http://localhost:5173/login/` and click **Forgot Password?**.

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
- Optional role checking protects incident status updates during the cybersecurity demo; Admin is the only official status updater.
- Park Ranger can view incidents, add field notes, and recommend outcomes. Recommendations do not change official incident status.
- Role boundaries are visible: Park Guide, Park Ranger, and Admin have different permissions.
- Login/Register/Forgot Password is demo-ready for the coursework flow. Forgot Password sends a 6-digit OTP via Gmail SMTP (nodemailer); the OTP is SHA-256 hashed in the database and expires in 5 minutes. All password fields have a show/hide toggle. Production JWT/session route protection remains future work.
- Production MQTT should use a private broker with authentication and TLS.
- Production camera/IoT ingestion should use HTTPS and device token authentication.
- MySQL stores AI/IoT incident records server-side. Training content has demo MySQL-backed Canvas course/module/item linkage plus User API persistence for item completion and quiz attempts.

## Known Limitations

- Login/register is a demo flow, not production authentication.
- Frontend route guards are not enforced in production style; optional role checks protect the official incident status API and ranger recommendation API.
- Admin-created Canvas training content, User Portal Canvas progress, and Admin guide progress summaries are API/database linked when the User/Admin APIs and `004_canvas_learning_progress.sql` migration are available. The User Portal keeps local fallback state if the progress API/database is unavailable, and Admin shows a safe empty progress summary if tables are unavailable.
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
3. User dashboard, Canvas module items, quiz/checklist previews, local progress view, certificates, notifications, files, profile, and help.
4. Mobile preview at `http://localhost:8081`.
5. Admin dashboard.
6. Admin Incident Detection with AI and IoT rows, evidence image, metadata, ranger recommendations, filters, and official status update.
7. Park Ranger Console with urgent/new incidents, field notes, and recommendation actions.
8. `/api/health`, `/api/incidents`, and `/api/incidents/summary`.
9. `alerts/ai` and `alerts/iot` folders showing curated AI and IoT evidence.
10. MySQL query showing monitoring incidents, if running MySQL mode.
11. Citrus Energetic visual consistency across Hub, User, Admin, Ranger, and Mobile surfaces.
12. Shared logo appears in the Review Hub, Park Guide portal, Admin shell, Park Ranger route through the Admin shell, and Mobile preview.
13. `CYBERSECURITY_REVIEW.md` vulnerability assessment table.
14. `npm run security:smoke` output with token and role checks.
15. `/api/health` showing optional security-control state.
