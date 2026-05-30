# SFC Digital Training and AI/IoT Monitoring Demo

This repository contains the final COS30049 Smart Forestry Conservation Platform prototype for Sarawak Forestry Corporation (SFC). The system demonstrates a digital training platform for park guides, an admin management portal, a ranger incident review console, cybersecurity controls, AI camera monitoring, and IoT proximity-based incident support.

## Project Scope

The prototype covers three main areas:

1. Interactive Digital Training Platform
   - Park Guide web portal
   - Admin course and module management
   - Mobile web preview
   - Training modules, resources, quizzes, progress, certificates, notifications, and profile pages

2. Cybersecurity and Data Protection
   - Login and registration flow
   - Password hashing
   - JWT-based sessions
   - Role-based access separation for Admin, Park Guide, and Park Ranger
   - Protected API routes
   - Device-token support for AI camera and IoT incident ingestion
   - Environment-based configuration using `.env`

3. AI/IoT Abnormal Activity Detection
   - AI camera incident workflow
   - IoT proximity sensor incident workflow
   - Evidence image serving
   - Admin incident review
   - Park Ranger recommendation workflow
   - MySQL-backed monitoring incident persistence

## Prerequisites

Install the following before running the project:

- Git
- Node.js 20 or newer
- npm 10 or newer
- Python 3.10 or newer
- MySQL or MariaDB
- Optional: XAMPP MySQL for local database setup
- Optional: Expo Go or a browser for the mobile web preview
- Optional: Arduino IDE for the ESP32 IoT prototype

## Clone the Repository

```bash
git clone https://github.com/jostinchok/my-react-app.git
cd my-react-app
npm install
```

## Environment Setup

Create a local `.env` file from the example file.

macOS / Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` only on your own machine. Do not commit real `.env` files.

## Python Setup

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Windows PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Database Setup

Create the two local databases and import the required SQL files.

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS park_guide_database;"
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
mysql -u root -p park_guide_database < database/db.sql
mysql -u root -p park_guide_database < user_login/server/migrations/002_training_platform_tables.sql
mysql -u root -p park_guide_database < user_login/server/migrations/003_canvas_module_items.sql
mysql -u root -p park_guide_database < user_login/server/migrations/004_canvas_learning_progress.sql
mysql -u root -p park_guide_database < database/demo_canvas_courses.sql
```

## Local Asset Setup

The AI/CV model files, MediaPipe task file, training dataset, and runtime evidence folders are not committed to GitHub because they are large local assets. Download the asset ZIP files from the shared Google Drive folder and extract them into the repository root.

Google Drive asset folder:

```text
https://drive.google.com/drive/folders/1CQjiJNnVJYRK3W0qHI2qcUDwjG2cA0qV?usp=sharing
```

The Google Drive folder contains:

```text
alerts.zip
artifacts.zip
datasets.zip
models.zip
```

Download all four ZIP files and extract them into the repository root. After extraction, the folders must sit directly inside `my-react-app/`.

Expected local asset structure after extraction:

```text
my-react-app/
├── alerts/
│   ├── ai/
│   └── iot/
├── artifacts/
│   └── ctip_activity_v2/
│       ├── best_ctip_activity_v2_mobilenet.pt
│       ├── class_names.json
│       ├── final_model_evaluation.txt
│       ├── train_manifest.csv
│       ├── training_metrics.json
│       └── val_manifest.csv
├── datasets/
│   └── ctip_activity_v2/
│       └── train_ready/
│           ├── negative/
│           │   ├── hand_green/
│           │   ├── near_plant/
│           │   ├── near_wildlife/
│           │   └── normal_nature/
│           └── positive/
│               ├── plucking_plant_positive/
│               └── touching_wildlife_positive/
├── models/
│   └── hand_landmarker.task
└── .env
```

macOS / Linux extraction example:

```bash
unzip alerts.zip -d .
unzip artifacts.zip -d .
unzip datasets.zip -d .
unzip models.zip -d .
```

Windows PowerShell extraction example:

```powershell
Expand-Archive alerts.zip -DestinationPath . -Force
Expand-Archive artifacts.zip -DestinationPath . -Force
Expand-Archive datasets.zip -DestinationPath . -Force
Expand-Archive models.zip -DestinationPath . -Force
```

Verify the assets after extraction.

macOS / Linux:

```bash
npm run check:assets
```

Windows PowerShell:

```powershell
npm run check:assets:win
```

Do not commit the extracted asset folders or downloaded ZIP files.

## Run the Full Demo

Start MySQL first, then run:

```bash
npm run dev
```

Open the application URLs:

```text
Hub:        http://localhost:5173
Login:      http://localhost:5176/login/
Park Guide: http://localhost:5175/user
Admin:      http://localhost:5174/admin
Ranger:     http://localhost:5174/ranger
Mobile web: http://localhost:8081
API Health: http://localhost:4000/api/health
```

Demo account password:

```text
1234
```

Demo accounts:

```text
admin@example.com
user1@demo.local
user2@demo.local
user3@demo.local
ranger1@demo.local
ranger2@demo.local
ranger3@demo.local
```

## AI Camera Runtime

The AI camera monitor uses the final MobileNetV3 activity model and the MediaPipe hand landmarker model. Make sure the backend is running first with:

```bash
npm run dev
```

Then open a new terminal and activate the Python environment.

Conda environment:

```bash
conda activate cos30049
```

Python virtual environment, macOS / Linux:

```bash
source .venv/bin/activate
```

Python virtual environment, Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Run the AI camera monitor:

```bash
python scripts/run_ai_camera_monitor.py \
  --model-path artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt \
  --hand-model-path models/hand_landmarker.task \
  --backend-url http://localhost:4000
```

Optional camera selection:

```bash
python scripts/run_ai_camera_monitor.py \
  --model-path artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt \
  --hand-model-path models/hand_landmarker.task \
  --backend-url http://localhost:4000 \
  --camera-index 0
```

Optional custom evidence folder:

```bash
python scripts/run_ai_camera_monitor.py \
  --model-path artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt \
  --hand-model-path models/hand_landmarker.task \
  --backend-url http://localhost:4000 \
  --evidence-dir alerts/ai
```

When backend token authentication is enabled, the script reads `AI_CAMERA_TOKEN` from `.env` unless `--device-token` is provided.

Token-authenticated run:

```bash
python scripts/run_ai_camera_monitor.py \
  --model-path artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt \
  --hand-model-path models/hand_landmarker.task \
  --backend-url http://localhost:4000 \
  --device-token "<YOUR_AI_CAMERA_TOKEN>"
```

Local-only run without posting incidents to the backend:

```bash
python scripts/run_ai_camera_monitor.py \
  --model-path artifacts/ctip_activity_v2/best_ctip_activity_v2_mobilenet.pt \
  --hand-model-path models/hand_landmarker.task \
  --backend-url http://localhost:4000 \
  --no-backend-sync
```

The final AI activity model files are stored under:

```text
artifacts/ctip_activity_v2/
```

The final training dataset is stored under:

```text
datasets/ctip_activity_v2/train_ready/
```

Evidence output is stored in:

```text
alerts/ai/
```

The backend serves AI evidence through:

```text
http://localhost:4000/evidence/ai/<filename>
```

Controls:

```text
q or ESC = quit
s        = save manual snapshot
```

## IoT Prototype Setup

Run the full app or backend first, then publish a test IoT incident:

```bash
cd user_login/server
npm run publish:test-iot
```

The MQTT topic is:

```text
ctip/sensor/plant-zone-01/proximity
```

The expected simulated incident uses:

```text
source=IOT_SENSOR
event_type=ObjectCloseToPlant
sensor_id=plant-zone-01
location=Plant Zone 01
severity=low
status=New
```

For the physical ESP32 proximity monitor, create a local Arduino secrets file.

macOS / Linux:

```bash
cp arduino_secrets.example.h arduino_secrets.h
```

Windows PowerShell:

```powershell
Copy-Item arduino_secrets.example.h arduino_secrets.h
```

Edit `arduino_secrets.h` locally:

```c
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define IOT_SENSOR_DEVICE_TOKEN "YOUR_IOT_SENSOR_TOKEN"
```

`arduino_secrets.h` is ignored by Git and should never be committed.

## Main Routes

```text
Hub:                  http://localhost:5173
Login:                http://localhost:5176/login/
Park Guide Portal:    http://localhost:5175/user
Admin Portal:         http://localhost:5174/admin
Incident Detection:   http://localhost:5174/admin/detection
Park Ranger Console:  http://localhost:5174/ranger
Mobile Web Preview:   http://localhost:8081
Health API:           http://localhost:4000/api/health
Incidents API:        http://localhost:4000/api/incidents
Incident Summary API: http://localhost:4000/api/incidents/summary
```

## Useful API Checks

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
```

Update an incident status as Admin:

```bash
curl -X PATCH http://localhost:4000/api/incidents/<INCIDENT_ID>/status \
  -H "Content-Type: application/json" \
  -H "X-Actor-Role: admin" \
  -d '{"status":"In Review"}'
```

Submit a Park Ranger recommendation:

```bash
curl -X POST http://localhost:4000/api/incidents/<INCIDENT_ID>/ranger-recommendation \
  -H "Content-Type: application/json" \
  -H "X-Actor-Role: park_ranger" \
  -d '{"recommendation":"Recommend Resolved","note":"Ranger checked the evidence and recommends Admin review as resolved."}'
```

Allowed incident statuses:

```text
New, Reviewed, Acknowledged, In Review, Resolved, False Alarm
```

## Forgot Password / OTP Email Setup

The Forgot Password flow sends a 6-digit OTP using Gmail SMTP. The OTP is stored as a SHA-256 hash in `password_reset_tokens` and expires in 5 minutes.

Set email variables in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM="SFC Digital Park Guide <your-email@gmail.com>"
APP_BASE_URL=http://localhost:5176/login/
VITE_LOGIN_URL=http://localhost:5173/login/
VITE_USER_URL=http://localhost:5175/user
VITE_ADMIN_URL=http://localhost:5174/admin
```

## Build and Syntax Checks

macOS / Linux:

```bash
npm run build
npm run check:syntax
source .venv/bin/activate
python -m py_compile scripts/run_ai_camera_monitor.py
```

Windows PowerShell:

```powershell
npm run build
npm run check:syntax
.\.venv\Scripts\Activate.ps1
python -m py_compile scripts/run_ai_camera_monitor.py
```

## Security Notes

- Real credentials belong in `.env`, not source code.
- `.env.example` uses safe local placeholders.
- `arduino_secrets.h` is ignored by Git and should not be committed.
- Evidence responses use `/evidence/ai/<filename>` and `/evidence/iot/<filename>`.
- Admin is the only role allowed to make official incident status decisions.
- Park Ranger can view incidents, add field notes, and recommend outcomes.
- Park Ranger recommendations do not change the official incident status.
- Production deployment should use HTTPS, private MQTT, secure secret management, and encrypted evidence storage.

## Known Limitations

- This is a coursework prototype, not a production deployment.
- Login/register is a demo flow.
- Some route guards and security controls are prototype-level.
- The AI model requires local files under `artifacts/`, `models/`, and `datasets/`.
- MQTT behavior depends on network availability.
- The physical IoT prototype requires ESP32 setup and local WiFi configuration.
- Browser camera preview and the Python AI camera should not use the same physical camera at the same time.
- MySQL mode requires the local `cos30049_assignment` and `park_guide_database` databases.

## Do Not Commit

Do not commit these local files or folders:

```text
.env
arduino_secrets.h
.venv/
node_modules/
dist/
.expo/
alerts.zip
artifacts.zip
datasets.zip
models.zip
artifacts/
models/
datasets/
alerts/ai/
alerts/iot/
.asset-download-tmp/
```