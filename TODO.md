# TODO

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
- Keep frontend seeded data only for now.
- Do not connect Express/MySQL yet.

## Bugs To Fix

- Visual browser review is still needed after the image path helper fix.
- Working tree currently shows generated/install artifact noise under `user_page/dist`, `user_page/node_modules`, and `user_login/server/node_modules`.
- `user_page` build can fail after dependency churn if Rollup optional native packages are missing.
- Backend `/api/health` returns database failure until MySQL is running and seeded.
- Root review hub service checks can show backend offline when MySQL is unavailable even though Express itself starts.

## Improvements To Consider

- Add proper `.gitignore` rules for generated build/dependency folders after confirming whether this assignment repo expects them tracked.
- Replace alert-based UI feedback with polished toast messages.
- Add loading/empty/error states for future API-backed sections.
- Redesign admin and mobile to match the citrus energetic website theme after the user website is stable.
- Add backend endpoints for training modules, quiz progress, notifications, certificates, and file metadata later.
- Add a seeded MySQL setup guide and one command/script for local database import later.
- Add lightweight tests or smoke checks for website build and review launcher.

## Items That Should Not Be Changed Yet

- Do not add optional VR/AR until required Part 1, security, and monitoring requirements are stable.
- Do not physically merge `user_page`, `mobile_app`, `admin_page`, and `user_login/server` into one source app.
- Do not replace the current website GUI with a completely unrelated template.
- Do not remove existing admin/mobile/backend folders.
- Do not delete assignment artifacts such as `Project Scope.pdf`, `Alerts/`, `models/`, or the CTIP notebook unless explicitly requested.
- Do not connect Express/MySQL yet.
- Do not commit `.DS_Store`, local `node_modules`, or generated `dist` output unless the user explicitly decides the repo must track them.
