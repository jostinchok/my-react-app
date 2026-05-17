# Admin UI Polish Evidence

## Checkpoint

- Branch: `final-admin-ui-polish`
- Base/local HEAD before this polish diff: `f9951caf1`
- Date/time: `2026-05-14 02:06 +08`
- Scope: final-demo Admin UI/UX polish only.

## Pages Checked

Screenshots were captured locally under `docs/demo-evidence/admin-ui-polish/`:

- `01-admin-dashboard-collapsed.png` - `/admin`, collapsed sidebar
- `02-admin-dashboard-expanded.png` - `/admin`, expanded sidebar
- `03-admin-course.png` - `/admin/course`
- `04-admin-training.png` - `/admin/training`
- `05-admin-students.png` - `/admin/students`
- `06-admin-detection.png` - `/admin/detection`
- `07-admin-ranger-review.png` - `/admin/ranger-review`
- `08-admin-sensor-rules.png` - `/admin/sensor-rules`
- `09-admin-backend-map.png` - `/admin/backend-map`
- `10-admin-analytics.png` - `/admin/analytics`
- `11-admin-users.png` - `/admin/users`
- `12-admin-announcements.png` - `/admin/announcements`
- `13-admin-audit-log.png` - `/admin/audit-log`
- `14-admin-course-requests.png` - `/admin/course-requests`
- `15-admin-certificates.png` - `/admin/certificates`
- `16-admin-permissions.png` - `/admin/permissions`
- `17-admin-inbox.png` - `/admin/inbox`
- `18-admin-help-desk.png` - `/admin/help-desk`

Collapsed and expanded sidebar states were checked on the Admin Dashboard. The expanded sidebar pass confirmed the content is offset from the sidebar with a stable centered layout instead of being squeezed or randomly centered.

## Layout Polish Verified

- Shared Admin content width now centers pages with a predictable max width.
- Dashboard stat cards, workflow shortcuts, section panels, cards, tables, buttons, fields, and modals use a more consistent spacing/radius/border rhythm.
- Table-heavy pages keep readable headers and scroll horizontally only when needed.
- Incident and Ranger pages keep wider working space while still stacking detail panels at narrower projector widths.
- Course builder and Training setup avoid cramped multi-column layouts at sidebar-expanded desktop widths.
- No `Login token is required` toast was detected during screenshot capture.
- Plant incident wording remains visible as `Plucking Plants` in Admin Incident Detection.

## Role Behavior Verified

API role check against the local backend:

- Admin login succeeded with `admin@example.com` / `1234`.
- Ranger login succeeded with `ranger1@demo.local` / `1234`.
- Admin official status PATCH returned HTTP `200` while saving the selected incident's existing status.
- Ranger official status PATCH returned HTTP `403`.
- Ranger recommendation returned HTTP `201`.
- Official incident status remained `New` after the Ranger recommendation.

## Build And Check Results

- `git diff --check` - passed.
- `node --check scripts/dev-all.mjs` - passed.
- `node --check scripts/hub-server.mjs` - passed.
- `node --check user_login/server/index.js` - passed.
- `npm --prefix admin_page run build` - passed with the existing Vite large-chunk warning only.
- `npm --prefix user_page run build` - passed.
- `cd login && npm exec vite build` - passed.

## Remaining Visual Issues

- Very long data-heavy pages create tall full-page screenshots; this is expected for evidence capture and does not affect the visible first viewport.
- Mobile is not the target for this polish pass, but the shared CSS keeps headers/actions stacked instead of overlapping at narrow widths.
- Existing Expo/mobile dependency warnings remain outside this Admin UI scope.

## Files Not To Commit

- Screenshot evidence under `docs/demo-evidence/admin-ui-polish/` is local-only unless explicitly requested.
- `user_login/server/data/`, datasets, model artifacts, `.env`, runtime database files, generated incident files, and alert evidence remain excluded from this pass.
