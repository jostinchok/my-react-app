# COS30049 End-to-End Testing Workflow

This file is the step-by-step testing workflow for the current `my-react-app` project setup.

Current working directory:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

The goal is to test the full incident pipeline:

```text
AI camera + IoT sensor
→ backend API
→ MySQL database
→ Admin Incident Detection page
→ Park Ranger Alert Console
```

---

## Part 0: Clean Start First

Before running anything, stop old servers that may still be occupying ports.

Open a terminal and run:

```bash
lsof -tiTCP:4000 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5173 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5174 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5175 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:8081 -sTCP:LISTEN | xargs kill -9 2>/dev/null
```

Then confirm the ports are clear:

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:5174 -sTCP:LISTEN
lsof -nP -iTCP:5175 -sTCP:LISTEN
lsof -nP -iTCP:8081 -sTCP:LISTEN
```

Expected result:

```text
No output
```

If there is no output, the ports are free.

---

## Part 1: Terminal 1, Start Full Project in MySQL Mode

Open **Terminal 1** and run:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app

INCIDENT_STORAGE=mysql \
DB_DATABASE=cos30049_assignment \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

Keep this terminal running.

Expected local URLs:

```text
Review hub:               http://localhost:5173
Backend API:              http://localhost:4000
User / Park Guide portal: http://localhost:5175/user
Admin dashboard:          http://localhost:5174/admin
Admin incidents:          http://localhost:5174/admin/detection
Park Ranger console:      http://localhost:5174/admin/ranger
Mobile web preview:       http://localhost:8081
```

---

## Part 2: Terminal 2, Verify Backend and MySQL Mode

Open **Terminal 2** and run:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
```

Check backend health:

```bash
curl http://localhost:4000/api/health
```

Expected result:

```text
Backend is online.
Incident storage active mode is mysql.
Storage status is online.
```

Check incidents:

```bash
curl http://localhost:4000/api/incidents
curl http://localhost:4000/api/incidents/summary
```

Check MySQL rows:

```bash
mysql -u root cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 5;"
```

Expected result:

```text
Existing AI_CAMERA or IOT_SENSOR incidents are listed if records exist.
```

---

## Part 3: Browser Tabs to Open

Open these pages in the browser:

```text
http://localhost:5173
http://localhost:5174/admin/detection
http://localhost:5174/admin/ranger
http://localhost:5175/user
```

Check the following:

```text
Hub opens successfully.
Admin Incident Detection opens successfully.
Park Ranger Alert Console opens successfully.
User portal opens successfully.
Admin and Park Ranger show the same incident queue.
```

---

## Part 4: Terminal 3, Test AI Camera Alert Flow

Open **Terminal 3** and run:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
source .venv/bin/activate
```

Run the AI camera monitor:

```bash
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai
```

Expected behavior:

```text
Camera opens.
Hand is detected.
TouchingPlants or TouchingWildlife is classified.
JPG and JSON evidence files are saved into alerts/ai.
Incident is posted to backend.
Incident is stored in MySQL.
Admin Incident Detection page shows the incident.
Park Ranger Alert Console shows the incident.
Evidence image loads correctly.
```

Realtime controls:

```text
q    Quit
ESC  Quit
s    Save manual snapshot
```

Expected shutdown message:

```text
Realtime camera stopped safely.
```

After generating one AI alert, go back to **Terminal 2** and run:

```bash
curl http://localhost:4000/api/incidents/summary

mysql -u root cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 5;"
```

Expected result:

```text
A new AI_CAMERA incident appears in MySQL.
```

---

## Part 5: Terminal 4, Generate IoT Sensor Data

Start with software MQTT testing before using the physical ESP32 sensor.

Open **Terminal 4** and run:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run publish:test-iot
```

Expected behavior:

```text
Backend receives MQTT payload.
A new IOT_SENSOR incident appears in /api/incidents.
Admin Incident Detection page shows the IoT incident.
Park Ranger Alert Console shows the IoT incident.
MySQL stores the IoT incident.
```

Then check from **Terminal 2**:

```bash
curl http://localhost:4000/api/incidents | grep IOT_SENSOR
curl http://localhost:4000/api/incidents/summary
```

Check MySQL:

```bash
mysql -u root cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, location, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 10;"
```

Expected MySQL row:

```text
source = IOT_SENSOR
event_type = ObjectCloseToPlant
status = New
```

---

## Part 6: If `npm run publish:test-iot` Fails

Use direct API simulation first. This confirms that backend, MySQL, Admin, and Park Ranger are working even if the MQTT broker is unavailable.

Run this from **Terminal 2**:

```bash
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "source": "IOT_SENSOR",
    "eventType": "ObjectCloseToPlant",
    "severity": "low",
    "location": "Plant Zone 01",
    "status": "New",
    "iot": {
      "sensorId": "plant-zone-01",
      "distanceCm": 14.6,
      "thresholdCm": 20,
      "topic": "ctip/sensor/plant-zone-01/proximity"
    },
    "notes": "Manual IoT sensor simulation from curl."
  }'
```

Then check:

```bash
curl http://localhost:4000/api/incidents | grep IOT_SENSOR

mysql -u root cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, location, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 10;"
```

If this works, the backend, MySQL, Admin page, and Park Ranger page are fine. Any remaining issue is likely MQTT publishing or broker availability.

---

## Part 7: Test Status Update from Park Ranger

Open:

```text
http://localhost:5174/admin/ranger
```

Click an AI or IoT incident.

Change the status to one of these:

```text
Acknowledged
In Review
Resolved
False Alarm
```

Then verify in **Terminal 2**:

```bash
mysql -u root cos30049_assignment \
  -e "SELECT public_id, source, event_type, status, occurred_at FROM monitoring_incidents ORDER BY occurred_at DESC LIMIT 10;"
```

Expected result:

```text
The selected incident status changes in MySQL.
```

Then open Admin Incident Detection:

```text
http://localhost:5174/admin/detection
```

Expected result:

```text
Admin sees the same updated status.
```

---

## Part 8: Full Final Test Order

Use this exact order when recording evidence:

```text
Terminal 1:
Start full workspace in MySQL mode.

Terminal 2:
Run curl and MySQL checks.

Browser:
Open Hub, Admin Incident Detection, Park Ranger Console, and User Portal.

Terminal 3:
Run AI camera and trigger one TouchingPlants or TouchingWildlife alert.

Terminal 2:
Check /api/incidents and MySQL table.

Terminal 4:
Run npm run publish:test-iot.

Terminal 2:
Check /api/incidents and MySQL table again.

Browser:
Confirm both AI_CAMERA and IOT_SENSOR incidents appear in Admin and Park Ranger.

Browser:
Use Park Ranger to update incident status.

Terminal 2:
Confirm the status update in MySQL.
```

---

## Part 9: Evidence Screenshots to Capture

Capture these screenshots for report evidence:

```text
1. Terminal 1 showing npm run dev running in MySQL mode.
2. /api/health showing MySQL active and online.
3. AI camera realtime detection window.
4. alerts/ai folder showing JPG and JSON evidence.
5. Admin Incident Detection showing AI_CAMERA and IOT_SENSOR.
6. Park Ranger Console showing the same incidents.
7. Park Ranger status update action.
8. MySQL query showing saved AI and IoT rows.
9. npm run publish:test-iot output or ESP32 serial monitor output.
10. Root review hub.
```

---

## Part 10: Full Git Checking, Staging, Committing, and Pushing Flow

Use this after testing, when you are ready to save the checkpoint to GitHub.

Do **not** run `git add .` immediately. Check first.

---

### Step 10.1: Go to the repo root

Open a fresh terminal and run:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
```

Confirm location:

```bash
pwd
```

Expected:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

---

### Step 10.2: Stop local servers before committing

This prevents runtime files from changing while you are staging.

```bash
lsof -tiTCP:4000 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5173 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5174 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5175 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:8081 -sTCP:LISTEN | xargs kill -9 2>/dev/null
```

Confirm they are stopped:

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
lsof -nP -iTCP:5174 -sTCP:LISTEN
lsof -nP -iTCP:5175 -sTCP:LISTEN
lsof -nP -iTCP:8081 -sTCP:LISTEN
```

Expected:

```text
No output
```

---

### Step 10.3: Check current Git status

```bash
git status --short --untracked-files=all
```

Look for three groups:

```text
1. Source/docs changes:
   README.md, PROJECT_NOTES.md, TODO.md, source files, migration files

2. Alert evidence:
   alerts/ai/*.jpg
   alerts/ai/*.json

3. Dangerous files:
   node_modules, .venv, dist, artifacts, datasets, models, .pt, .pth, .DS_Store, .env
```

If you see dangerous files, do **not** commit yet.

---

### Step 10.4: Run Git diff whitespace check

```bash
git diff --check
```

Expected:

```text
No output
```

If it prints trailing whitespace or conflict marker warnings, fix those files before continuing.

---

### Step 10.5: Run unsafe tracked file safety check

```bash
git ls-files | grep -E "node_modules|\.venv|datasets|artifacts|models|\.pt|\.pth|dist|\.DS_Store"
```

Expected:

```text
No output
```

If it prints anything, those files are already tracked and must be removed from Git tracking before pushing.

Remove tracked generated/local-only files without deleting local copies:

```bash
git rm -r --cached user_login/server/node_modules 2>/dev/null
git rm -r --cached user_page/node_modules 2>/dev/null
git rm -r --cached admin_page/node_modules 2>/dev/null
git rm -r --cached mobile_app/node_modules 2>/dev/null
git rm -r --cached user_page/dist 2>/dev/null
git rm -r --cached admin_page/dist 2>/dev/null
git rm -r --cached mobile_app/dist 2>/dev/null
git rm -r --cached .venv 2>/dev/null
git rm -r --cached artifacts 2>/dev/null
git rm -r --cached datasets 2>/dev/null
git rm -r --cached models 2>/dev/null
git rm --cached .DS_Store 2>/dev/null
```

Then run the safety check again.

---

### Step 10.6: Check `.env` safety

Real `.env` files must not be committed.

Run:

```bash
git status --short --untracked-files=all | grep -E "\.env$|\.env\."
```

Allowed:

```text
user_login/server/.env.example
```

Not allowed:

```text
.env
.env.local
user_login/server/.env
```

If a real `.env` appears, do not add it. Make sure it is ignored.

Check:

```bash
git check-ignore -v .env 2>/dev/null || echo ".env is not ignored"
git check-ignore -v user_login/server/.env 2>/dev/null || echo "user_login/server/.env is not ignored"
```

Expected: `.gitignore` rule should be shown.

---

### Step 10.7: Review alert evidence before adding

Because `alerts/` is intentionally not ignored, only commit clean demo evidence.

Check size and file count:

```bash
du -sh alerts/ai
find alerts/ai -type f | wc -l
find alerts/ai -maxdepth 1 -type f | sort
```

Recommended:

```text
Keep only a few clean JPG + JSON pairs.
Avoid committing large noisy runtime dumps.
```

A clean pair should look like:

```text
alerts/ai/2026-04-29_02-57-00_alert_TouchingPlants.jpg
alerts/ai/2026-04-29_02-57-00_alert_TouchingPlants.json
```

If you want to remove noisy duplicates, delete only the unwanted files manually:

```bash
rm alerts/ai/<unwanted-file-name>.jpg
rm alerts/ai/<unwanted-file-name>.json
```

Then recheck:

```bash
find alerts/ai -maxdepth 1 -type f | sort
```

---

### Step 10.8: Stage safe project files

Stage docs and source files explicitly:

```bash
git add README.md PROJECT_NOTES.md TODO.md
git add .gitignore
git add user_login/server/index.js
git add user_login/server/.env.example
git add user_login/server/migrations/001_create_monitoring_incident_tables.sql
git add user_login/server/src/incident/incidentUtils.js
git add user_login/server/src/incident/memoryIncidentStore.js
git add user_login/server/src/incident/mysqlIncidentStore.js
git add admin_page/src/pages/ParkRangerConsole.jsx
git add admin_page/src/main.jsx
git add admin_page/src/Admin.css
git add admin_page/src/data/incidents.js
git add index.html login/hub.css login/hub.js
git add scripts/run_ai_camera_monitor.py
git add CTIP_AI_Camera_Training_and_Incident_Detection.ipynb
```

Stage curated alert evidence only if you are happy with the files:

```bash
git add alerts/ai
```

Do not use `git add .` unless you have already checked everything carefully.

---

### Step 10.9: Review staged files

```bash
git diff --cached --stat
```

Then check staged paths:

```bash
git diff --cached --name-only
```

Make sure the staged list does **not** include:

```text
node_modules/
.venv/
dist/
artifacts/
datasets/
models/
*.pt
*.pth
.DS_Store
.env
```

If you accidentally staged something bad, unstage it:

```bash
git restore --staged <path>
```

Example:

```bash
git restore --staged .env
git restore --staged user_page/dist
```

---

### Step 10.10: Final safety check before commit

Run this again:

```bash
git ls-files | grep -E "node_modules|\.venv|datasets|artifacts|models|\.pt|\.pth|dist|\.DS_Store"
```

Expected:

```text
No output
```

Also check staged files:

```bash
git diff --cached --name-only | grep -E "node_modules|\.venv|datasets|artifacts|models|\.pt|\.pth|dist|\.DS_Store|\.env$"
```

Expected:

```text
No output
```

If the second command prints `user_login/server/.env.example`, that is okay. `.env.example` is allowed.

---

### Step 10.11: Commit

Use a clear commit message.

For the current checkpoint, recommended:

```bash
git commit -m "Add MySQL incident persistence and ranger monitoring flow"
```

Alternative messages:

```bash
git commit -m "Add AI IoT incident persistence workflow"
```

```bash
git commit -m "Add ranger incident console and MySQL monitoring storage"
```

---

### Step 10.12: Pull latest main before pushing

Since this is a shared repo, pull before pushing.

```bash
git pull --rebase origin main
```

If there are no conflicts, continue.

If there are conflicts:

```bash
git status
```

Open the conflicted files in VS Code, fix the conflict markers, then run:

```bash
git add <fixed-file>
git rebase --continue
```

If the rebase becomes messy and you want to stop:

```bash
git rebase --abort
```

Then ask for help before pushing.

---

### Step 10.13: Push to main

```bash
git push origin main
```

If the push is rejected because remote has new commits, run:

```bash
git pull --rebase origin main
git push origin main
```

---

### Step 10.14: Verify GitHub and local clean state

After pushing:

```bash
git status
git log --oneline -5
```

Expected:

```text
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

If `alerts/ai` still has untracked files after commit, decide whether they are new runtime evidence. If they are noisy, leave them uncommitted or delete them.

---

### Step 10.15: Quick post-push sanity check

After pushing, restart the app once:

```bash
INCIDENT_STORAGE=mysql \
DB_DATABASE=cos30049_assignment \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
npm run dev
```

Open:

```text
http://localhost:5173
http://localhost:5174/admin/detection
http://localhost:5174/admin/ranger
```

Then stop servers again if you are done:

```bash
lsof -tiTCP:4000 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5173 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5174 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:5175 -sTCP:LISTEN | xargs kill -9 2>/dev/null
lsof -tiTCP:8081 -sTCP:LISTEN | xargs kill -9 2>/dev/null
```

---

## Part 11: Final Expected System

After all tests pass, the working prototype becomes:

```text
AI camera + IoT sensor
→ backend API
→ MySQL database
→ Admin Incident Detection page
→ Park Ranger Alert Console
→ incident status update
→ MySQL status persistence
```

This is the key evidence that the project is no longer just a toy demo. It is a working AI/IoT incident monitoring prototype.
