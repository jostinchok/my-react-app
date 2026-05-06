# Presentation Smoke Test

Use this checklist before a live COS30049 CTIP presentation. It verifies the Canvas-style training flow, persistent Canvas progress, AI/IoT incident review, and Park Ranger recommendation boundary without touching runtime evidence or local secrets.

## 1. Database Migrations

Apply the training database and the two Canvas migrations:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS park_guide_database;"
mysql -u root -p park_guide_database < database/db.sql
mysql -u root -p park_guide_database < user_login/server/migrations/002_training_platform_tables.sql
mysql -u root -p park_guide_database < user_login/server/migrations/003_canvas_module_items.sql
mysql -u root -p park_guide_database < user_login/server/migrations/004_canvas_learning_progress.sql
```

Apply the monitoring incident migration if the AI/IoT database is not ready:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cos30049_assignment;"
mysql -u root -p cos30049_assignment < user_login/server/migrations/001_create_monitoring_incident_tables.sql
```

## 2. Start Services

Start the full local demo stack:

```bash
npm run dev
```

Expected local routes:

- Hub: `http://localhost:5173`
- Admin UI: `http://localhost:5174/admin`
- User Portal: `http://localhost:5175/user`
- Login UI: `http://localhost:5176/login`
- Backend health: `http://localhost:4000/api/health`
- User API health: `http://localhost:4001/api/health`
- Admin API health: `http://localhost:4002/api/health`

## 3. Canvas Course Builder

1. Open `http://localhost:5174/admin/course`.
2. Create a course with a course ID, name, start date, end date, and contact hours.
3. Add at least one module to that course.
4. Add one item for each presentation type if time allows: page, text, file, image, video, external link, quiz, and checklist.
5. Confirm each save shows a success snackbar.
6. If any save fails, confirm the error snackbar is visible and the dialog stays usable.

## 4. Admin Training View

1. Open `http://localhost:5174/admin/training`.
2. Confirm the Admin-created course/module appears.
3. Confirm module/item chips are readable and use dark text.
4. Open or inspect the module content preview if available.

## 5. User Portal Canvas Flow

1. Open `http://localhost:5175/user`.
2. Select the guide profile used for the demo.
3. Open the module created in Admin.
4. Preview page/text/file/image/video/link items.
5. Render checklist items and tick a non-quiz item complete.
6. Submit one quiz attempt.
7. Confirm the Canvas progress banner says the item or quiz attempt saved to MySQL.
8. Refresh the browser.
9. Confirm completed item and quiz state remain complete.
10. If the User API or MySQL is unavailable, confirm the Portal clearly says it is using local fallback.

## 6. AI Camera Incident

Run the AI camera monitor from the project virtual environment when assets are available:

```bash
source .venv/bin/activate
python scripts/run_ai_camera_monitor.py
```

Demo checks:

1. Trigger or capture an AI camera incident.
2. Verify the visible label is `Plucking Plants` for plant-related alerts.
3. Keep `TouchingPlants` only as an internal/backward-compatible model alias until retraining.
4. Confirm evidence is served through the backend route when available.

## 7. Admin Official Status

1. Open `http://localhost:5174/admin/detection`.
2. Select the `Plucking Plants` incident.
3. Change the official incident status as Admin.
4. Confirm a visible success snackbar appears for a saved backend status.
5. If the backend is unavailable or the save fails, confirm the UI says the status is local/fallback only and not an official saved status.

## 8. Park Ranger Recommendation

1. Open `http://localhost:5174/admin/ranger`.
2. Select the same incident.
3. Add a field note.
4. Send a recommendation such as `Recommend In Review`.
5. Confirm the Park Ranger page does not show official status buttons.
6. Confirm success says the recommendation was sent to Admin for review, or local fallback is clearly shown if the backend is offline.
7. Return to `http://localhost:5174/admin/detection` and confirm Admin can see the Park Ranger recommendation while Admin remains responsible for official status changes.

## 9. Final Wording Check

Run the required wording scan:

```bash
grep -RInE "Touching Plants|touching plants|touching plant|plant touching" \
  admin_page/src \
  user_page/src \
  user_login/server/src \
  user_login/server/scripts \
  scripts \
  PROJECT_NOTES.md README.md TODO.md WORKFLOW.md CYBERSECURITY_REVIEW.md || true
```

Expected result: no user-facing Admin/Ranger/User source labels use the old wording. A dataset-scraping notebook may still contain old search phrases and should remain untouched for this runtime demo pass.
