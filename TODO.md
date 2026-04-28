# TODO

Current working directory:

```text
/Users/chiayuenkai/Desktop/GitHub/cos30049-assignment
```

## Immediate Next Tasks

- Keep polishing the existing `user_page` Park Guide/User rebuild.
- Visually confirm all module images render on:
  - Dashboard hero image area.
  - Module card image areas.
  - Module Details hero image.
  - Certificate cards with module artwork.
- Polish Dashboard spacing and image balance.
- Polish Module cards and Module Details hero image composition.
- Polish Certificates page visual richness.
- Polish Profile page layout so it feels less empty.
- Check responsive layout at desktop and mobile widths.
- Fix any remaining admin visual polish issues.
- Capture admin incident dashboard screenshots for report evidence.
- Verify live AI/IoT alert sync in the Admin Incident Dashboard.
- Verify AI evidence previews load from `http://localhost:4000/evidence/ai/...` in the admin detail panel.
- Keep frontend seeded data only for now.
- Do not connect Express/MySQL yet.

## Bugs To Fix

- Visual browser review is still needed after the image path helper fix.
- Working tree currently shows generated/install artifact noise under `user_page/dist`, `user_page/node_modules`, and `user_login/server/node_modules`.
- `user_page` build can fail after dependency churn if Rollup optional native packages are missing.
- Root `npm run dev` now checks `http://localhost:4000/api/health` and skips starting a duplicate backend when one is already running.
- Backend `/api/health` no longer requires MySQL for incident-sync testing, but it still reports the database as offline until MySQL is running and seeded.
- Root review hub service checks can show backend offline when MySQL is unavailable even though Express itself starts.
- MQTT public broker testing can fail if internet access or the public broker is unavailable; backend should keep running.
- AI evidence path fix is implemented: backend uses configurable `AI_EVIDENCE_DIR`, admin resolves backend evidence URLs, and Express/MySQL remains disconnected.
- Local AI assets should stay inside the project working directory under ignored `.venv/`, `artifacts/`, `datasets/`, `models/`, and `alerts/` folders.
- Camera docs should keep iPhone Continuity Camera as environment-dependent: tested through iPhone hotspot and Yoriichi's Router, but not guaranteed through OpenCV camera index switching.

## Improvements To Consider

- Add proper `.gitignore` rules for generated build/dependency folders after confirming whether this assignment repo expects them tracked.
- Replace alert-based UI feedback with polished toast messages.
- Add loading/empty/error states for future API-backed sections.
- Redesign admin and mobile to match the citrus energetic website theme after the user website is stable.
- Add backend endpoints for training modules, quiz progress, notifications, certificates, and file metadata later.
- Live backend/API bridge for AI JSON and IoT MQTT events is now implemented with memory/local JSON storage.
- Add a seeded MySQL setup guide and one command/script for local database import later.
- Add MySQL-backed incident persistence after the live runtime demo and report evidence are stable.
- Add lightweight tests or smoke checks for website build and review launcher.

## Items That Should Not Be Changed Yet

- Do not add optional VR/AR until required Part 1, security, and monitoring requirements are stable.
- Do not physically merge `user_page`, `mobile_app`, `admin_page`, and `user_login/server` into one source app.
- Do not replace the current website GUI with a completely unrelated template.
- Do not remove existing admin/mobile/backend folders.
- Do not delete assignment artifacts such as `Project Scope.pdf`, `alerts/`, `artifacts/`, `datasets/`, `models/`, or the CTIP notebook unless explicitly requested.
- Do not connect Express/MySQL yet.
- Do not connect Express/MySQL for the Admin Incident Dashboard until the seeded UI and report evidence are stable.
- Do not commit `.DS_Store`, local `node_modules`, or generated `dist` output unless the user explicitly decides the repo must track them.
