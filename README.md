# COS30049 Assignment - Sarawak Forestry Digital Park Guide System

This repository is the active team repo for the COS30049 Computing Technology
Innovation Project.

Project path:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

The prototype combines:

- Park Guide / User training portal
- Admin dashboard
- Admin Incident Detection dashboard
- Park Ranger Alert Console
- AI camera monitoring prototype
- IoT proximity monitoring prototype
- Express backend for auth and live AI/IoT incident APIs

The current MySQL work is scoped only to AI/IoT incident persistence. The full
training platform, modules, quizzes, certificates, and progress data are still
frontend-seeded and are not connected to MySQL yet.

---

## Current Status

Implemented:

- Root review hub with quick links to all demo surfaces.
- User / Park Guide portal under `user_page`.
- Admin dashboard under `admin_page`.
- Admin Incident Detection page at `/admin/detection`.
- Park Ranger Alert Console at `/admin/ranger`.
- Backend incident API under `user_login/server`.
- AI camera monitor script at `scripts/run_ai_camera_monitor.py`.
- AI evidence serving from `/evidence/ai/<filename>`.
- MQTT IoT bridge for `ctip/sensor/plant-zone-01/proximity`.
- Memory/local JSON incident storage mode.
- Optional MySQL incident storage mode for AI/IoT incidents only.

Not implemented yet:

- Full training platform persistence in MySQL.
- Production authentication/authorization hardening.
- Production MQTT broker authentication.
- Production-grade AI model validation.

---

## Main Local URLs

Run the full workspace from the repo root:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm run dev
```

Expected URLs:

```text
Review hub:               http://localhost:5173
Backend API:              http://localhost:4000
User / Park Guide portal: http://localhost:5175/user
Admin dashboard:          http://localhost:5174/admin
Admin incidents:          http://localhost:5174/admin/detection
Park Ranger console:      http://localhost:5174/admin/ranger
Mobile web preview:       http://localhost:8081
```

Useful backend URLs:

```text
GET http://localhost:4000/api/health
GET http://localhost:4000/api/incidents
GET http://localhost:4000/api/incidents/summary
```

---

## Repository Layout

```text
my-react-app/
├── admin_page/
├── user_page/
├── mobile_app/
├── user_login/
│   └── server/
│       ├── index.js
│       ├── .env.example
│       ├── db.sql
│       ├── migrations/
│       │   └── 001_create_monitoring_incident_tables.sql
│       └── src/
│           └── incident/
│               ├── incidentUtils.js
│               ├── memoryIncidentStore.js
│               └── mysqlIncidentStore.js
├── scripts/
│   ├── dev-all.mjs
│   ├── hub-server.mjs
│   └── run_ai_camera_monitor.py
├── login/
├── alerts/
│   └── ai/
├── CTIP_AI_Camera_Training_and_Incident_Detection.ipynb
├── CTIP_IoT_Plant_Proximity_Monitor.ino
├── Project Scope.pdf
├── requirements.txt
├── package.json
├── README.md
├── PROJECT_NOTES.md
├── TODO.md
└── .gitignore
```

Local-only folders that should exist on your Mac but should not be committed:

```text
.venv/
artifacts/
datasets/
models/
node_modules/
dist/
```

`alerts/` is intentionally not ignored. Keep only small curated demo evidence in
Git. Do not commit large unreviewed runtime dumps.

---

## External AI Assets

Large AI files are stored outside GitHub.

Google Drive asset folder:

```text
https://drive.google.com/drive/folders/1CQjiJNnVJYRK3W0qHI2qcUDwjG2cA0qV?usp=sharing
```

Expected local asset structure:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/
├── artifacts/
│   └── clip_2class_touching_species.pt
├── datasets/
│   ├── touching-plants/
│   └── touching-wildlife/
├── models/
│   └── hand_landmarker.task
└── alerts/
    └── ai/
```

Do not move `.venv` from another checkout. Recreate it inside this repo.

---

## Install Dependencies

Install Node dependencies from the repo root:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm install
```

This runs the root `postinstall` script and installs dependencies for:

- `user_page`
- `admin_page`
- `mobile_app`
- `user_login/server`

---

## Python Environment

Create `.venv` inside `my-react-app`:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
```

Verify key packages:

```bash
python - <<'PY'
import cv2
import mediapipe as mp
import torch
import transformers

print("cv2:", cv2.__version__)
print("mediapipe:", mp.__version__)
print("torch:", torch.__version__)
print("MPS available:", torch.backends.mps.is_available())
print("transformers:", transformers.__version__)
PY
```

---

## Backend Environment

Safe template:

```text
user_login/server/.env.example
```

Expected variables:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=cos30049_assignment
INCIDENT_STORAGE=memory
INCIDENT_MYSQL_FALLBACK=memory
AI_EVIDENCE_DIR=/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=ctip/sensor/plant-zone-01/proximity
```

Do not commit a real `.env` file.

Storage modes:

```text
INCIDENT_STORAGE=memory  default; memory plus local runtime JSON
INCIDENT_STORAGE=mysql   optional; AI/IoT monitoring incidents stored in MySQL
```

If `INCIDENT_STORAGE=mysql` is selected but MySQL is unavailable, the backend
still starts when `INCIDENT_MYSQL_FALLBACK=memory`. `/api/health` reports
degraded storage and the incident API uses memory fallback. Fallback memory
incidents are not auto-synced into MySQL.

---

## Incident API

Main endpoints:

```text
GET   /api/health
GET   /api/incidents
GET   /api/incidents/summary
POST  /api/incidents
PATCH /api/incidents/:id/status
```

Supported sources:

```text
AI_CAMERA
IOT_SENSOR
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

Evidence paths returned to the frontend must be browser-safe:

```text
/evidence/ai/<filename>
```

Do not expose absolute local filesystem paths such as
`/Users/.../alerts/ai/file.jpg` in frontend responses.

---

## MySQL Incident Persistence

Database name:

```text
cos30049_assignment
```

Migration:

```text
user_login/server/migrations/001_create_monitoring_incident_tables.sql
```

Tables:

```text
monitoring_incidents
monitoring_incident_ai_metadata
monitoring_incident_iot_metadata
monitoring_incident_actions
monitoring_incident_evidence_files
```

Create database:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
```

Apply migration:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
```

Run backend/workspace in memory mode:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
INCIDENT_STORAGE=memory \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

Run backend/workspace in MySQL mode:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
INCIDENT_STORAGE=mysql \
DB_DATABASE=cos30049_assignment \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

Test API:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
```

Patch status:

```bash
curl -X PATCH http://localhost:4000/api/incidents/<INCIDENT_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"In Review"}'
```

Check database rows:

```bash
mysql -u root -p cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 5;"
```

---

## AI Camera Monitor

Terminal 1 - backend/workspace:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" npm run dev
```

Terminal 2 - AI camera:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
source .venv/bin/activate

python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
```

Optional flags:

```text
--camera-index    OpenCV camera index for normal webcams
--backend-url     backend origin, defaults to http://localhost:4000
```

Expected behavior:

- Camera opens.
- Hand is detected.
- Interaction is classified as `TouchingPlants` or `TouchingWildlife`.
- Alert JPG and JSON are saved to `alerts/ai`.
- Backend receives an AI incident if it is running.
- Frontend receives evidence as `/evidence/ai/<filename>`.
- Admin and Park Ranger pages show the incident.

Realtime controls:

```text
q    quit
ESC  quit
s    save manual snapshot
```

Expected shutdown output:

```text
Realtime camera stopped safely.
```

iPhone Continuity Camera is environment-dependent. The MacBook camera is the
default. `--camera-index` helps with normal webcams, but it does not guarantee
manual iPhone selection. Continuity Camera has worked through iPhone hotspot and
when both MacBook and iPhone were connected to Yoriichi's Router.

---

## Manual AI Incident Test

```bash
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "source": "AI_CAMERA",
    "eventType": "TouchingPlants",
    "severity": "medium",
    "location": "Demo Camera Zone",
    "status": "New",
    "evidenceImage": "/evidence/ai/example.jpg",
    "ai": {
      "predictedClass": "TouchingPlants",
      "confidence": 0.91,
      "margin": 0.72,
      "bbox": [120, 80, 420, 360],
      "probabilities": {
        "TouchingPlants": 0.91,
        "TouchingWildlife": 0.09
      }
    },
    "notes": "Manual AI incident test."
  }'
```

---

## IoT MQTT Prototype

Arduino sketch:

```text
CTIP_IoT_Plant_Proximity_Monitor.ino
```

Default topic:

```text
ctip/sensor/plant-zone-01/proximity
```

Manual MQTT publish test:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run publish:test-iot
```

Expected result:

- Backend receives the MQTT payload.
- A new `IOT_SENSOR` incident appears in `/api/incidents`.
- Admin and Park Ranger pages show distance, threshold, and topic metadata.

---

## AI Notebook

Notebook:

```text
CTIP_AI_Camera_Training_and_Incident_Detection.ipynb
```

The notebook covers:

- dataset preparation
- train/test split
- CLIP model training
- model evaluation
- realtime camera helper logic
- backend incident POST helper

Expected local files:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/artifacts/clip_2class_touching_species.pt
/Users/chiayuenkai/Desktop/GitHub/my-react-app/models/hand_landmarker.task
/Users/chiayuenkai/Desktop/GitHub/my-react-app/datasets/touching-plants/
/Users/chiayuenkai/Desktop/GitHub/my-react-app/datasets/touching-wildlife/
```

For live demo, prefer the standalone script instead of running realtime camera
cells inside Jupyter.

---

## Git Safety

Do not commit:

```text
.DS_Store
.venv/
node_modules/
dist/
artifacts/
datasets/
models/
*.pt
*.pth
.env
.env.*
```

`.env.example` is allowed.

Run before committing:

```bash
git status --short --untracked-files=all
git diff --check
git ls-files | grep -E "node_modules|\.venv|datasets|artifacts|models|\.pt|\.pth|dist|\.DS_Store"
```

Expected result for the `git ls-files` safety command:

```text
no output
```

`alerts/ai` is intentionally not ignored:

```bash
git check-ignore -v alerts/ai 2>/dev/null || echo "alerts/ai is not ignored"
```

Expected:

```text
alerts/ai is not ignored
```

---

## Troubleshooting

### Port 4000 Already In Use

Check:

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
```

Stop the process:

```bash
lsof -tiTCP:4000 -sTCP:LISTEN | xargs kill
```

Then restart:

```bash
npm run dev
```

### Evidence Image Does Not Load

Check the file exists:

```bash
ls /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
```

Check backend serving:

```bash
curl -I "http://localhost:4000/evidence/ai/<actual-image-name>.jpg"
```

Restart with the explicit evidence directory:

```bash
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" npm run dev
```

### MySQL Mode Falls Back To Memory

Check health:

```bash
curl http://localhost:4000/api/health
```

If storage reports degraded, confirm MySQL is running and the migration has been
applied:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
```

### Model File Missing

Expected file:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/artifacts/clip_2class_touching_species.pt
```

### Hand Landmarker Missing

Expected file:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/models/hand_landmarker.task
```

---

## Known Limitations

- AI model is a 2-class academic prototype.
- It detects `TouchingPlants` and `TouchingWildlife` only.
- Non-touching scenes are handled by rejection logic, not a trained negative class.
- Hand detection can fail under poor lighting, close camera distance, or gloves.
- MQTT currently uses prototype public/local broker settings.
- MySQL persistence currently covers AI/IoT monitoring incidents only.
- The full training platform remains frontend-seeded for now.

---

## Suggested Report Evidence

Recommended screenshots:

1. Root review hub.
2. User / Park Guide portal.
3. Admin Incident Detection dashboard.
4. Park Ranger Alert Console.
5. AI camera realtime detection.
6. AI alert JPG and JSON saved under `alerts/ai`.
7. Backend `/api/incidents` JSON response.
8. Backend `/api/incidents/summary` JSON response.
9. MySQL `monitoring_incidents` query result.
10. IoT MQTT publish test or ESP32 serial output.

---

## Project Context

Course:

```text
COS30049 Computing Technology Innovation Project
```

Project:

```text
Sarawak Forestry Digital Park Guide System
```
