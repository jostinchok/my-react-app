/*
  Admin portal — database alignment
  ====================================

  Canonical schema (fresh install + full seed):  ../../database/db.sql

  That file defines everything the admin backend (adminServer.js) expects:

  • Table `parks` + seed rows
  • `users.park_id` → FK `parks(park_id)`
  • `guide_profiles.user_id` (same as guide_id for new guides) → FK `users(user_id)`
  • `training_modules.course_id` → FK `courses` (+ module `status`, `sort_order`)
  • `training_modules.criteria`, `training_modules.park_id` → FK `parks`
  • `lessons.lesson_type`, `lessons.sort_order`, `quizzes.sort_order`, `questions.sort_order`, `options.sort_order`
  • `incidents.park_id` → FK `parks`
  • `progress.progress_percent`
  • `certifications.certificate_code` + UNIQUE(`user_id`,`module_id`) for badge issue upserts
  • `user_avatars` (`user_id`, `stored_name`) for JOINs in Admin API responses

  For an existing MySQL database missing these pieces, `admin_server` runs `ensureAdminSchema()` on
  startup (`admin_page/adminServer.js`) and applies the same columns/constraints safely (skips what
  already exists). Recreating from `database/db.sql` is still the cleanest full reset.

  Deprecated: runnable ALTER snippets were replaced by startup migration + canonical db.sql above.
*/
