# TODO / Demo Readiness Checklist

Working folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

Git is available in this team repo branch for the final checkpoint. Do not stage real `.env`, `.venv`, `node_modules`, `datasets`, `artifacts`, `models`, `dist`, or `.DS_Store`.

## Project Scope Checklist

| Component | Classification | Demo check |
| --- | --- | --- |
| Review Hub | Demo-ready | Open `http://localhost:5173`; show all direct links, role notes, and optional cybersecurity-control notes. |
| Login/Register/Forgot Password | Partial / Demo-ready | Show demo users/roles and localStorage demo logout. Explain production JWT/session auth is deferred. |
| User/Park Guide portal | Demo-ready | Open `http://localhost:5175/user`; switch User01/User02/User03; show dashboard, modules, quiz, progress, certificates, notifications, schedule, resources, profile, and help. |
| Mobile Preview | Partial / Demo-ready | Open `http://localhost:8081`; show mobile-style access to training/account surfaces. |
| Admin Dashboard | Demo-ready | Open `http://localhost:5174/admin`; confirm admin landing page loads. |
| Admin Incident Detection | Demo-ready | Open `http://localhost:5174/admin/detection`; show AI and IoT rows, summary cards, filters, evidence, metadata, fallback/live states, and status update. |
| Park Ranger Console | Demo-ready | Open `http://localhost:5174/admin/ranger`; show response-only role, urgent incidents, field notes, and action buttons. |
| Backend API | Demo-ready | `curl http://localhost:4000/api/health`; confirm `persistence=mysql`, `requested=mysql`, and `active=mysql`. |
| AI camera script | Demo-ready | Run `scripts/run_ai_camera_monitor.py` from local `.venv`; use `--device-token` when token auth is enabled; press `q` or ESC to stop safely. |
| IoT simulation / physical sensor support | Partial / Demo-ready | Run `cd user_login/server && npm run publish:test-iot` or trigger the physical sensor while Admin Detection is open. Browser capture saves curated evidence under `alerts/iot`, serves `/evidence/iot/<filename>`, and shares the same memory/MySQL incident record with Park Ranger. |
| MySQL incident persistence | Demo-ready | Apply migration, run with `INCIDENT_STORAGE=mysql` and `INCIDENT_MYSQL_FALLBACK=none`, then query `monitoring_incidents`. |
| Cybersecurity controls | Partial / Demo-ready | Show `CYBERSECURITY_REVIEW.md`, `.env.example`, token generator, optional device tokens, optional role checks, validation behavior, and smoke test output. |
| Evidence/screenshot readiness | Demo-ready | Use README, WORKFLOW, and CYBERSECURITY_REVIEW screenshot checklists. |
| Citrus Energetic UI consistency | Done / Demo-ready | Hub, User Portal, Admin Dashboard, Admin Detection, Park Ranger, and Mobile preview now share the same forest/citrus/cream/lime visual system. |
| Shared demo logo | Done / Demo-ready | Generated logo mark is optimized and applied to the Hub, login surfaces, User Portal, Admin shell, Park Ranger route through Admin navigation, and Mobile preview. |
| Frontend image optimization | Done / Demo-ready | Generated hub hero is 136 KB; training images are WebP files below 100 KB each; `alerts/ai` evidence remains untouched. |

## Before Lecturer Demo

- [ ] Run `npm install` from `/Users/chiayuenkai/Desktop/GitHub/my-react-app`.
- [ ] Recreate `.venv` inside this folder if needed.
- [ ] Install Google Drive helper with `python3 -m pip install gdown`.
- [ ] Download local-only AI assets with `python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"`.
- [ ] Run `python3 scripts/check_required_assets.py`.
- [ ] Confirm `artifacts/clip_2class_touching_species.pt` exists locally.
- [ ] Confirm `models/hand_landmarker.task` exists locally.
- [ ] Confirm `datasets/touching-plants` and `datasets/touching-wildlife` exist locally.
- [ ] Confirm `user_login/server/.env` exists locally and is not staged.
- [ ] Confirm `alerts/ai` contains a few clean demo JPG/JSON evidence pairs.
- [ ] Confirm `alerts/iot` exists for browser-captured IoT evidence.
- [ ] Run `npm --prefix user_page run build`.
- [ ] Run `npm --prefix admin_page run build`.
- [ ] Run `node --check user_login/server/index.js`.
- [ ] Run `node --check scripts/dev-all.mjs`.
- [ ] Run `node --check scripts/hub-server.mjs`.
- [ ] Run `node --check user_login/server/scripts/publish-test-iot.js`.
- [ ] Run `node --check user_login/server/scripts/security-smoke-test.js`.
- [ ] Run `node --check user_login/server/scripts/generate-demo-tokens.js`.
- [ ] Run `source .venv/bin/activate && python -m py_compile scripts/run_ai_camera_monitor.py`.
- [ ] Generate local demo tokens with `cd user_login/server && npm run generate:tokens`.
- [ ] If showing cybersecurity controls, start app with `DEVICE_TOKEN_AUTH_ENABLED=true ROLE_CHECK_ENABLED=true`.
- [ ] Run `cd user_login/server && npm run security:smoke` with the same token values.
- [ ] Run backend API checks in MySQL mode and confirm `/api/health` does not show `active=memory`.
- [ ] Create `cos30049_assignment`, apply migration, create/reset `ctip_user`, and run MySQL mode.
- [ ] In Admin Detection, trigger IoT once and confirm the 2-second delayed 720p browser capture appears in both Admin and Park Ranger.
- [ ] Confirm browser MQTT and backend MQTT do not duplicate the same IoT trigger; same `public_id` or same source/event/sensor within 10 seconds should merge.
- [ ] Capture screenshots listed in README/WORKFLOW.
- [x] Confirm the shared Citrus logo is visible in the hub, User Portal sidebar, Admin sidebar, Park Ranger page through Admin, and Mobile preview.
- [ ] Manually review the UI surfaces for final screenshot framing after starting `npm run dev`.

## Intentionally Deferred

- Full training platform persistence in MySQL.
- Production-grade authentication and password reset.
- Production-grade JWT/session route protection.
- Private MQTT broker with TLS/authentication.
- Device-token rotation/revocation UI and audit review UI.
- Automated sync from memory fallback incidents into MySQL.
- Further AI threshold/model retraining.
- AI dataset improvement and collection of larger training data.

## Quick Safety Checks

Local-only folders should stay local:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
find . -path './.git' -prune -o -name '.DS_Store' -print
```

Expected: no output outside `.git`.

Check old paths are gone:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
rg "<old absolute repo path>"
```

Expected: no old absolute runbook paths.

Asset setup commands:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
python3 -m pip install gdown
python3 scripts/download_assets_gdrive.py --url "<GOOGLE_DRIVE_FOLDER_URL>"
python3 scripts/check_required_assets.py
```

Do not commit downloaded `artifacts/`, `datasets/`, `models/`, `.asset-download-tmp/`, real `.env`, `.venv`, `node_modules`, `dist`, or personal alert images.
