# Final Presentation Demo Checklist

This checklist is for final demo readiness on `shared-default-style-v12`. It does not add project scope.

## 1. Preflight

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
git branch --show-current
git status --short --branch
```

Expected:

- Branch is `shared-default-style-v12`.
- Do not switch to `main`.
- `user_login/server/data/` may exist as untracked runtime data and must stay uncommitted.
- No local datasets, model artifacts, `.env`, runtime database files, or generated incident files should be staged.

## 2. Required Local Services

MySQL is required for the final Sprint #2 claim about incident persistence.

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'cos30049_assignment';"
mysql -u root -p cos30049_assignment -e "SELECT COUNT(*) AS incident_count FROM monitoring_incidents;"
```

Use the local MySQL account configured in `user_login/server/.env` if it is not `root`.

Required backend environment for the full security demo:

```text
INCIDENT_STORAGE=mysql
INCIDENT_MYSQL_FALLBACK=none
DEVICE_TOKEN_AUTH_ENABLED=true
ROLE_CHECK_ENABLED=true
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=ctip/sensor/plant-zone-01/proximity
```

## 3. Startup Commands

Start the whole demo stack:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
npm run dev
```

If you need to start pieces manually:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
node user_login/server/index.js
node admin_page/adminServer.js
npm --prefix admin_page run dev
node scripts/hub-server.mjs
```

Optional local IoT test publisher:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run publish:test-iot
```

Optional security smoke test when token values are configured:

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app/user_login/server
npm run security:smoke
```

## 4. URLs To Open

- Hub: `http://localhost:5173`
- Admin dashboard: `http://localhost:5174/admin`
- Admin incidents: `http://localhost:5174/admin/detection`
- Park Ranger recommendation console: `http://localhost:5174/admin/ranger`
- Ranger Review: `http://localhost:5174/admin/ranger-review`
- Sensor Rules: `http://localhost:5174/admin/sensor-rules`
- Backend Map: `http://localhost:5174/admin/backend-map`
- Guide Account Management: `http://localhost:5174/admin/students`
- Main backend health: `http://localhost:4000/api/health`
- Admin API health: `http://localhost:4002/api/health`
- Incident summary: `http://localhost:4000/api/incidents/summary`
- AI evidence route: `http://localhost:4000/evidence/ai`
- IoT evidence route: `http://localhost:4000/evidence/iot`

## 5. Demo Order

1. Open the hub and state that Sprint #2 is a prototype demo, not a production release.
2. Open Admin Dashboard and show monitoring/training overview only at the level already reported.
3. Open Admin Incidents and show AI/IoT Incident Operations.
4. Select a plant-related AI incident and confirm the visible label says `Plucking Plants`.
5. Show evidence and metadata from AI camera or IoT sensor rows.
6. Change an official incident status as Admin.
7. Open Park Ranger Console and add a field note.
8. Submit a Ranger recommendation.
9. Return to Admin Incidents and show Ranger recommendations are visible for Admin review.
10. Open Ranger Review, Sensor Rules, Backend Map, and Guide Account Management to show the supporting admin surfaces.
11. Open the Edit Guide Account modal from Guide Account Management only to prove visibility.
12. Open backend health and explain MySQL, MQTT, evidence routes, device-token security, and role checks.

## 6. Backup Plans

If camera fails:

- Use existing curated evidence from Admin Incidents.
- Say: "The live camera path is environment-dependent. The prototype stores and serves AI evidence through the backend evidence route when camera capture is available."

If MQTT fails:

- Use `npm run publish:test-iot` from `user_login/server`.
- If the public broker is down, explain that HiveMQ is a public demo broker and show the local incident API health/summary instead.

If MySQL fails:

- Stop before claiming live persistence.
- Restart MySQL and rerun backend health.
- If it cannot be restored, say: "The prototype has a memory fallback for development, but the submitted Sprint #2 persistence claim requires MySQL. This machine is currently not in the correct persistence state."

If evidence images do not load:

- Open backend health to confirm `/evidence/ai` and `/evidence/iot`.
- Use a concrete evidence filename, not only the route root.
- Explain that route roots redirect to trailing-slash static routes.

## 7. Prototype Limitations To Say

- This is a Sprint #2 prototype-level AI/IoT incident workflow.
- AI classification is a demo model and still needs larger dataset retraining.
- Public MQTT is used for demonstration; production should use private authenticated TLS MQTT.
- Device-token security and role checks are implemented for demo validation, but production auth/session hardening remains future work.
- Park Ranger recommendations support field review, but Admin remains accountable for final official incident status.
- Existing runtime data may contain older raw model keys, but user-facing labels should say `Plucking Plants` or `plucking/damaging protected plants`.

## 8. Required Final Checks

```bash
cd /Users/chiayuenkai/Desktop/GitHub/my-react-app
git diff --check
node --check scripts/dev-all.mjs
node --check scripts/hub-server.mjs
node --check user_login/server/index.js
git status --short --branch
```
