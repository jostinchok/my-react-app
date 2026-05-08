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

From a clean terminal, install dependencies if needed and start the full local demo stack:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm install
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

Seed the three presentation courses in a second terminal after `http://localhost:4002/api/health` is online:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm run seed:canvas-demo
```

Expected seeded courses:

- SFC Field Response Essentials
- Sarawak Protected Wildlife Awareness
- SFC Park Guide Orientation

## 3. Canvas Course Builder

1. Open `http://localhost:5174/admin/course`.
2. Click `Insert Demo Courses` if `npm run seed:canvas-demo` has not already been run.
3. Confirm at least the three SFC demo courses are visible.
4. Create a course with a course ID, name, start date, end date, and contact hours only if you need to show manual creation.
5. Add one item for each presentation type if time allows: page, text, file, image, video, external link, quiz, and checklist.
6. Confirm each save shows a success snackbar.
7. If any save fails, confirm the error snackbar is visible and the dialog stays usable.

## 4. Admin Training View

1. Open `http://localhost:5174/admin/training`.
2. Confirm the Admin-created course/module appears.
3. Confirm module/item chips are readable and use dark text.
4. Open or inspect the module content preview if available.

## 5. User Portal Canvas Flow

1. Open `http://localhost:5175/user`.
2. Select the guide profile used for the demo.
3. Confirm the course list shows the three backend demo courses.
4. Open one course and confirm the course-level internal navigation shows Overview, Modules, Item Detail, Progress, Files, and Completion.
5. Open a module item detail and preview page/text/file/image/video/link items.
6. Render checklist items and tick a non-quiz item complete.
7. Submit one quiz attempt.
8. Confirm the Canvas progress banner says the item or quiz attempt saved to MySQL.
9. Refresh the browser.
10. Confirm completed item and quiz state remain complete.
11. Open `http://localhost:5174/admin/students`.
12. Confirm the matching guide card shows Canvas completion percentage, completed item count, quiz attempt count, and latest quiz score.
13. If the User API or MySQL is unavailable, confirm the Portal clearly says it is using local fallback and Admin shows a safe empty/fallback progress message.

## 6. AI Camera Incident

Run the AI camera monitor on Chia's Mac with the project Conda Python:

```bash
/opt/homebrew/Caskroom/miniconda/base/envs/cos30049/bin/python scripts/run_ai_camera_monitor.py --backend-url http://localhost:4000 --camera-index 0
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

Run the required old plant-wording scan from the final verification checklist.

Expected result: no matches for the old user-facing wording. Internal `TouchingPlants` class aliases may remain only where needed for the old AI model compatibility layer.


## V11 User Portal polish checks

After seeding the Canvas demo courses, verify these User Portal details:

1. The User Portal shows the selected-course count, for example `3 modules in this course`, instead of only the global module total.
2. Course modules follow the Admin learning order, not alphabetical order.
3. The top breadcrumb changes with the active area, such as `SFC / Course Overview`, `SFC / Modules`, `SFC / Item Detail`, `SFC / Progress`, `SFC / Files`, and `SFC / Completion`.
4. Module item detail shows a locked sequential learning flow. Later items stay locked until the previous item is completed.
5. File and external-link learning items mark progress only after the guide opens the file or link.

Recommended evidence sequence:

```text
User Portal -> Courses
User Portal -> Course Overview
User Portal -> Modules
User Portal -> Item Detail
User Portal -> Files
User Portal -> Completion
Admin -> Course Builder
Admin -> Training Overview
Admin API -> /api/health
```

## V15 Admin Incident Consolidation Check

The Admin portal now treats `/admin/detection` as the official incident operations page.

Expected behavior:
- Sidebar shows `Incidents`, not a duplicate `Incident Ops` item.
- Dashboard shortcut opens `/admin/detection`.
- Park Ranger still uses `Ranger Review` for recommendation-only review.
- Sensor Rules remains separate for IoT grouping and noise reduction.
- Admin remains the only role that makes final incident status decisions.


## Canvas Demo Course SQL Setup

Use the SQL insert file as the official presentation setup path:

~~~bash
mysql -u root -p cos30049_assignment < database/demo_canvas_courses.sql
~~~

Expected verification result:

~~~text
SFC-FIELD-2026       SFC Field Response Essentials          3   16
SFC-GUIDE-2026       SFC Park Guide Orientation             3   18
SFC-WILDLIFE-2026    Sarawak Protected Wildlife Awareness   3   12
~~~

Check these pages after starting the app:

~~~text
http://localhost:5174/admin/course
http://localhost:5174/admin/training
http://localhost:5175/user
~~~
