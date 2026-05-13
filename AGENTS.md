# AI Agent Rules

This repo is in final presentation readiness mode for Sprint #2. Keep scope tight.

## Hard Rules

- Work only on `shared-default-style-v12` unless the user explicitly changes the branch instruction.
- Do not touch `main`.
- Do not touch `user_page` UI/UX. Another teammate owns that surface.
- Do not add new features.
- Do not redesign the system.
- Do not restore stashed User Portal or training notebook changes.
- Do not commit datasets, `.env` files, model artifacts, runtime database files, generated incident files, `.venv`, `node_modules`, `dist`, or `user_login/server/data/`.
- Do not run package upgrades or `npm audit fix` unless a real demo-blocking issue requires it.
- Keep Sprint #2 claims accurate: prototype-level AI/IoT incident workflow, MySQL incident persistence, MQTT support, device-token security, and role-based Admin/Ranger incident handling.
- Park Ranger must not officially resolve, close, or change incident status.
- Park Ranger can only view incidents, add field notes, and submit recommendations.
- Admin performs final official incident status updates.
- Only stabilize demo-blocking issues in `admin_page`, backend/admin API stability, and AI/IoT incident demo flow.

## Required Start Checklist

- Run `git status --short --branch`.
- Read `PROJECT_NOTES.md`, `TODO.md`, `DEMO_CHECKLIST.md`, and this file.
- Confirm the branch is `shared-default-style-v12`.
- Confirm whether MySQL and the backend health endpoints are already running before editing code.

## Required Documentation Sync

After any demo-readiness change, update:

- `PROJECT_NOTES.md`
- `TODO.md`
- `DEMO_CHECKLIST.md`

Only update docs with facts that were actually verified in the current pass or clearly mark them as risk/backup guidance.
