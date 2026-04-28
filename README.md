# COS30049 Assignment - Sarawak Forestry Digital Park Guide System

This repository contains the source code and prototype materials for the COS30049 Computing Technology Innovation Project.

The project is a digital park guide system for Sarawak park operations. It includes a park guide training platform, an admin incident dashboard, a Park Ranger alert console, and an AI/IoT monitoring prototype for detecting abnormal interactions around protected plants and wildlife.

The current AI prototype focuses on two abnormal activity classes:

- `TouchingPlants`
- `TouchingWildlife`

This is a controlled-condition academic prototype. It is not a production-ready surveillance or conservation monitoring system.

---

## Project Overview

The system combines four main parts:

1. **User / Park Guide Training Platform**
   - Provides learning modules, progress tracking, certificates, notifications, schedules, resources, and profile information for park guides.

2. **Admin Dashboard**
   - Allows admin users to review AI camera incidents and IoT sensor incidents.

3. **AI / Computer Vision Prototype**
   - Uses MediaPipe hand detection and a CLIP-based classifier to detect whether a hand interaction is related to touching plants or touching wildlife.

4. **IoT Proximity Sensor Prototype**
   - Uses an ESP32 and ultrasonic sensor to detect when an object gets close to a protected plant zone.

The live incident bridge currently uses lightweight Express runtime storage. MySQL persistence is intentionally not connected yet.

---

## Current Prototype Status

Current working direction:

- Body camera idea has been dropped because it is not realistic for the current prototype.
- The monitoring system now uses:
  - real-time camera AI detection
  - IoT proximity sensing
- AI camera alerts can be sent to the admin dashboard.
- IoT MQTT alerts can be sent to the admin dashboard.
- Admin incident dashboard can display both AI and IoT incidents.
- Park Ranger alert console can view the same backend incident queue and update response status.
- MySQL is not required for the live incident demo.

---

## Main Features

### User / Park Guide Platform

- Park guide dashboard
- Training module catalog
- Module detail page
- Learning progress page
- Certificates and badges
- Notifications
- Schedule
- Resources
- Profile page
- Help / permission guide
- Seeded demo users

### Admin Platform

- Admin incident dashboard
- AI camera incident records
- IoT sensor incident records
- Incident filtering
- Incident detail panel
- Evidence image preview
- Incident metadata display
- Status workflow:
  - `New`
  - `Reviewed`
  - `False Alarm`

### Park Ranger Alert Console

- Incident-response-only console
- Live AI camera incident records from `/api/incidents`
- Live IoT proximity incident records from `/api/incidents`
- Evidence image preview through `/evidence/ai/<filename>`
- AI confidence, margin, bbox, and probability metadata
- IoT distance, threshold, and MQTT topic metadata
- Response status workflow:
  - `Acknowledged`
  - `In Review`
  - `Resolved`
  - `False Alarm`
- No user management, training module management, certificate approval, or system settings links

### AI / Computer Vision Prototype

- 2-class CLIP model
- MediaPipe hand detection
- Real-time webcam inference
- Hand crop classification
- Confidence and margin filtering
- Rolling vote logic
- Cooldown logic
- Alert image saving
- JSON metadata saving
- Live incident POST to backend
- Standalone camera script for demo stability

### IoT Prototype

- ESP32 ultrasonic proximity monitor
- MQTT JSON publishing
- Plant-zone proximity alert
- Backend MQTT subscriber
- Admin dashboard integration

---

## Repository Contents

This GitHub repository should contain source code and small demo files only.

```text
my-react-app/
├── admin_page/
├── user_page/
├── mobile_app/
├── user_login/
│   └── server/
├── scripts/
├── public/
├── images/
├── login/
├── CTIP_AI_Camera_Training_and_Incident_Detection.ipynb
├── CTIP_IoT_Plant_Proximity_Monitor.ino
├── requirements.txt
├── package.json
├── README.md
├── PROJECT_NOTES.md
├── TODO.md
└── .gitignore
```

The following folders should not be committed to GitHub:

```text
node_modules/
.venv/
dist/
artifacts/
datasets/
models/
```

`alerts/` is intentionally not ignored so small demo alert evidence can be
kept in the repository for review. Do not use it for large uncurated runtime
dumps.

---

## External Assets

Large AI assets are not stored in this GitHub repository.

Download the required external assets from Google Drive:

```text
Google Drive Asset Folder:
https://drive.google.com/drive/folders/1CQjiJNnVJYRK3W0qHI2qcUDwjG2cA0qV?usp=sharing
```

Google Drive folder structure:

```text
cos30049-assignment-assets/
├── artifacts/
│   └── clip_2class_touching_species.pt
├── datasets/
│   ├── touching-plants/
│   └── touching-wildlife/
├── models/
│   └── hand_landmarker.task
└── sample-evidence/
```

`cos30049-assignment-assets` is the downloadable Google Drive package name only.
After downloading, place the local-only AI asset folders into the project root.
Do not move `.venv` from another checkout; recreate `.venv` inside
`my-react-app` using the commands in this README.

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/
├── .venv/
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

Do not upload `.venv` to Google Drive. Other users should recreate the Python environment using `requirements.txt`.
GitHub does not store `.venv/`, `artifacts/`, `datasets/`, or `models/`
because they are local-only folders ignored by `.gitignore`. The `alerts/`
folder is not ignored, so curated demo alert evidence under `alerts/ai` can be
committed when it is useful for review.

---

## Model File Name

Current trained model file:

```text
clip_2class_touching_species.pt
```

Suggested clearer model name for future use:

```text
ctip_clip_touching_plants_wildlife_v1.pt
```

If the model is renamed, update all notebook and script paths that load the model.

---

## Recommended Local Folder Structure

### macOS

Keep the GitHub repository here:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

Keep downloaded AI assets inside the project working directory as local-only ignored folders, and recreate `.venv` inside this repo:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/
├── .venv/
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

Runtime AI evidence should also be saved locally inside the repository. The
`alerts/` folder is not ignored so selected demo evidence can be committed:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai/
```

### Windows

Recommended local Windows project asset structure:

```text
C:\COS30049 Assignment\
├── .venv\
├── artifacts\
│   └── clip_2class_touching_species.pt
├── datasets\
│   ├── touching-plants\
│   └── touching-wildlife\
├── models\
│   └── hand_landmarker.task
└── alerts\
    └── ai\
```

Runtime AI evidence can be saved to:

```text
C:\COS30049 Assignment\alerts\ai\
```

---

## Prerequisites

Required software:

- Node.js
- npm
- Python 3.12 recommended
- Git
- VS Code
- Arduino IDE
- Google Chrome or another modern browser

Python packages are listed in:

```text
requirements.txt
```

Important Python packages include:

- `torch`
- `torchvision`
- `transformers`
- `opencv-python`
- `mediapipe`
- `pillow`
- `numpy`
- `scikit-learn`
- `matplotlib`
- `requests`

---

## Clone the Repository

```bash
git clone https://github.com/jostinchok/my-react-app.git
cd my-react-app
```

---

## Install Node Dependencies

From the root folder:

```bash
npm install
```

This installs dependencies for the root launcher and sub-projects.

---

## Start the Full Review Workspace

From the root folder:

```bash
npm run dev
```

Expected local URLs:

```text
Backend API: http://localhost:4000
Review hub:  http://localhost:5173
User page:   http://localhost:5175/user
Admin page:  http://localhost:5174/admin
Admin incidents: http://localhost:5174/admin/detection
Park Ranger: http://localhost:5174/admin/ranger
Mobile web:  http://localhost:8081
```

The backend should run without MySQL. If MySQL is offline, the incident bridge should still work using memory and local runtime JSON.

---

## Running the User Platform

From the root folder:

```bash
npm run dev
```

Open:

```text
http://localhost:5175/user
```

The user platform currently uses seeded frontend demo data.

---

## Running the Admin Dashboard

From the root folder:

```bash
npm run dev
```

Open:

```text
http://localhost:5174/admin
```

Incident dashboard route:

```text
http://localhost:5174/admin/detection
```

The admin dashboard can show:

- seeded fallback incidents
- live AI camera incidents
- live IoT sensor incidents

If the backend is offline, the admin dashboard should still show seeded fallback incident data.

---

## Running the Park Ranger Alert Console

From the root folder:

```bash
npm run dev
```

Open:

```text
http://localhost:5174/admin/ranger
```

The Park Ranger page uses the backend incident API only:

```text
GET   /api/incidents
PATCH /api/incidents/:id/status
```

The page is scoped to incident response. It does not expose admin management
links for users, training modules, certificates, or settings.

---

## Live Admin Incident Sync

The backend provides a lightweight incident API.

Main endpoints:

```text
GET   /api/health
GET   /api/incidents
GET   /api/incidents/summary
POST  /api/incidents
PATCH /api/incidents/:id/status
```

Supported runtime statuses:

```text
New
Reviewed
Acknowledged
In Review
Resolved
False Alarm
```

Check backend health:

```bash
curl http://localhost:4000/api/health
```

Get incidents:

```bash
curl http://localhost:4000/api/incidents
```

Get incident summary:

```bash
curl http://localhost:4000/api/incidents/summary
```

---

## AI Evidence Image Serving

AI alert images are served by the backend from:

```text
/evidence/ai
```

Recommended macOS command when starting the full workspace:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app

AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" npm run dev
```

Expected behavior:

- AI alert images are saved into `alerts/ai`
- Backend serves images through `http://localhost:4000/evidence/ai/<image-name>.jpg`
- Admin and Park Ranger pages load evidence images from the backend URL

Confirm an image is served:

```bash
curl -I "http://localhost:4000/evidence/ai/<actual-image-name>.jpg"
```

Expected result:

```text
HTTP/1.1 200 OK
```

---

## Manual AI Incident Test

Post a fake AI incident:

```bash
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "source": "AI_CAMERA",
    "eventType": "TouchingPlants",
    "severity": "medium",
    "location": "Demo Camera Zone",
    "status": "New",
    "evidenceImage": null,
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
    "iot": null,
    "notes": "Manual test AI incident from curl."
  }'
```

Expected result:

- response contains an incident ID
- admin dashboard shows the new AI incident within a few seconds

---

## Manual AI Incident With Evidence Image

Use this only when the image already exists inside the backend evidence folder.

```bash
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "source": "AI_CAMERA",
    "eventType": "TouchingPlants",
    "severity": "medium",
    "location": "Demo Camera Zone",
    "status": "New",
    "evidenceImage": "/evidence/ai/<actual-alert-image-filename>.jpg",
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
    "iot": null,
    "notes": "Manual test AI incident with image."
  }'
```

Expected result:

- admin dashboard shows the incident
- detail panel displays the evidence image

---

## Python Environment Setup on macOS

Create the Python environment inside the project working directory:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app

python3.12 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel
python -m pip install -r /Users/chiayuenkai/Desktop/GitHub/my-react-app/requirements.txt
```

Verify important packages:

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

On MacBook Air M2:

- CUDA should be `False`
- MPS should ideally be `True`

Mac uses Apple Metal Performance Shaders (MPS), not NVIDIA CUDA.

---

## Running the AI Camera Monitor on macOS

Run the standalone AI camera monitor:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app

source .venv/bin/activate

python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
```

The standalone monitor supports these runtime options:

```text
--project-dir     project root containing artifacts/, datasets/, and models/
--evidence-dir    folder where alert JPG and JSON files are saved
--camera-index    OpenCV camera index for normal webcams
--backend-url     backend origin for /api/incidents and /evidence/ai
```

`--backend-url` defaults to `http://localhost:4000`, so it does not need to be
included for the standard local demo. Add it only if the backend runs elsewhere:

```bash
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai \
  --backend-url http://localhost:4000
```

Expected behavior:

- camera opens
- hand is detected
- interaction is classified as `TouchingPlants` or `TouchingWildlife`
- alert image is saved into `alerts/ai`
- alert JSON is saved into `alerts/ai`
- backend receives the incident if it is running
- backend returns browser-safe evidence paths under `/evidence/ai/<filename>`
- admin dashboard displays the new incident

Realtime controls:

```text
q    quit
ESC  quit
s    save manual snapshot
```

Expected shutdown output:

```text
Quitting...
Cleaning up camera resources...
Realtime camera stopped safely.
```

If VS Code Jupyter crashes when running the realtime camera cell, use the standalone Python script instead. The standalone script is the recommended demo method.

---

## Running the AI Notebook

Main notebook:

```text
CTIP_AI_Camera_Training_and_Incident_Detection.ipynb
```

The notebook includes:

- dataset renaming
- train/test split
- model training
- model evaluation
- realtime camera helper logic
- backend incident POST helper

The notebook expects these local-only files under the project root:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/artifacts/clip_2class_touching_species.pt
/Users/chiayuenkai/Desktop/GitHub/my-react-app/models/hand_landmarker.task
/Users/chiayuenkai/Desktop/GitHub/my-react-app/datasets/touching-plants/
/Users/chiayuenkai/Desktop/GitHub/my-react-app/datasets/touching-wildlife/
```

---

## AI Training Pipeline

The AI training pipeline performs:

1. image renaming
2. dataset counting
3. 90/10 train/test split
4. CLIP-based model training
5. model saving
6. test evaluation
7. confusion matrix generation

Expected trained model:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/artifacts/clip_2class_touching_species.pt
```

The model file is not included in GitHub. Download it from the Google Drive asset
package and place it under the project root `artifacts/` folder.

---

## AI Realtime Decision Logic

The realtime system uses:

- MediaPipe hand detection
- hand-region cropping
- CLIP classification
- confidence threshold
- top-1 vs top-2 margin checking
- bounding-box sanity filtering
- rolling vote logic
- cooldown to reduce repeated alerts

This is necessary because a 2-class model alone will always force an image into either `TouchingPlants` or `TouchingWildlife`.

---

## IoT Sensor Prototype

Arduino sketch:

```text
CTIP_IoT_Plant_Proximity_Monitor.ino
```

The IoT prototype publishes proximity alerts using MQTT.

Expected MQTT topic:

```text
ctip/sensor/plant-zone-01/proximity
```

Expected payload shape:

```json
{
  "source": "IOT_SENSOR",
  "event_type": "ObjectCloseToPlant",
  "sensor_id": "plant-zone-01",
  "location": "Plant Zone 01",
  "distance_cm": 14.6,
  "threshold_cm": 20,
  "status": "triggered",
  "severity": "low"
}
```

The backend subscribes to this topic and converts incoming MQTT payloads into admin incident records.

---

## Manual IoT MQTT Test

From the backend folder:

```bash
cd user_login/server
npm run publish:test-iot
```

Expected result:

- backend receives IoT MQTT message
- admin dashboard shows a new IoT incident
- detail panel shows sensor ID, distance, threshold, and topic

---

## Status Update Test

Replace `<INCIDENT_ID>` with an actual incident ID:

```bash
curl -X PATCH http://localhost:4000/api/incidents/<INCIDENT_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"In Review"}'
```

Expected result:

- response returns updated incident
- admin dashboard and Park Ranger console show the updated incident status

---

## Git and File Policy

Do not commit large or local runtime files.

Do not commit:

```text
node_modules/
.venv/
dist/
artifacts/
datasets/
models/
*.pt
*.pth
.env
```

Before pushing, run:

```bash
git ls-files | grep -E "node_modules|\.venv|datasets|artifacts|models|\.pt|\.pth|dist"
```

Expected result:

```text
nothing
```

If the command prints files, those files are still tracked and must be removed from Git tracking.

Remove tracked local assets without deleting them from your Mac:

```bash
git rm -r --cached models 2>/dev/null

git rm -r --cached artifacts 2>/dev/null

git rm -r --cached datasets 2>/dev/null

git rm -r --cached user_page/node_modules 2>/dev/null
git rm -r --cached admin_page/node_modules 2>/dev/null
git rm -r --cached mobile_app/node_modules 2>/dev/null
git rm -r --cached user_login/server/node_modules 2>/dev/null

git rm -r --cached user_page/dist 2>/dev/null
git rm -r --cached admin_page/dist 2>/dev/null
git rm -r --cached mobile_app/dist 2>/dev/null
```

Then commit the cleanup:

```bash
git add .gitignore README.md
git commit -m "Clean repository setup and update README"
git push
```

---

## Recommended `.gitignore`

Make sure `.gitignore` includes:

```gitignore
# macOS
.DS_Store

# Python environment and cache
.venv/
venv/
env/
__pycache__/
*.pyc
.ipynb_checkpoints/

# Node dependencies
node_modules/
**/node_modules/

# Build outputs
dist/
**/dist/
.vite/
.expo/
.expo-shared/

# Local environment files
.env
.env.local
.env.*
!.env.example

# AI datasets, models, and trained artifacts
datasets/
artifacts/
models/
*.pt
*.pth
*.onnx
*.h5
*.keras
*.pkl
*.joblib

# Runtime backend data
user_login/server/data/incidents.runtime.json

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

---

## Troubleshooting

### Port 4000 already in use

This happens when another backend server is already running, usually from a previous
`cd user_login/server && npm start` or `npm run dev` session.

The root launcher checks `http://localhost:4000/api/health` before starting the
backend. If that health endpoint already responds, it reuses the running backend
and prints:

```text
server already running on http://localhost:4000, skipping backend start
```

Check which process is using port 4000:

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
```

Kill the process by PID:

```bash
kill -9 <PID>
```

Or kill the listening process directly:

```bash
lsof -tiTCP:4000 -sTCP:LISTEN | xargs kill -9
```

If port 4000 is occupied by something that is not the backend API, the launcher
will continue starting the other review services and print:

```text
Port 4000 is occupied by another process. Run: lsof -nP -iTCP:4000 -sTCP:LISTEN
```

Then restart:

```bash
npm run dev
```

### Webcam does not open

Check:

- camera permission
- whether another app is using the webcam
- camera index
- macOS Privacy and Security settings

MacBook built-in camera works as the default camera. iPhone Continuity Camera
support is environment-dependent. It has worked when the MacBook was connected
to the iPhone hotspot, and it has also been tested working when both MacBook and
iPhone were connected to Yoriichi's Router network. OpenCV camera index
switching is still not guaranteed to manually select the iPhone camera. Keep
`--camera-index` for normal webcams, but do not claim it always selects iPhone
Continuity Camera.

### Model file not found

Make sure this file exists:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/artifacts/clip_2class_touching_species.pt
```

### Hand model not found

Make sure this file exists:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app/models/hand_landmarker.task
```

### AI evidence image does not show in admin

Check that the image exists:

```bash
ls /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
```

Check that backend serves it:

```bash
curl -I "http://localhost:4000/evidence/ai/<actual-image-name>.jpg"
```

Expected:

```text
HTTP/1.1 200 OK
```

If not, restart the project with:

```bash
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" npm run dev
```

### Backend reports MySQL offline

For the current prototype, MySQL is not required for live incident sync. The backend may report database offline in `/api/health`, but incident sync should still work.

### Jupyter kernel crashes when quitting realtime camera

Use the standalone script:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app

source .venv/bin/activate

python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
```

The script also accepts `--backend-url http://localhost:4000`; the default is
already `http://localhost:4000`.

---

## Known Limitations

- The AI model is only a 2-class prototype.
- It detects `TouchingPlants` and `TouchingWildlife` only.
- Non-touching or unrelated scenes are handled through rejection logic, not a dedicated negative class.
- Hand detection can fail when fingers are too close to the camera.
- Gloved hands may not be detected reliably.
- The model works best in controlled lighting and controlled camera distance.
- MQTT prototype uses a simple public or local broker setup.
- Incident persistence is currently in memory and local runtime JSON only.
- MySQL persistence is not connected yet.

---

## Suggested Report Evidence

Recommended screenshots for the final report:

1. AI realtime detection screen
2. AI alert image saved in `alerts/ai`
3. AI alert JSON metadata
4. Admin dashboard showing AI incident
5. Admin incident detail panel with image and metadata
6. Park Ranger alert console showing the same backend incident queue
7. Park Ranger status update to `Acknowledged`, `In Review`, `Resolved`, or `False Alarm`
8. IoT MQTT publish or ESP32 serial monitor
9. Admin dashboard showing IoT incident
10. IoT incident detail panel with distance and threshold
11. `GET /api/incidents` JSON response
12. Root workspace running with `npm run dev`

---

## Future Work

Planned next improvements:

- move runtime incident storage into MySQL
- improve admin dashboard audit trail
- add stronger negative-class model support
- add more training data
- improve field robustness
- add user authentication for production deployment
- replace prototype MQTT setup with authenticated broker
- add proper backend validation and logging

---

## Author / Project Context

Course:

```text
COS30049 Computing Technology Innovation Project
```

Role:

```text
AI / Computer Vision Lead
```

Current AI prototype:

```text
2-class TouchingPlants vs TouchingWildlife
```
