# COS30049 SFC Demo Stabilization Skill

Use this guide when stabilizing this repo for final presentation readiness.

## Safe Workflow

1. Run `git status --short --branch`.
2. Confirm the branch is `shared-default-style-v12`.
3. Read `PROJECT_NOTES.md`, `TODO.md`, `DEMO_CHECKLIST.md`, and `AGENTS.md`.
4. Do not touch `user_page` UI/UX.
5. Confirm MySQL is running.
6. Start the demo stack with `npm run dev`, or verify the already-running services.
7. Check main backend health at `http://localhost:4000/api/health`.
8. Check Admin API health at `http://localhost:4002/api/health`.
9. Check Login UI at `http://localhost:5176/login/` and verify the Admin Demo, User 1-3, and Ranger 1-3 demo accounts.
10. Check Admin dashboard at `http://localhost:5174/admin`.
11. Check AI/IoT incidents at `http://localhost:5174/admin/detection`.
12. Check Park Ranger recommendations at `http://localhost:5174/admin/ranger`.
13. Verify Admin can perform official incident status updates.
14. Verify Park Ranger can submit recommendations only and cannot officially resolve or close incidents.
15. Run syntax checks:

```bash
git diff --check
node --check scripts/dev-all.mjs
node --check scripts/hub-server.mjs
node --check user_login/server/index.js
```

## Scope Guard

- Stabilize admin/backend/AI-IoT demo-blocking issues only.
- Do not add features.
- Do not redesign UI.
- Do not commit local datasets, model artifacts, `.env`, generated incident files, runtime database files, or `user_login/server/data/`.
- Keep user-facing plant incident wording as `Plucking Plants` or `plucking/damaging protected plants`.
- Keep legacy model class aliases and dataset paths only where needed for compatibility.
