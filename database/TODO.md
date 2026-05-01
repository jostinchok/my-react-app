# Database TODO

`db.sql` now includes the tables and columns required by the user page.

Still needed outside this SQL file:

- Create or update backend API routes that connect the user page to MySQL:
  - `GET /api/training-modules`
  - `GET /api/user-profile`
  - `PATCH /api/user-profile`
  - `GET /api/certifications`
  - `GET /api/notifications`
  - `GET /api/schedule`
  - `POST /api/schedule`

- Store uploaded profile photos:
  - `guide_profiles.avatar_url` is now available.
  - The backend still needs to accept an upload, save the file, and write the URL.

- Decide whether `progress.completed_lessons` stores:
  - JSON text such as `[0,1,2]`, or
  - a comma-separated string such as `0,1,2`.

- Optional seed data:
  - Add real `training_modules`, `lessons`, `quizzes`, `questions`, `options`, `notifications`, and `schedule` rows for testing.
