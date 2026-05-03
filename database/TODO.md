# Database TODO

`db.sql` now includes the tables, columns, and starter seed rows required by the user page.

Added outside this SQL file:

- `user_page/server/index.js` connects the user page to MySQL with:
  - `GET /api/training-modules`
  - `GET /api/user-profile`
  - `PATCH /api/user-profile`
  - `POST /api/user-profile/avatar`
  - `GET /api/certifications`
  - `GET /api/notifications`
  - `GET /api/schedule`
  - `POST /api/schedule`
  - `PATCH /api/schedule/:scheduleId`
  - `DELETE /api/schedule/:scheduleId`

- Uploaded profile photos are saved under `user_page/public/uploads/avatars`.
- The saved URL is written to `guide_profiles.avatar_url`.

Still to decide:

- Whether `progress.completed_lessons` stores:
  - JSON text such as `[0,1,2]`, or
  - a comma-separated string such as `0,1,2`.

- Whether module enrollments, lesson completion, and quiz attempts should also be saved from the user page into `progress`.
