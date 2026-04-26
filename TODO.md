# TODO

## Immediate Next Tasks

- Clean GitHub Desktop commit selection before committing:
  - Commit source/docs/assets that represent intentional work.
  - Do not commit `node_modules` or generated `dist` output unless intentionally required.
- Decide whether `Project Scope.pdf` should be committed as the assignment reference.
- Connect website training data in `user_page/src/data/trainingPlatform.js` to the Express/MySQL backend.
- Continue Part 1 implementation after this checkpoint:
  - Admin module setup flow.
  - Admin progress/certification tracking.
  - Guide notifications from admin.
  - Mobile app parity with the redesigned website.

## Bugs To Fix

- Backend `/api/health` returns database failure until MySQL is running and seeded.
- `user_page` build can fail after dependency churn if Rollup optional native packages are missing.
- Working tree currently shows generated/install artifact noise under `user_page/dist`, `user_page/node_modules`, and `user_login/server/node_modules`.
- Root review hub service checks can show backend offline when MySQL is unavailable even though Express itself starts.

## Improvements To Consider

- Add proper `.gitignore` rules for generated build/dependency folders after confirming whether this assignment repo expects them tracked.
- Add backend endpoints for training modules, quiz progress, notifications, certificates, and file metadata.
- Replace alert-based UI feedback with polished toast messages.
- Add loading/empty/error states for all API-backed sections.
- Redesign admin and mobile to match the energetic SFC website theme.
- Add a seeded MySQL setup guide and one command/script for local database import.
- Add lightweight tests or smoke checks for website build and review launcher.

## Items That Should Not Be Changed Yet

- Do not add optional VR/AR until required Part 1, security, and monitoring requirements are stable.
- Do not physically merge `user_page`, `mobile_app`, `admin_page`, and `user_login/server` into one source app.
- Do not replace the current website GUI with a completely unrelated template.
- Do not remove existing admin/mobile/backend folders.
- Do not delete assignment artifacts such as `Project Scope.pdf`, `Alerts/`, `models/`, or the CTIP notebook unless explicitly requested.
- Do not commit `.DS_Store`, local `node_modules`, or generated `dist` output unless the user explicitly decides the repo must track them.
