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

## MySQL Database Setup

### Prerequisites

- **XAMPP** installed with the **MySQL** module enabled — [download xampp](https://www.apachefriends.org/download.html)
- **MySQL** VS Code extension installed — identifier `formulahendry.vscode-mysql` ([database-client.com](https://database-client.com))
- XAMPP MySQL service must be running before starting the backend

#### Start XAMPP MySQL

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL**.
3. The status light turns green when MySQL is ready.
4. Click on **Admin** at the right side of **MySQL** row.
5. After clicking the **Admin**, it will get into the **Dashboard** 
6. Click on the **phpMyAdmin** at the top panel of the **Dashboard**.
7. Download the **db.sql** file from the **database** folder in GitHub.
8. Click the import tab in the **phpMyAdmin** page and press **Choose File** and choose the **db.sql**.
9. Drag down and press **Import**.

#### Install the Database Client extension

1. Open VS Code.
2. Press `Ctrl + Shift + X` to open the Extensions panel.
3. Search for **MySQL** by Database Client(Certified) and the identifier `formulahendry.vscode-mysql`.
4. Click **Install**.
5. After installing, a database icon appears in the Activity Bar on the left.

---

### Step 1 — Connect to XAMPP MySQL via MySQL

1. Click the **MySQL** icon named "Database" in the VS Code Activity Bar (looks like a cylinder/database).
2. Click the **+** (Add Connection) button at the top of the panel.
3. Select **MySQL** as the database type.
4. Fill in the connection form:

| Field              | Value                          |
|--------------------|--------------------------------|
| Host               | `127.0.0.1`                    |
| Port               | `3306`                         |
| Username           | `root`                         |
| Password           | *(leave blank for XAMPP default)* |
| Database           | *(leave blank for now)*        |
| Name               | `Localdb`                  |

5. Click **Connect** (or **Test Connection** first to verify).
6. The connection appears in the Database Client panel. Expand it to see the available databases.

> **XAMPP default**: The XAMPP MySQL root account has no password by default. Leave the Password field empty unless you have set one in the XAMPP MySQL settings.

---

The script will:
- Create the `park_guide_database` database if it does not exist.
- Create all required tables (`roles`, `users`, `password_reset_tokens`, `guide_profiles`, `training_modules`, `incidents`, etc.)
- Seed the `roles` table with `admin` (id 1) and `guide` (id 2).
- Seed two test accounts (password for both is `1234`):

| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@test.com    | `1234`   |
| Guide | guide@test.com    | `1234`   |

---

### Step 3 — Configure the backend environment

Copy the example env file and fill in your credentials:

```powershell
Copy-Item user_login\server\.env.example user_login\server\.env
```

Then open `user_login/server/.env` and set:

```env
# Port
PORT=4001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # set this if your MySQL root has a password
DB_DATABASE=park_guide_database

# Email (for OTP password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Digital Park Guide <your_email@gmail.com>
```

> **Gmail App Password**: go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) to generate a 16-character app password. Your Google account must have 2FA enabled. Use this as `EMAIL_PASS`, not your normal Gmail password.

---

## Starting All Services

Open **three separate terminals** and run each command below in order.

### Terminal 1 — Backend API server

```powershell
cd user_login/server
npm install       
npm start
```

Expected output:

```
Server running on http://localhost:4001                 
[incidents] Runtime store loaded with N incident(s)
[mqtt] Connected to mqtt://broker.hivemq.com:1883
```

### Terminal 2 — User page (Guide portal)

```powershell
cd user_page
npm install       
npm run dev
```

Expected output:

```
VITE ready in Xms
➜  Local: http://localhost:5175/user
```

### Terminal 3 — Admin page (Admin dashboard)

```powershell
cd admin_page
npm install       
npm run dev
```

Expected output:

```
VITE ready in Xms
➜  Local: http://localhost:5174/admin
```

---

## Logging In

### User (Guide) login

1. Open `http://localhost:5175/user` in your browser.
2. Select **Guide** from the role dropdown.
3. Enter credentials:
   - Email: `guide@test.com`
   - Password: `1234`
4. Click **Login**.

### Admin login

1. Open `http://localhost:5174/admin` in your browser.
2. Select **Admin** from the role dropdown.
3. Enter credentials:
   - Email: `admin@test.com`
   - Password: `1234`
4. Click **Login**.

---

### Registering a new account

1. On either login page, click **Register User**.
2. Fill in **Full Name**, **Email**, **Password**, and select the appropriate **Role**.
3. Click **Register**.
4. After successful registration, log in with your new credentials.

> Admins can only log in on the admin page. Guides can only log in on the user page. Logging in with the wrong role will show an access denied error.

---

### Resetting a forgotten password

1. On the login page, click **Forgot Password?**
2. Enter your registered email and click **Send 6-digit OTP**.
3. Check your inbox for an email from Digital Park Guide with a 6-digit code.
4. Enter the OTP and your new password, then click **Reset Password**.
5. OTPs expire after **15 minutes**.

---

## Testing the Forgot Password Function

Use this step-by-step checklist to verify the full OTP reset flow is working end-to-end.

### Prerequisites

- Backend server is running on `http://localhost:4000`
- `user_login/server/.env` has valid `EMAIL_USER` and `EMAIL_PASS` values
- A registered account exists in the database (use `guide@test.com` or `admin@test.com` from the seed)
- Either the user page (`http://localhost:5175/user`) or admin page (`http://localhost:5174/admin`) is running

---

### Step 1 — Trigger the OTP request

1. Open the login page in your browser.
2. Click **Forgot Password?**
3. Enter a registered email address, e.g. `guide@test.com`.
4. Click **Send 6-digit OTP**.
5. The page switches to the reset form and shows:
   > *A 6-digit OTP has been sent to your email. Enter it below with your new password.*

**Expected backend log** (visible in the terminal running `node index.js`):

```
[auth] OTP email sent to guide@test.com
```

If the log instead shows:

```
[auth] OTP email failed for guide@test.com: ...
```

Check your `.env` email credentials. The OTP was still saved to the database — see the API fallback test below.

---

### Step 2 — Check your email inbox

1. Open the inbox for the email address you entered.
2. Look for a message from **Digital Park Guide** with subject **Your Digital Park Guide Password Reset OTP**.
3. The email contains a **6-digit code**, for example: `483921`
4. Copy the code.

> If the email does not arrive within 1–2 minutes, check your spam/junk folder.

---

### Step 3 — Complete the password reset

1. Back on the login page reset form, enter:
   - **OTP**: the 6-digit code from the email
   - **New Password**: your new password (e.g. `newpass123`)
2. Click **Reset Password**.
3. On success the page returns to the login form and shows:
   > *Password reset successful. Please login with your new password.*

---

### Step 4 — Verify the new password works

1. On the login form, enter the same email and your **new password**.
2. Select the correct role (Guide or Admin).
3. Click **Login**.
4. You should be logged in successfully.

---

### API-level test (without email)

If email is not configured yet, you can test the OTP flow directly via the API to confirm the database logic is working.

**Step A — Request an OTP and read it from the database:**

Open the Database Client in VS Code, connect to `XAMPP Local`, open the `park_guide_database`, and run:

```sql
SELECT u.email, t.token_hash, t.expires_at, t.used_at
FROM password_reset_tokens t
JOIN users u ON u.user_id = t.user_id
ORDER BY t.created_at DESC
LIMIT 5;
```

After clicking **Send 6-digit OTP** on the frontend, a new row appears with a fresh `token_hash` and a future `expires_at`.

**Step B — Call the reset endpoint directly (PowerShell):**

```powershell
# Replace the otp value with the 6-digit code shown in the forgot password API response
# (only visible during development if you temporarily log it server-side)
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/auth/reset-password" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"guide@test.com","otp":"123456","newPassword":"newpass123"}' |
  ConvertTo-Json
```

Expected response:

```json
{
  "message": "Password reset successful. Please login with your new password."
}
```

**Step C — Confirm the token is marked used:**

```sql
SELECT used_at FROM password_reset_tokens
JOIN users ON users.user_id = password_reset_tokens.user_id
WHERE users.email = 'guide@test.com'
ORDER BY created_at DESC LIMIT 1;
```

`used_at` should now have a timestamp instead of `NULL`.

---

### Common errors and fixes

| Error message | Cause | Fix |
|---|---|---|
| *Unable to send OTP.* | Email address not in database | Register the account first or use a seeded email |
| *OTP must be a 6-digit number.* | Wrong format entered | Make sure only digits are entered, no spaces |
| *Invalid reset token or expired token.* | OTP already used, wrong code, or 15 min expired | Request a new OTP |
| *[auth] OTP email failed* in server log | Bad EMAIL_USER / EMAIL_PASS in .env | Use a Gmail App Password, not your normal password |
| Email never arrives | Wrong email address or spam filter | Check spelling, check spam folder |

---

## Startup Checklist

Before using the app, confirm all of the following:

- [ ] MySQL service is running
- [ ] `park_guide_database` database and all tables exist (run `db.sql` if not)
- [ ] `user_login/server/.env` is configured with correct DB credentials
- [ ] Backend is running on `http://localhost:4001`
- [ ] User page is running on `http://localhost:5175/user`
- [ ] Admin page is running on `http://localhost:5174/admin`

---

## Author / Project Context

Course:
- **COS30049 Computing Technology Innovation Project**

Role:
- **AI / Computer Vision Lead**

Current AI prototype direction:
- **2-class TouchingPlants vs TouchingWildlife**
