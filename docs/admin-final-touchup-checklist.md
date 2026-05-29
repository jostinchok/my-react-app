# Admin Final Touch-Up Checklist

## Scope

This pass polishes the Admin portal for the COS30049 CTIP final presentation, final report evidence, and local submission readiness. It keeps the existing local prototype architecture intact and does not change cloud deployment, AI model training, mobile behavior, or database schema.

## What Was Polished

- Admin command center dashboard with final presentation metrics for training courses, active park guides, open incidents, pending course requests, certificates, and system health.
- Professional Admin navigation labels for the final demo flow.
- Incident Detection page with clearer AI Camera and IoT Sensor wording, evidence preview, official status controls, and ranger recommendation separation.
- Ranger Review workflow showing the recommendation queue, notes, current official status, and Admin decision needed.
- Course and Training Module pages with clearer Canvas-style course, module, and item structure.
- Course Requests, Guides, and Certificates pages with consistent Citrus Energetic theme styling, readable fields, chips, empty states, and fallback demo data.
- Backend Map and Audit Log remain available as intentional technical evidence pages.

## Admin Demo Route List

- `http://localhost:5174/admin`
- `http://localhost:5174/admin/course`
- `http://localhost:5174/admin/training`
- `http://localhost:5174/admin/course-requests`
- `http://localhost:5174/admin/students`
- `http://localhost:5174/admin/certificates`
- `http://localhost:5174/admin/detection`
- `http://localhost:5174/admin/ranger-review`
- `http://localhost:5174/admin/backend-map`
- `http://localhost:5174/admin/audit-log`
- `http://localhost:4000/api/health`
- `http://localhost:4000/api/incidents`

## Presentation Flow

1. Start at the Admin command center and introduce the training, guide, incident, certificate, and system health summary.
2. Open Courses to show the three final demo courses:
   - SFC Field Response Essentials
   - Sarawak Protected Wildlife Awareness
   - SFC Park Guide Orientation
3. Open Training Modules to show Canvas-style modules and item types.
4. Open Course Requests to show guide enrollment approval workflow.
5. Open Guides to show course assignment, completion percentage, quiz attempts, and certificate readiness.
6. Open Certificates to show certificate status and preview actions.
7. Open Incident Detection to show AI Camera and IoT Sensor evidence, official status, and Admin action.
8. Open Ranger Review to explain that Park Rangers recommend outcomes while Admin remains responsible for official status updates.
9. Open Backend Map and Audit Log as technical architecture and traceability evidence.
10. Show API health and incidents evidence screenshots as backup proof for the final report.

## Screenshot Checklist

Evidence folder: `docs/demo-evidence/admin-final-touchup/`

- Captured: `01-admin-dashboard.png`
- Captured: `02-admin-course-management.png`
- Captured: `03-admin-training-modules.png`
- Captured: `04-admin-course-requests.png`
- Captured: `05-admin-guides-progress.png`
- Captured: `06-admin-certificates.png`
- Captured: `07-admin-incident-detection-overview.png`
- Captured: `08-admin-incident-detail-evidence.png`
- Captured: `09-ranger-review-recommendation-boundary.png`
- Captured: `10-admin-backend-map.png`
- Captured: `11-admin-audit-log.png`
- Captured: `12-api-health.png`
- Captured: `13-api-incidents.png`
- Captured: `14-security-smoke-output.png`

Screenshots are normal viewport captures, not long scrolling screenshots. Admin UI screenshots were captured in a 16:9 presentation viewport. API and smoke-test screenshots were rendered from local command/API output because the browser automation policy blocked direct screenshot capture of raw API and `data:` URLs.

## Commands Run

```bash
git status
git branch --show-current
git checkout -b admin-final-touchup
npm --prefix admin_page run build
node --check scripts/dev-all.mjs
node --check scripts/hub-server.mjs
node --check user_login/server/index.js
git diff --check
npm run dev
```

## Check Results

- Admin build: passed.
- `scripts/dev-all.mjs` syntax check: passed.
- `scripts/hub-server.mjs` syntax check: passed.
- `user_login/server/index.js` syntax check: passed.
- Whitespace check: passed.
- Local API health evidence: captured.
- Local incidents API evidence: captured with authenticated local Admin API output.

The Admin build still reports Vite's existing large chunk warning. This is a bundle-size warning, not a build failure.

## Known Limitations

- The final prototype is designed for a stable local demo environment using local MySQL, local API services, and repo-served evidence folders.
- Live Admin pages fall back to safe demo data if local APIs are unavailable, so screenshots remain presentation-ready instead of showing raw errors.
- API evidence screenshots require the local backend to be running and using a valid local demo token or authenticated local session.
- Mobile and AI model training were intentionally left untouched for this final Admin polish pass.

## Cloud Deployment Note

Cloud deployment is not required for the final prototype demonstration. The recommended approach is a stable local demo with screenshots and screen recording backup. Full cloud deployment is deferred because the system depends on local MySQL, camera access, AI model files, MQTT behavior, and local evidence folders.
