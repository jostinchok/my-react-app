# Cybersecurity Review

Demo folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

This review is for the COS30049 lecturer/tutor cybersecurity check. It documents what is implemented in the working demo, what is optional for security demonstration, and what remains production hardening.

## 1. Cybersecurity Scope

Cybersecurity coverage is tied to the real demo components:

- Review Hub
- Login/Register/Forgot Password demo flow
- Park Guide/User Portal
- Canvas-style training content database/API linkage
- Admin portal and Admin Incident Detection
- Park Ranger Alert Console
- Express backend API
- AI camera incident ingestion
- IoT MQTT/API incident ingestion
- MySQL incident persistence for AI/IoT monitoring incidents
- Evidence image/JSON storage in `alerts/ai` and `alerts/iot`
- Repository hygiene for secrets and large local files

Canvas-style training content is now connected from Admin to the Park Guide User Portal through the training APIs and `course_module_items` table. Canvas item completion and quiz results are still local/demo state and need server persistence before they are production-ready. MySQL persistence currently remains strongest for AI/IoT monitoring incidents, which stay separate from training content.

## 2. Protected Assets

| Asset | Why it matters | Current protection |
| --- | --- | --- |
| Guide profiles | Personal and training identity data | Demo guide/account data can be managed through the Admin training API; production recommendation is server-side auth, least-privilege access, and encrypted database storage. |
| Canvas training records and quiz results | Assessment and certification evidence | Canvas content is API/database linked, but item completion and quiz results are local browser state; production recommendation is MySQL persistence with access control. |
| Admin incident records | Operational monitoring data | Memory/MySQL incident store with validation and browser-safe evidence URLs. |
| AI/IoT evidence images/JSON | Review/report/training evidence | Stored in `alerts/ai` and `alerts/iot`; frontend receives `/evidence/ai/<filename>` or `/evidence/iot/<filename>`, not `/Users/...`. |
| IoT sensor payloads | Conservation enforcement signals | Optional device token validation for API/MQTT ingestion. |
| MySQL credentials | Database access secret | Loaded from `.env`; `.env.example` contains placeholders only. |
| Repository | GitHub safety | `.env`, `.venv`, `node_modules`, datasets, artifacts, models, and dist files are ignored. |

## 3. Threat Model

| Threat | Target | Example | Demo mitigation |
| --- | --- | --- | --- |
| Unauthorized incident injection | `/api/incidents` | Fake AI or IoT event posted to backend | Optional `DEVICE_TOKEN_AUTH_ENABLED=true` requires AI/IoT tokens. |
| Unauthorized status change | `/api/incidents/:id/status` | Park Guide or Park Ranger marks an incident resolved without Admin decision | Optional `ROLE_CHECK_ENABLED=true` allows only `admin` for official status updates. |
| Data leakage | Incident API/evidence paths | Frontend receives `/Users/...` local path | Evidence paths normalized to `/evidence/ai/<filename>` or `/evidence/iot/<filename>`. |
| Invalid payloads | Backend API | Unknown source/status/severity/event type | Backend validates source, event type, severity, status, and basic IoT numeric fields. |
| Secret exposure | GitHub repo | Real `.env` committed | `.env.example` uses placeholders; real `.env` should remain local. |
| Public MQTT spoofing | HiveMQ prototype broker | Anyone publishes to topic | Prototype limitation; optional token in payload, production private broker with TLS/auth. |
| Weak route protection | Frontend demo routes | Direct access to `/admin` | Documented limitation; API-level role checks are available for Admin status updates and Park Ranger recommendations. |

## 4. Current Implemented Controls

- Backend validates `source`, `event_type`, `severity`, `status`, `distance_cm`, `threshold_cm`, and `sensor_id` shape for incident ingestion.
- Evidence URLs returned to frontend are browser-safe and do not expose `/Users/...`.
- `.env.example` exists with placeholders; real `.env` is not intended for Git.
- Passwords are hashed with `bcryptjs` in the existing MySQL auth endpoints when the legacy auth schema is loaded.
- Forgot-password backend stores only SHA-256 reset token hashes and expiry timestamps when the legacy auth schema is loaded.
- Admin-created Canvas courses, modules, and module items are connected to the Park Guide User Portal through the training APIs.
- Canvas module item completion and quiz-attempt results are local/demo state until a server-side progress API is implemented.
- Admin and Park Ranger pages use different UI scopes: Admin makes official status decisions, while Park Ranger submits field notes and recommendations.
- MySQL monitoring tables store AI/IoT incident records, metadata, actions, and evidence references.
- Runtime `.DS_Store`, dependency folders, model artifacts, datasets, and real environment files are excluded from the intended repository state.
- Local asset setup scripts verify required AI/CV files without committing model weights, datasets, `.env`, or personal alert evidence.

## 5. Demo-Safe Optional Controls

Optional controls are disabled by default so the existing lecturer demo still works.

```env
DEVICE_TOKEN_AUTH_ENABLED=false
ROLE_CHECK_ENABLED=false
```

When enabled:

- `POST /api/incidents` with `source=AI_CAMERA` requires `X-Device-Token: <AI_CAMERA_TOKEN>`.
- `POST /api/incidents` with `source=IOT_SENSOR` requires `X-Device-Token: <IOT_SENSOR_TOKEN>` or `payload.device_token`.
- MQTT IoT payloads support `device_token`.
- `PATCH /api/incidents/:id/status` allows only `X-Actor-Role: admin`.
- `POST /api/incidents/:id/ranger-recommendation` allows `X-Actor-Role: park_ranger` to submit field notes and recommended outcomes without changing official status.
- `X-Actor-Role: park_guide`, missing roles, and unknown roles return `403`.

Generate local tokens:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run generate:tokens
```

Do not commit the generated token values. Do not commit downloaded Google Drive assets, `.asset-download-tmp/`, real `.env`, or personal camera evidence.

## 6. Components Covered

| Component | Status | Cybersecurity coverage |
| --- | --- | --- |
| Login/Auth | Partial / Demo-ready | Demo role accounts are visible. Backend auth endpoints hash passwords if the legacy auth schema is loaded. Frontend route protection is not production-grade. |
| Park Guide/User Portal | Demo-ready | Role boundary is shown. Canvas course/module/item content can load from the user API. Item completion, quiz attempts, production persistence, and route protection are still deferred. |
| Admin Portal | Demo-ready | Admin dashboard and status updates use admin role header when optional role check is enabled. |
| Park Ranger Console | Demo-ready | Response-only scope. Sends `park_ranger` role header for field-note recommendation posts, not official status updates. |
| AI Camera Ingestion | Demo-ready | Supports optional `--device-token` and `X-Device-Token` backend validation. |
| IoT Sensor/MQTT Ingestion | Demo-ready / Prototype | MQTT/API publisher supports `IOT_SENSOR_TOKEN`; public HiveMQ remains prototype-only. |
| Backend API | Demo-ready | Validates incident payloads, optional token auth, optional role checks, and safe evidence URLs. |
| MySQL Incident Database | Demo-ready | Stores monitoring incidents/actions/evidence only. AI/IoT incident workflow remains separate from training content. |
| Training Content Database | Partial / Demo-ready | Stores Admin-created Canvas courses/modules/items and related training demo data. Canvas progress and quiz-result persistence still need a dedicated server-side progress API and access-control review. |
| Evidence Storage | Demo-ready | Repo-local `alerts/ai` and `alerts/iot`, served through `/evidence/ai` and `/evidence/iot`; frontend hides absolute filesystem paths. |
| GitHub Hygiene | Demo-ready | Real secrets and large local runtime/model/dependency folders should remain untracked. |

## 7. Vulnerability Assessment Table

| Risk | Affected component | Impact | Current mitigation | Remaining limitation | Demo evidence |
| --- | --- | --- | --- | --- | --- |
| Direct admin route access | Admin frontend | Unauthorized user can open demo UI | Role boundaries documented; optional backend role check protects status update API | No production JWT/session route guard | Show `/admin`, `/admin/ranger`, and this review note. |
| Fake AI/IoT incident POST | Backend API | False alerts and noisy evidence | Optional device tokens reject missing/wrong tokens | Disabled by default for easy demo | Run `npm run security:smoke` with token auth enabled. |
| Park Guide updates incident status | Backend API | Incorrect incident closure | Optional role check rejects `park_guide` | Disabled by default for easy demo | Smoke test shows `403` for `park_guide`. |
| Public MQTT broker spoofing | IoT bridge | Topic can receive public messages | Optional `device_token` in payload when token mode is enabled | Public HiveMQ has no broker-level auth | Explain production private MQTT with TLS/auth. |
| Absolute path exposure | API/frontends | Local user path leakage | Evidence normalization returns `/evidence/ai/<filename>` or `/evidence/iot/<filename>` | Raw local evidence files still exist on demo machine | Smoke test checks no `/Users/` in `/api/incidents`. |
| Real secrets in Git | Repo | Credential leakage | `.env.example` placeholders and Git ignore rules | Manual review required before commits | Show `.env.example` and safety grep. |
| Canvas progress and quiz results only local | User portal | Completion evidence can be lost on refresh/device change and is not centrally protected | Canvas content is API/database linked and local progress is clearly marked as demo state | Persistent progress API, access control, and Admin guide progress summary are pending | Show Project Scope audit table and TODO priority section. |
| Password reset token exposure in demo | Auth endpoint | Demo endpoint returns token for local testing | Token hash stored in DB; response is demo-only | Production email delivery flow deferred | Explain limitation in tutor review. |

## 8. Tutor Demo Commands

Start the app with optional security controls:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
DEVICE_TOKEN_AUTH_ENABLED=true \
ROLE_CHECK_ENABLED=true \
INCIDENT_STORAGE=mysql \
INCIDENT_MYSQL_FALLBACK=none \
DB_DATABASE=cos30049_assignment \
AI_CAMERA_TOKEN="<copy-generated-ai-token>" \
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" \
AI_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai" \
IOT_EVIDENCE_DIR="/Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/iot" \
npm run dev
```

Run smoke test in another terminal with the same token values:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
DEVICE_TOKEN_AUTH_ENABLED=true \
ROLE_CHECK_ENABLED=true \
AI_CAMERA_TOKEN="<copy-generated-ai-token>" \
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" \
npm run security:smoke
```

Run AI camera with token mode:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
source .venv/bin/activate
python scripts/run_ai_camera_monitor.py \
  --project-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app \
  --evidence-dir /Users/chiayuenkai/Desktop/GitHub/my-react-app/alerts/ai \
  --backend-url http://localhost:4000 \
  --device-token "<copy-generated-ai-token>"
```

The camera script also reads AI_CAMERA_TOKEN from the root .env automatically when `--device-token` is omitted, so normal demo runs do not need to paste the token in the terminal.

Run IoT publisher with token mode:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
IOT_SENSOR_TOKEN="<copy-generated-iot-token>" npm run publish:test-iot
```

## 9. Screenshot Checklist

Capture:

1. `CYBERSECURITY_REVIEW.md` vulnerability table.
2. `user_login/server/.env.example` placeholders.
3. `npm run generate:tokens` output with values hidden/redacted in report if needed.
4. `/api/health` showing MySQL incident storage plus `security.deviceTokenAuthEnabled` and `security.roleCheckEnabled`.
5. `npm run security:smoke` PASS output.
6. Wrong AI token rejected with `401`.
7. Wrong IoT token rejected with `401`.
8. Park Guide status update rejected with `403`.
9. Park Ranger official status update rejected and recommendation post accepted.
10. Admin official status update accepted.
11. `/api/incidents` response without `/Users/...` paths.
12. Admin Incident Detection page.
13. Park Ranger Console page.
14. User Portal role boundary card.
15. Root hub Review Notes showing demo auth and optional controls.

## 10. Production Hardening Recommendations

- Use HTTPS for all frontend/backend traffic.
- Replace demo-open frontend routes with JWT or server-session authentication.
- Enforce server-side route protection for Admin and Park Ranger pages.
- Add formal role-based access control across all APIs.
- Persist Canvas item completions, quiz attempts, guide progress summaries, assessments, and certificates in MySQL with authorization checks.
- Use a private MQTT broker with username/password and TLS.
- Add device token rotation, expiry, and revocation records.
- Use device identity per camera/sensor instead of shared demo tokens.
- Do not return password reset tokens in API responses; send reset links through email.
- Add audit log review UI for `monitoring_incident_actions`.
- Encrypt backups and define retention policy for evidence files.
- Run dependency scans, static analysis, and periodic vulnerability reassessment.
