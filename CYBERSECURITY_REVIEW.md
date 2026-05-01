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
- Admin portal and Admin Incident Detection
- Park Ranger Alert Console
- Express backend API
- AI camera incident ingestion
- IoT MQTT/API incident ingestion
- MySQL incident persistence for AI/IoT monitoring incidents
- Evidence image/JSON storage in `alerts/ai` and `alerts/iot`
- Repository hygiene for secrets and large local files

The full training platform remains frontend-seeded. MySQL persistence currently covers AI/IoT monitoring incidents only.

## 2. Protected Assets

| Asset | Why it matters | Current protection |
| --- | --- | --- |
| Guide profiles | Personal and training identity data | Demo seeded frontend data; production recommendation is server-side auth and encrypted database storage. |
| Training records and quiz results | Assessment and certification evidence | Demo local browser state; production recommendation is MySQL persistence with access control. |
| Admin incident records | Operational monitoring data | Memory/MySQL incident store with validation and browser-safe evidence URLs. |
| AI/IoT evidence images/JSON | Review/report/training evidence | Stored in `alerts/ai` and `alerts/iot`; frontend receives `/evidence/ai/<filename>` or `/evidence/iot/<filename>`, not `/Users/...`. |
| IoT sensor payloads | Conservation enforcement signals | Optional device token validation for API/MQTT ingestion. |
| MySQL credentials | Database access secret | Loaded from `.env`; `.env.example` contains placeholders only. |
| Repository | GitHub safety | `.env`, `.venv`, `node_modules`, datasets, artifacts, models, and dist files are ignored. |

## 3. Threat Model

| Threat | Target | Example | Demo mitigation |
| --- | --- | --- | --- |
| Unauthorized incident injection | `/api/incidents` | Fake AI or IoT event posted to backend | Optional `DEVICE_TOKEN_AUTH_ENABLED=true` requires AI/IoT tokens. |
| Unauthorized status change | `/api/incidents/:id/status` | Park Guide marks an incident resolved | Optional `ROLE_CHECK_ENABLED=true` allows only `admin` and `park_ranger`. |
| Data leakage | Incident API/evidence paths | Frontend receives `/Users/...` local path | Evidence paths normalized to `/evidence/ai/<filename>` or `/evidence/iot/<filename>`. |
| Invalid payloads | Backend API | Unknown source/status/severity/event type | Backend validates source, event type, severity, status, and basic IoT numeric fields. |
| Secret exposure | GitHub repo | Real `.env` committed | `.env.example` uses placeholders; real `.env` should remain local. |
| Public MQTT spoofing | HiveMQ prototype broker | Anyone publishes to topic | Prototype limitation; optional token in payload, production private broker with TLS/auth. |
| Weak route protection | Frontend demo routes | Direct access to `/admin` | Documented limitation; API-level role check is available for incident status updates. |

## 4. Current Implemented Controls

- Backend validates `source`, `event_type`, `severity`, `status`, `distance_cm`, `threshold_cm`, and `sensor_id` shape for incident ingestion.
- Evidence URLs returned to frontend are browser-safe and do not expose `/Users/...`.
- `.env.example` exists with placeholders; real `.env` is not intended for Git.
- Passwords are hashed with `bcryptjs` in the existing MySQL auth endpoints when the legacy auth schema is loaded.
- Forgot-password backend stores only SHA-256 reset token hashes and expiry timestamps when the legacy auth schema is loaded.
- Admin and Park Ranger pages use different UI scopes and status-update roles.
- MySQL monitoring tables store AI/IoT incident records, metadata, actions, and evidence references.
- Runtime `.DS_Store`, dependency folders, model artifacts, datasets, and real environment files are excluded from the intended repository state.

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
- `PATCH /api/incidents/:id/status` allows only `X-Actor-Role: admin` or `X-Actor-Role: park_ranger`.
- `X-Actor-Role: park_guide`, missing roles, and unknown roles return `403`.

Generate local tokens:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run generate:tokens
```

Do not commit the generated token values.

## 6. Components Covered

| Component | Status | Cybersecurity coverage |
| --- | --- | --- |
| Login/Auth | Partial / Demo-ready | Demo role accounts are visible. Backend auth endpoints hash passwords if the legacy auth schema is loaded. Frontend route protection is not production-grade. |
| Park Guide/User Portal | Demo-ready | Role boundary is shown. User data is seeded/local; production persistence and route protection are deferred. |
| Admin Portal | Demo-ready | Admin dashboard and status updates use admin role header when optional role check is enabled. |
| Park Ranger Console | Demo-ready | Response-only scope. Sends `park_ranger` role header for status updates. |
| AI Camera Ingestion | Demo-ready | Supports optional `--device-token` and `X-Device-Token` backend validation. |
| IoT Sensor/MQTT Ingestion | Demo-ready / Prototype | MQTT/API publisher supports `IOT_SENSOR_TOKEN`; public HiveMQ remains prototype-only. |
| Backend API | Demo-ready | Validates incident payloads, optional token auth, optional role checks, and safe evidence URLs. |
| MySQL Incident Database | Demo-ready | Stores monitoring incidents/actions/evidence only. Full training records are deferred. |
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
| Training data only local | User portal | Data not centrally protected | Clearly marked frontend-seeded demo | Production MySQL persistence deferred | Show Project Scope audit table. |
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
9. Admin/Park Ranger status update accepted.
10. `/api/incidents` response without `/Users/...` paths.
11. Admin Incident Detection page.
12. Park Ranger Console page.
13. User Portal role boundary card.
14. Root hub Review Notes showing demo auth and optional controls.

## 10. Production Hardening Recommendations

- Use HTTPS for all frontend/backend traffic.
- Replace demo-open frontend routes with JWT or server-session authentication.
- Enforce server-side route protection for Admin and Park Ranger pages.
- Add formal role-based access control across all APIs.
- Store guide profiles, training records, assessments, and certificates in MySQL with authorization checks.
- Use a private MQTT broker with username/password and TLS.
- Add device token rotation, expiry, and revocation records.
- Use device identity per camera/sensor instead of shared demo tokens.
- Do not return password reset tokens in API responses; send reset links through email.
- Add audit log review UI for `monitoring_incident_actions`.
- Encrypt backups and define retention policy for evidence files.
- Run dependency scans, static analysis, and periodic vulnerability reassessment.
