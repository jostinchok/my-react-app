# Final Demo Readiness TODO

Working folder:

```text
/Users/chiayuenkai/Desktop/GitHub/my-react-app
```

Scope lock:

- Final presentation and real-time demo readiness only.
- No new features.
- No system redesign.
- Admin/backend/AI-IoT stabilization only.
- `user_page` UI/UX is owned by another teammate and must not be modified unless the user explicitly identifies a final-demo blocker on that surface.
- Do not commit local datasets, model artifacts, `.env` secrets, runtime database files, generated incident files, or `user_login/server/data/`.
- Do not run package upgrades or `npm audit fix` unless a real demo-blocking issue appears.

## Final Demo Tasks

- [x] Keep current Admin UI polish work on `final-admin-ui-polish` per the user's latest instruction; do not switch branches unless explicitly asked.
- [ ] Confirm `git status --short --branch` shows only intentional doc/admin/backend changes and does not include runtime files.
- [ ] Confirm MySQL is running before demo startup.
- [ ] Confirm `http://localhost:4000/api/health` reports MySQL incident persistence, `fallback=none`, MQTT enabled/connected, device-token auth enabled, and role checks enabled.
- [ ] Confirm `http://localhost:4002/api/health` reports the Admin API connected to MySQL.
- [x] Confirm Login UI demo accounts authenticate through the backend: Admin Demo, User 1-3, and Ranger 1-3.
- [x] Fix demo account switching lockout by raising the source auth limiter default and keeping CORS before auth rate limiting.
- [x] Make User Portal Item Detail open directly to learning items for the final demo path.
- [x] Confirm `http://localhost:5174/admin` loads before presenting.
- [x] Confirm Admin Dashboard, Incidents, Ranger Review, Sensor Rules, Backend Map, Guide Account Management, Course Requests, Certificates, Permissions, Inbox, and Help Desk are reachable in the Admin UI polish evidence pass.
- [x] Confirm AI/IoT Incident Operations loads without crashing.
- [x] Confirm Admin can save official incident status updates.
- [x] Confirm Park Ranger can submit recommendations with field notes.
- [x] Confirm Park Ranger cannot officially resolve or close incidents through the status endpoint.
- [ ] Confirm `/evidence/ai` and `/evidence/iot` routes are available and use concrete filenames for image previews.
- [x] Confirm final plant incident labels say `Plucking Plants` or `plucking/damaging protected plants` in user-facing admin/demo text.
- [ ] Keep old plant-class names only as internal model compatibility aliases, local dataset paths, notebook history, or existing runtime data.
- [x] Run `git diff --check`.
- [x] Run `node --check scripts/dev-all.mjs`.
- [x] Run `node --check scripts/hub-server.mjs`.
- [x] Run `node --check user_login/server/index.js`.
- [x] Run `npm --prefix admin_page run build`.
- [x] Run `npm --prefix user_page run build`.
- [x] Run `cd login && npm exec vite build`.

## Presentation Guardrails

- Do not restore stashed User Portal or training notebook changes.
- Do not change `user_page` UI/UX.
- Do not add training, auth, mobile, or User Portal features.
- Do not alter Sprint #2 scope claims.
- Do not rewrite MySQL runtime incident rows just to clean labels.
- Do not rename dataset folders, model artifact names, or script paths during final demo prep.

## Remaining Risks To Recheck

- MySQL service may be stopped or pointed at the wrong database.
- Public MQTT may be unavailable or delayed.
- Camera permissions may fail during the live AI demo.
- Device-token values must match `.env` before running live AI/IoT ingestion.
- Runtime evidence folders are local and should remain untracked.
