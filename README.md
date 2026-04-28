# CTIP 2-Class Touching Species Prototype

This project is a controlled-condition AI/CV prototype for the COS30049 Computing Technology Innovation Project (CTIP).

The current selected prototype model is a **2-class classifier**:

- **TouchingPlants**
- **TouchingWildlife**

It includes:

- dataset renaming and organization
- 90/10 train/test split
- CLIP-based 2-class training
- offline evaluation
- real-time camera inference
- MediaPipe hand detection
- alert image saving
- JSON metadata saving
- IoT proximity sensor payload contract

---

## Project Goal

The purpose of this notebook is to support a real-time abnormal-interaction prototype for a digital park guide system.

The current AI direction is intentionally narrow:
- detect a hand region
- classify the touching interaction as either **TouchingPlants** or **TouchingWildlife**
- trigger an alert under controlled conditions
- save evidence for later admin-side integration

This is a **prototype**, not a production-ready field detector.

---

## Files

Main notebook:
- `CTIP_AI_Camera_Training_and_Incident_Detection.ipynb`

IoT Arduino sketch:
- `CTIP_IoT_Plant_Proximity_Monitor.ino`

Dependency file:
- `requirements.txt`

Expected trained model output:
- `C:\COS30049 Assignment\Artifacts\clip_2class_touching_species.pt`

Expected realtime alert output:
- `C:\COS30049 Assignment\Alerts\ai\`

Expected IoT MQTT topic:
- `ctip/sensor/plant-zone-01/proximity`

---

## Recommended Folder Structure

Use this structure on Windows:

```text
C:\COS30049 Assignment
├── Alerts
├── Artifacts
├── Datasets
│   ├── TouchingPlants
│   └── TouchingWildlife
├── Models
│   └── hand_landmarker.task
└── CTIP_AI_Camera_Training_and_Incident_Detection.ipynb
```

---

## Dataset

The 2-class experiment expects only these folders:

- `TouchingPlants`
- `TouchingWildlife`

The notebook will:
1. rename the image files
2. split the dataset into `train` and `test`
3. train the model
4. evaluate the model
5. run the realtime camera system

---

## Installation

Create and activate your Python environment first.

Then install dependencies:

```bash
pip install -r requirements.txt
```

### GPU note

If you want GPU support, install the correct PyTorch CUDA build first, then install the remaining requirements.

Example:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

After installation, verify CUDA inside Python:

```python
import torch
print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No CUDA")
```

---

## MediaPipe Hand Model

For the realtime notebook section, you must place the MediaPipe hand landmarker model here:

```text
C:\COS30049 Assignment\Models\hand_landmarker.task
```

If this file is missing, the realtime section will fail.

---

## How to Run

Open the notebook and run cells in order.

### Live Admin Incident Sync

The Admin Incident Dashboard can now read live AI and IoT alerts through the lightweight Express runtime incident bridge. This bridge uses in-memory/local JSON storage only. MySQL is still not required for incident sync.

Install and start the backend:

```bash
cd user_login/server
npm install
npm run dev
```

Expected backend URL:

```text
http://localhost:4000
```

By default, AI evidence is served from this repo's `Alerts/ai` folder at `/evidence/ai`. If your notebook or standalone camera script saves evidence to another folder, start the backend with `AI_EVIDENCE_DIR` pointing at that `Alerts/ai` directory. The backend converts local file paths into browser-safe URLs such as `/evidence/ai/example.jpg`, and the admin page renders those through `http://localhost:4000`.

Recommended Mac live-evidence workflow:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app

source /Users/chiayuenkai/cos30049/.venv/bin/activate

AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/Alerts/ai" npm run dev

python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/cos30049 \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/Alerts/ai
```

Expected evidence behavior:

- AI alert images are saved into `/Users/chiayuenkai/Desktop/GitHub/my-react-app/Alerts/ai`.
- Backend serves them from `http://localhost:4000/evidence/ai/<image-name>.jpg`.
- Admin image previews load from the backend URL, not the admin Vite URL.

Useful API checks:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
```

Start the admin page:

```bash
cd admin_page
npm install
npm run dev
```

Open the Vite URL printed by the terminal, then go to the Incidents/Detection resource. If the backend is online, the dashboard polls `GET /api/incidents` every 2.5 seconds. If the backend is offline, it shows the seeded fallback incidents from `admin_page/src/data/incidents.js`.

Manual AI incident test:

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

Manual AI incident with an existing evidence image:

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

Confirm static evidence serving:

```bash
ls /Users/chiayuenkai/Desktop/GitHub/my-react-app/Alerts/ai
curl -I "http://localhost:4000/evidence/ai/<actual-alert-image-filename>.jpg"
```

Expected: `HTTP/1.1 200 OK` when the image exists in the served evidence directory.

Manual IoT MQTT test:

```bash
cd user_login/server
npm run publish:test-iot
```

Expected result: the backend logs an IoT incident received from `ctip/sensor/plant-zone-01/proximity`, and the admin dashboard shows it within the polling interval.

Status update test:

```bash
curl -X PATCH http://localhost:4000/api/incidents/<INCIDENT_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Reviewed"}'
```

AI notebook integration: in the realtime helper cell, `save_alert_frame(...)` writes the image/JSON under `Alerts/ai` and calls `post_incident_to_backend(...)` for automatic alert saves. If the backend is offline, the notebook prints `[SYNC WARNING] Backend incident POST failed...` and continues saving local evidence.

### Part A: Training pipeline
This section will:
- rename images
- count images
- split dataset into 90% train / 10% test
- train the 2-class CLIP model
- save the trained model
- evaluate the test set

Saved model path:

```text
C:\COS30049 Assignment\Artifacts\clip_2class_touching_species.pt
```

### Part B: Realtime camera system
This section will:
- load the trained 2-class model
- open the webcam
- detect hands using MediaPipe
- crop the hand region
- classify it as:
  - TouchingPlants
  - TouchingWildlife
  - or reject it as Unknown / No Alert
- trigger alerts
- save evidence images
- save JSON metadata

---

## Realtime Controls

Inside the realtime window:

- Press **`q`** to quit
- Press **`s`** to manually save a snapshot

Saved alert files go to:

```text
C:\COS30049 Assignment\Alerts\ai
```

---

## AI / IoT Incident Contract

The monitoring subsystem now uses two complementary sources:

- `AI_CAMERA`: real-time camera detection for `TouchingPlants` and `TouchingWildlife`.
- `IOT_SENSOR`: ultrasonic proximity sensing for `ObjectCloseToPlant`.

AI evidence is saved as image and JSON files under:

```text
C:\COS30049 Assignment\Alerts\ai
```

The IoT sketch publishes JSON to:

```text
ctip/sensor/plant-zone-01/proximity
```

The admin/dashboard integration should treat both as incidents with source, event type, timestamp, location, status, severity, and source-specific evidence fields.

---

## Realtime Decision Logic

The realtime system uses:
- hand detection via MediaPipe
- CLIP classification on the hand crop
- confidence threshold
- top-1 vs top-2 margin check
- bounding box sanity filtering
- rolling touching votes
- cooldown to reduce repeated alerts

This is important because a 2-class model alone would otherwise force every image into one of the two touching classes.

---

## Expected Outputs

### Training
- renamed images
- train/test split
- saved model
- classification report
- confusion matrix

### Realtime
- bounding box around detected hand
- class label on screen
- confidence and margin display
- saved alert image
- saved JSON metadata

---

## Limitations

This prototype has several limitations:

- it is a **2-class touching-species classifier**, not a full abnormal detector
- it works best in **controlled conditions**
- it still depends on:
  - hand detection quality
  - crop quality
  - threshold tuning
  - dataset quality
- non-touching and unrelated scenes are handled through rejection logic, not a dedicated negative-class final model

Because of this, the system should be used as a **CTIP prototype** for demonstration and integration, not as a final deployment-ready park surveillance system.

---

## Troubleshooting

### 1. Webcam does not open
Check:
- camera permissions
- whether another app is already using the webcam
- whether `cv2.VideoCapture(0)` is correct for your machine

### 2. Model file not found
Make sure this file exists:

```text
C:\COS30049 Assignment\Artifacts\clip_2class_touching_species.pt
```

### 3. Hand model not found
Make sure this file exists:

```text
C:\COS30049 Assignment\Models\hand_landmarker.task
```

### 4. No GPU detected
Check:
- whether PyTorch was installed with CUDA support
- whether the notebook kernel is the correct environment
- whether `torch.cuda.is_available()` returns `True`

### 5. Alerts are not saving
Usually this means the alert condition is not being triggered.
Check:
- confidence threshold
- margin threshold
- rolling vote settings
- whether the hand detection box is valid

---

## Suggested Next Step

After confirming the notebook works, the next development step is:

- connect the alert image and JSON output into the backend
- show incidents on the admin page
- support review status such as:
  - New
  - Reviewed
  - False Alarm

---

## Author / Project Context

Course:
- **COS30049 Computing Technology Innovation Project**

Role:
- **AI / Computer Vision Lead**

Current AI prototype direction:
- **2-class TouchingPlants vs TouchingWildlife**
