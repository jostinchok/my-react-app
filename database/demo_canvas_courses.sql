-- COS30049 CTIP V18 complete Canvas-style demo course records
-- This file replaces the earlier lightweight demo data with more realistic course records.
-- Run from project root:
--   mysql -u root -p park_guide_database < database/demo_canvas_courses.sql

CREATE DATABASE IF NOT EXISTS park_guide_database;
USE park_guide_database;

-- Schema prerequisites for direct phpMyAdmin imports.
-- The Canvas demo data depends on the training-platform migrations; keep the
-- required tables/columns here so this file can be imported on its own after
-- selecting the project database in phpMyAdmin.
DROP PROCEDURE IF EXISTS add_column_if_missing;

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NULL,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE IF NOT EXISTS training_modules (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    park VARCHAR(100),
    level VARCHAR(50),
    duration VARCHAR(50),
    format VARCHAR(50),
    image_url VARCHAR(255),
    accent_color VARCHAR(20),
    badge_name VARCHAR(100),
    objectives TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255),
    content TEXT,
    media_url VARCHAR(255),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_id INT,
    completed_lessons TEXT,
    quiz_passed BOOLEAN DEFAULT FALSE,
    quiz_score INT DEFAULT 0,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completion_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS certifications (
    cert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_id INT,
    title VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Pending',
    issue_date DATETIME,
    expiry_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS courses (
    course_id VARCHAR(50) PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_contact_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS course_id VARCHAR(50) NULL;
ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Published';
ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS criteria TEXT NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'Text';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS progress_percent INT DEFAULT 0;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS certificate_code VARCHAR(120) NULL;

CREATE TABLE IF NOT EXISTS course_resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) DEFAULT 'application/octet-stream',
    size_bytes BIGINT UNSIGNED DEFAULT 0,
    file_url VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    INDEX idx_course_resources_course_uploaded (course_id, uploaded_at)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at DATETIME NULL,
    decision_note TEXT NULL,
    UNIQUE KEY uniq_course_enrollment (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_module_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  item_type ENUM('page','text','file','image','video','link','quiz','checklist') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  content LONGTEXT NULL,
  external_url VARCHAR(1000) NULL,
  file_name VARCHAR(255) NULL,
  stored_name VARCHAR(255) NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT DEFAULT 0,
  file_url VARCHAR(1000) NULL,
  quiz_json JSON NULL,
  checklist_json JSON NULL,
  status ENUM('published','draft') DEFAULT 'published',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_module_items_module_sort (module_id, sort_order, item_id),
  INDEX idx_module_items_course (course_id),
  CONSTRAINT fk_course_module_items_module_id
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS canvas_item_progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  module_id INT NOT NULL,
  item_id INT NOT NULL,
  item_type ENUM('page','text','file','image','video','link','quiz','checklist') NOT NULL,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  completed_at DATETIME NULL,
  last_viewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_canvas_progress_user_course_module_item (user_id, course_id, module_id, item_id),
  INDEX idx_canvas_progress_user_module (user_id, module_id),
  INDEX idx_canvas_progress_item (item_id),
  CONSTRAINT fk_canvas_progress_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_canvas_progress_module
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_canvas_progress_item
    FOREIGN KEY (item_id) REFERENCES course_module_items(item_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS canvas_quiz_attempts (
  attempt_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  module_id INT NOT NULL,
  item_id INT NOT NULL,
  selected_answer TEXT NULL,
  correct_answer TEXT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  score_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_canvas_quiz_user_item_attempted (user_id, item_id, attempted_at),
  INDEX idx_canvas_quiz_user_module (user_id, module_id),
  CONSTRAINT fk_canvas_quiz_attempt_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_canvas_quiz_attempt_module
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_canvas_quiz_attempt_item
    FOREIGN KEY (item_id) REFERENCES course_module_items(item_id)
    ON DELETE CASCADE
);

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM canvas_quiz_attempts
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM canvas_item_progress
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM course_module_items
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM lessons
WHERE module_id IN (
  SELECT module_id FROM training_modules
  WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
);

DELETE FROM progress
WHERE module_id IN (
  SELECT module_id FROM training_modules
  WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
);

DELETE FROM certifications
WHERE module_id IN (
  SELECT module_id FROM training_modules
  WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
);

DELETE FROM course_enrollments
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM course_resources
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM training_modules
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

DELETE FROM courses
WHERE course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026');

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO courses (course_id, course_name, description, start_date, end_date, total_contact_hours)
VALUES
  ('SFC-FIELD-2026', 'SFC Field Response Essentials', 'Complete response training for AI camera alerts, IoT proximity clusters, field verification, Ranger recommendations, Admin decisions, and audit-ready handover.', '2026-05-01', '2026-06-30', 18),
  ('SFC-WILDLIFE-2026', 'Sarawak Protected Wildlife Awareness', 'Complete wildlife awareness course covering protected species, visitor interaction risk, no-feeding policy, evidence capture, escalation, and scenario-based readiness.', '2026-05-01', '2026-07-10', 16),
  ('SFC-GUIDE-2026', 'SFC Park Guide Orientation', 'Complete onboarding course for Park Guides covering the digital portal, course navigation, visitor briefings, trail safety, evidence completion, help requests, and certificate readiness.', '2026-05-01', '2026-07-31', 14);

INSERT INTO course_resources (course_id, title, file_name, stored_name, mime_type, size_bytes, file_url)
VALUES
  ('SFC-FIELD-2026', 'Field response quick checklist', 'sfc-field-response-checklist.txt', 'sfc-field-response-checklist.txt', 'text/plain', 4200, '/uploads/course-resources/sfc-field-response-checklist.txt'),
  ('SFC-FIELD-2026', 'Incident evidence handover template', 'sfc-incident-evidence-handover.txt', 'sfc-incident-evidence-handover.txt', 'text/plain', 3900, '/uploads/course-resources/sfc-incident-evidence-handover.txt'),
  ('SFC-WILDLIFE-2026', 'Wildlife interaction briefing card', 'sfc-wildlife-briefing-card.txt', 'sfc-wildlife-briefing-card.txt', 'text/plain', 3600, '/uploads/course-resources/sfc-wildlife-briefing-card.txt'),
  ('SFC-WILDLIFE-2026', 'Wildlife escalation quick guide', 'sfc-wildlife-escalation-guide.txt', 'sfc-wildlife-escalation-guide.txt', 'text/plain', 4100, '/uploads/course-resources/sfc-wildlife-escalation-guide.txt'),
  ('SFC-GUIDE-2026', 'Park guide onboarding checklist', 'sfc-guide-onboarding-checklist.txt', 'sfc-guide-onboarding-checklist.txt', 'text/plain', 3500, '/uploads/course-resources/sfc-guide-onboarding-checklist.txt'),
  ('SFC-GUIDE-2026', 'Visitor briefing template', 'sfc-visitor-briefing-template.txt', 'sfc-visitor-briefing-template.txt', 'text/plain', 3200, '/uploads/course-resources/sfc-visitor-briefing-template.txt');

-- SFC Field Response Essentials

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-FIELD-2026', 'Incident Command and Evidence Intake', 'Learn how AI camera alerts and IoT proximity triggers enter the incident workflow, how evidence should be read, and why weak evidence must be reviewed before action.', 'Incident Evidence', 'Bako National Park', 'Intermediate', '1 hour 20 minutes', 'Blended', '', '#ff7a1a', 'Incident Intake Ready', '["Read AI and IoT incident evidence", "Separate raw trigger noise from real incident records", "Check timestamp, location, source, confidence, and image clarity", "Prepare a short evidence intake note"]', 'Published', 1, 'Complete all required module items and pass the scenario check.');

SET @m_field_intake = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_field_intake, 'Module overview', 'Learn how AI camera alerts and IoT proximity triggers enter the incident workflow, how evidence should be read, and why weak evidence must be reviewed before action.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'page', 'How the incident queue works', 'Incident intake explanation', 'The incident queue combines AI camera alerts and IoT proximity triggers into reviewable cases. AI records normally include an event label, confidence value, evidence image, timestamp, and location. IoT records may arrive as repeated proximity readings, so they should be grouped by zone and time window before Admin review. Do not treat every raw trigger as a separate incident.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'text', 'Evidence intake note template', 'Copy-ready note pattern', 'Incident ID:
Source: AI Camera or IoT Sensor
Location:
Timestamp:
Evidence quality: clear, partial, or unclear
Immediate risk: low, medium, or high
Recommended next step: monitor, ranger review, escalate, or admin decision', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'image', 'Example AI camera evidence frame', 'Visual review reference', 'Use the image frame to discuss event type, timestamp, confidence, and whether the behavior is visible enough for action.', 'http://localhost:5175/user/training/incident-ai-monitoring.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'video', 'Incident intake walkthrough', 'Short video placeholder', 'Use this walkthrough as the briefing reference for how evidence moves from detection to admin review.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'link', 'SFC official operational reference', 'External reference', 'Open the official organization reference when explaining the real-world conservation context.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'file', 'Incident intake worksheet', 'Downloadable worksheet placeholder', 'Use this worksheet to record source, location, confidence, evidence hash, and recommended next step.', 'https://sarawakforestry.com/', 'incident-intake-worksheet.txt', 'incident-intake-worksheet.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 6);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'checklist', 'Evidence intake checklist', 'Minimum checks before review', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Incident source is identified", "Location and timestamp are present", "Evidence image or sensor count is attached", "Severity is not guessed without evidence", "Recommendation is written for Admin, not as a final decision"]', 'published', 7);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_intake, 'SFC-FIELD-2026', 'quiz', 'Incident intake role check', 'One-question role quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "Which role should make the official final incident status decision?", "choices": ["Park Guide", "Park Ranger", "Admin", "Visitor"], "answer": 2}', NULL, 'published', 8);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-FIELD-2026', 'AI Camera Review and Plucking Plants Detection', 'Review AI camera evidence for possible plant plucking, wildlife handling, false alarms, and confidence-based escalation.', 'AI Camera Evidence', 'Demo Camera Zone', 'Intermediate', '1 hour 10 minutes', 'Blended', '', '#ff7a1a', 'AI Evidence Reviewer', '["Recognize possible plant plucking evidence", "Read predicted class, confidence, margin, and bounding-box metadata", "Avoid changing user-facing wording back to Touching Plants", "Record false alarm notes clearly"]', 'Published', 2, 'Complete all required module items and pass the scenario check.');

SET @m_field_ai = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_field_ai, 'Module overview', 'Review AI camera evidence for possible plant plucking, wildlife handling, false alarms, and confidence-based escalation.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ai, 'SFC-FIELD-2026', 'page', 'Plucking Plants evidence standard', 'Evidence standard', 'User-facing incident wording should say Plucking Plants when the case involves possible protected flora handling. Internal model aliases may still keep older labels for compatibility, but reports and screens should use clear conservation wording.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ai, 'SFC-FIELD-2026', 'text', 'AI confidence interpretation guide', 'Short confidence guide', 'High confidence means the frame strongly matches the model class. Medium confidence needs human review. Low confidence should normally remain monitored or false-alarm candidate unless supported by repeated evidence.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ai, 'SFC-FIELD-2026', 'image', 'Bounding-box review example', 'Visual metadata reference', 'Use this training image to explain why the model prediction still needs human review.', 'http://localhost:5175/user/training/plucking-plants-evidence.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ai, 'SFC-FIELD-2026', 'link', 'AI evidence review reference', 'External reference', 'Use this as a placeholder for the project''s AI training notebook or evidence review reference.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ai, 'SFC-FIELD-2026', 'checklist', 'AI evidence quality checklist', 'Quality checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Predicted class is shown", "Confidence value is recorded", "Image clearly shows the relevant interaction", "Location matches a protected area", "False alarm risk is considered"]', 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ai, 'SFC-FIELD-2026', 'quiz', 'AI evidence decision check', 'Scenario quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "An image is unclear but confidence is high. What should the reviewer do?", "choices": ["Resolve immediately", "Delete the incident", "Send for human review with a note", "Ignore the case"], "answer": 2}', NULL, 'published', 6);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ai, 'SFC-FIELD-2026', 'file', 'AI review worksheet', 'Worksheet placeholder', 'Use this file item to document frame number, predicted class, confidence, and review note.', 'https://sarawakforestry.com/', 'ai-review-worksheet.txt', 'ai-review-worksheet.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 7);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-FIELD-2026', 'IoT Proximity Sensor Triage and Alert Grouping', 'Handle repeated sensor readings without flooding the incident page, using grouping rules, thresholds, cooldowns, and zone-based triage.', 'IoT Sensor Evidence', 'Plant Zone A', 'Intermediate', '1 hour', 'Blended', '', '#ff7a1a', 'IoT Triage Ready', '["Understand raw trigger flooding", "Apply grouping by zone and time window", "Use cooldowns to reduce duplicate rows", "Escalate only meaningful proximity clusters"]', 'Published', 3, 'Complete all required module items and pass the scenario check.');

SET @m_field_iot = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_field_iot, 'Module overview', 'Handle repeated sensor readings without flooding the incident page, using grouping rules, thresholds, cooldowns, and zone-based triage.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_iot, 'SFC-FIELD-2026', 'page', 'Why raw IoT triggers must be grouped', 'Noise-control explanation', 'A forest deployment may contain many sensors. If each proximity reading becomes an incident, Admin will face alert fatigue. The system should group triggers by zone, threshold, and time window. Example: 37 raw triggers in 20 minutes can become one grouped incident with the evidence count retained.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_iot, 'SFC-FIELD-2026', 'text', 'Grouping rule example', 'Rule example', 'Plant Zone A proximity grouping: if 5 or more triggers occur within 20 minutes, create one grouped incident. Apply a 15-minute cooldown before opening another incident for the same zone.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_iot, 'SFC-FIELD-2026', 'image', 'Sensor zone example', 'Visual sensor-zone reference', 'Use this visual placeholder to explain how a physical zone maps into a grouped alert.', 'http://localhost:5175/user/training/sensor-zone-map.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_iot, 'SFC-FIELD-2026', 'checklist', 'IoT grouping checklist', 'Grouping checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Sensor zone is known", "Trigger count reaches threshold", "Time window is recorded", "Cooldown is applied", "Grouped incident stores raw evidence count"]', 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_iot, 'SFC-FIELD-2026', 'quiz', 'Sensor grouping check', 'One-question quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "Why should repeated IoT triggers be grouped?", "choices": ["To hide evidence", "To reduce alert noise while keeping evidence count", "To delete sensor data", "To prevent Admin from seeing incidents"], "answer": 1}', NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_iot, 'SFC-FIELD-2026', 'link', 'MQTT sensor integration reference', 'External reference', 'Placeholder link for MQTT and sensor integration explanation.', 'https://mqtt.org/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_iot, 'SFC-FIELD-2026', 'file', 'IoT event summary form', 'File placeholder', 'Use this file item for sensor ID, zone, trigger count, time window, and cooldown note.', 'https://sarawakforestry.com/', 'iot-event-summary-form.txt', 'iot-event-summary-form.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 7);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-FIELD-2026', 'Ranger Field Recommendation Workflow', 'Train Rangers to inspect evidence and recommend outcomes without bypassing Admin control.', 'Ranger Workflow', 'All Parks', 'Intermediate', '55 minutes', 'Blended', '', '#ff7a1a', 'Recommendation Ready', '["Understand recommendation-only responsibility", "Write neutral field notes", "Escalate high-risk cases", "Avoid final status changes as a Ranger"]', 'Published', 4, 'Complete all required module items and pass the scenario check.');

SET @m_field_ranger = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_field_ranger, 'Module overview', 'Train Rangers to inspect evidence and recommend outcomes without bypassing Admin control.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ranger, 'SFC-FIELD-2026', 'page', 'Ranger boundary and accountability', 'Role boundary', 'Park Rangers can inspect evidence, add field notes, and recommend outcomes. They should not directly resolve, delete, or officially close incidents. This protects accountability and keeps the Admin decision trail clean.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ranger, 'SFC-FIELD-2026', 'text', 'Recommended field note wording', 'Copy-ready note', 'Observed visitor near protected flora. Evidence is clear enough for Admin review. Recommend marking the case Under Review until field patrol confirms the location.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ranger, 'SFC-FIELD-2026', 'checklist', 'Ranger note checklist', 'Field note checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Describe what was observed", "Mention confidence or uncertainty", "Mention field confirmation if any", "Recommend a next step", "Do not write the note as final judgment"]', 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ranger, 'SFC-FIELD-2026', 'quiz', 'Ranger action check', 'Role boundary quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "A Ranger thinks an incident is resolved. What should they do?", "choices": ["Change status to Resolved", "Delete the case", "Recommend Resolve with field notes", "Ignore the case"], "answer": 2}', NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ranger, 'SFC-FIELD-2026', 'link', 'Ranger workflow reference', 'External reference', 'Placeholder reference for team SOP documentation.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_ranger, 'SFC-FIELD-2026', 'file', 'Ranger field note template', 'File placeholder', 'Use this file item for a structured Ranger recommendation template.', 'https://sarawakforestry.com/', 'ranger-field-note-template.txt', 'ranger-field-note-template.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 6);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-FIELD-2026', 'Admin Decision, Audit Trail, and Handover', 'Show how Admin makes final decisions, records audit events, and prepares handover evidence for reporting.', 'Admin Decision', 'All Parks', 'Intermediate', '1 hour', 'Blended', '', '#ff7a1a', 'Audit Ready', '["Apply final status decisions", "Record admin notes", "Understand audit log importance", "Prepare handover summary"]', 'Published', 5, 'Complete all required module items and pass the scenario check.');

SET @m_field_admin = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_field_admin, 'Module overview', 'Show how Admin makes final decisions, records audit events, and prepares handover evidence for reporting.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_admin, 'SFC-FIELD-2026', 'page', 'Admin final decision flow', 'Final decision guide', 'Admin reviews evidence, Ranger notes, severity, and history before setting official status. Decisions should be written with enough detail for later audit, especially for resolved, false alarm, and escalated cases.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_admin, 'SFC-FIELD-2026', 'text', 'Admin decision note template', 'Decision note pattern', 'Decision:
Reason:
Evidence reviewed:
Ranger recommendation:
Follow-up required:
Audit sensitivity: low, medium, or high', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_admin, 'SFC-FIELD-2026', 'checklist', 'Audit-ready decision checklist', 'Decision checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Evidence has been reviewed", "Ranger note is considered", "Decision reason is written", "Status change is logged", "Handover summary is ready"]', 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_admin, 'SFC-FIELD-2026', 'quiz', 'Audit trail check', 'Audit quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "Why should incident decisions be recorded in the audit log?", "choices": ["To make the UI longer", "To provide accountability and traceability", "To replace evidence images", "To avoid Admin review"], "answer": 1}', NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_admin, 'SFC-FIELD-2026', 'file', 'Incident handover report template', 'File placeholder', 'Use this file item as the final incident handover report template.', 'https://sarawakforestry.com/', 'incident-handover-report-template.txt', 'incident-handover-report-template.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_field_admin, 'SFC-FIELD-2026', 'link', 'Audit and compliance reference', 'External reference', 'Placeholder for future cybersecurity and audit documentation.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

-- Sarawak Protected Wildlife Awareness

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-WILDLIFE-2026', 'Protected Wildlife Basics in Sarawak Parks', 'Introduce common protected wildlife, visitor behavior risks, and the reason wildlife contact must be prevented.', 'Wildlife Awareness', 'All Parks', 'Beginner', '1 hour', 'Blended', '', '#ff7a1a', 'Wildlife Awareness', '["Recognize common wildlife interaction risks", "Explain why feeding and touching wildlife is harmful", "Identify when observation becomes an incident"]', 'Published', 1, 'Complete all required module items and pass the scenario check.');

SET @m_wild_basics = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_wild_basics, 'Module overview', 'Introduce common protected wildlife, visitor behavior risks, and the reason wildlife contact must be prevented.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_basics, 'SFC-WILDLIFE-2026', 'page', 'Why wildlife contact is dangerous', 'Conservation and safety explanation', 'Touching, feeding, chasing, or cornering wildlife can harm animals and put visitors at risk. Staff should encourage observation from a safe distance and record evidence when risky behavior occurs.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_basics, 'SFC-WILDLIFE-2026', 'text', 'Safe-distance visitor script', 'Visitor briefing script', 'Please keep a safe distance and do not feed or touch wildlife. This protects you, other visitors, and the animals. Let wildlife move away naturally.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_basics, 'SFC-WILDLIFE-2026', 'image', 'Protected wildlife awareness card', 'Visual briefing reference', 'Use this visual as a simple reminder that wildlife must be observed, not handled.', 'http://localhost:5175/user/training/biodiversity-basics.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_basics, 'SFC-WILDLIFE-2026', 'video', 'Wildlife awareness briefing', 'Video placeholder', 'Use this video item as a placeholder for a recorded wildlife briefing.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_basics, 'SFC-WILDLIFE-2026', 'checklist', 'Wildlife observation checklist', 'Observation checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Keep visitor distance safe", "Do not allow feeding", "Do not allow touching", "Record location if behavior continues", "Escalate high-risk behavior"]', 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_basics, 'SFC-WILDLIFE-2026', 'quiz', 'Wildlife safety check', 'Basic quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "What should visitors do when they see wildlife?", "choices": ["Feed it", "Touch it gently", "Observe from a safe distance", "Chase it away"], "answer": 2}', NULL, 'published', 6);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_basics, 'SFC-WILDLIFE-2026', 'link', 'SFC wildlife reference', 'External reference', 'Official conservation reference placeholder.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 7);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-WILDLIFE-2026', 'Visitor Wildlife Interaction Risks', 'Recognize behaviors that increase risk, such as feeding, crowding, flash photography, and attempting selfies near wildlife.', 'Visitor Risk', 'Wildlife Zones', 'Beginner', '55 minutes', 'Blended', '', '#ff7a1a', 'Visitor Risk Ready', '["Identify risky visitor behavior", "Explain safety reasons clearly", "Separate minor reminders from reportable incidents"]', 'Published', 2, 'Complete all required module items and pass the scenario check.');

SET @m_wild_risk = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_wild_risk, 'Module overview', 'Recognize behaviors that increase risk, such as feeding, crowding, flash photography, and attempting selfies near wildlife.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_risk, 'SFC-WILDLIFE-2026', 'page', 'Risk behavior categories', 'Behavior guide', 'Common risky behaviors include feeding wildlife, blocking animal movement, trying to touch animals, chasing animals for photos, and ignoring guide instructions. Staff should intervene early and calmly.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_risk, 'SFC-WILDLIFE-2026', 'text', 'Visitor intervention wording', 'Script', 'For your safety and the animal''s safety, please step back and do not feed or touch it. We need to keep the trail safe for everyone.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_risk, 'SFC-WILDLIFE-2026', 'image', 'Visitor-wildlife distance example', 'Visual scenario', 'Use this scenario image to discuss when a visitor reminder becomes an incident record.', 'http://localhost:5175/user/training/wildlife-distance.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_risk, 'SFC-WILDLIFE-2026', 'checklist', 'Risk triage checklist', 'Triage checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Behavior is observed clearly", "Visitor was reminded", "Risk level is estimated", "Evidence is available if repeated", "Incident is escalated only when justified"]', 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_risk, 'SFC-WILDLIFE-2026', 'quiz', 'Risk level decision', 'Scenario quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "A visitor stands too close to wildlife after a warning. What is the best next step?", "choices": ["Ignore it", "Record evidence and escalate if repeated", "Encourage a closer photo", "Delete the reminder"], "answer": 1}', NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_risk, 'SFC-WILDLIFE-2026', 'file', 'Wildlife interaction report template', 'File placeholder', 'Use this item as a reporting template for wildlife interaction cases.', 'https://sarawakforestry.com/', 'wildlife-interaction-report-template.txt', 'wildlife-interaction-report-template.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 6);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_risk, 'SFC-WILDLIFE-2026', 'link', 'Visitor safety reference', 'External reference', 'Placeholder for official visitor safety information.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 7);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-WILDLIFE-2026', 'No-touch and No-feeding Enforcement', 'Train staff to explain and enforce the no-touch, no-feeding, and no-disturbance policy consistently.', 'Policy', 'All Parks', 'Beginner', '45 minutes', 'Blended', '', '#ff7a1a', 'Policy Ready', '["Explain no-touch policy", "Handle visitor questions", "Record repeated non-compliance"]', 'Published', 3, 'Complete all required module items and pass the scenario check.');

SET @m_wild_policy = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_wild_policy, 'Module overview', 'Train staff to explain and enforce the no-touch, no-feeding, and no-disturbance policy consistently.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_policy, 'SFC-WILDLIFE-2026', 'page', 'No-touch and no-feeding policy', 'Policy explanation', 'The policy is simple: visitors should not touch, feed, chase, pick, pluck, or disturb protected wildlife and plants. Enforcement should start with clear explanation before escalation.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_policy, 'SFC-WILDLIFE-2026', 'text', 'Common visitor question answers', 'FAQ-style answers', 'Q: Can I feed the animal a little? A: No, feeding changes wildlife behavior and may harm the animal.
Q: Can I touch the plant for a photo? A: No, protected flora should not be touched or plucked.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_policy, 'SFC-WILDLIFE-2026', 'checklist', 'Policy enforcement checklist', 'Enforcement checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Explain the rule politely", "State the conservation reason", "Watch for repeated behavior", "Record evidence when needed", "Escalate persistent refusal"]', 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_policy, 'SFC-WILDLIFE-2026', 'quiz', 'Policy enforcement check', 'Policy quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "Which action should be stopped immediately?", "choices": ["Looking at wildlife", "Taking photos from a safe distance", "Feeding wildlife", "Reading trail signage"], "answer": 2}', NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_policy, 'SFC-WILDLIFE-2026', 'file', 'No-touch briefing card', 'File placeholder', 'Use this item as a printable no-touch briefing card.', 'https://sarawakforestry.com/', 'no-touch-briefing-card.txt', 'no-touch-briefing-card.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_policy, 'SFC-WILDLIFE-2026', 'link', 'Policy reference page', 'External reference', 'Placeholder for policy reference documentation.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-WILDLIFE-2026', 'Wildlife Evidence Capture and Escalation', 'Decide when wildlife evidence should be monitored, sent to Ranger review, escalated, or marked as false alarm.', 'Evidence', 'All Parks', 'Intermediate', '1 hour', 'Blended', '', '#ff7a1a', 'Wildlife Evidence Ready', '["Assess wildlife evidence quality", "Write escalation summaries", "Avoid overstating unclear evidence"]', 'Published', 4, 'Complete all required module items and pass the scenario check.');

SET @m_wild_evidence = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_wild_evidence, 'Module overview', 'Decide when wildlife evidence should be monitored, sent to Ranger review, escalated, or marked as false alarm.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_evidence, 'SFC-WILDLIFE-2026', 'page', 'Escalation criteria', 'Decision guide', 'Escalate when evidence shows repeated visitor contact, unsafe wildlife behavior, visitor refusal, wildlife distress, or unclear incidents that need Admin judgment.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_evidence, 'SFC-WILDLIFE-2026', 'text', 'Escalation summary format', 'Summary template', 'Incident type:
Location:
Evidence quality:
Visitor response:
Wildlife risk:
Recommended Admin action:', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_evidence, 'SFC-WILDLIFE-2026', 'image', 'Wildlife evidence frame', 'Visual evidence example', 'Use this image placeholder to explain evidence clarity and false-alarm risk.', 'http://localhost:5175/user/training/wildlife-evidence.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_evidence, 'SFC-WILDLIFE-2026', 'checklist', 'Escalation checklist', 'Escalation checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Evidence source is recorded", "Risk level is justified", "Ranger note is included", "False alarm possibility is considered", "Admin action is recommended clearly"]', 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_evidence, 'SFC-WILDLIFE-2026', 'quiz', 'Escalation decision quiz', 'Scenario quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "When should wildlife evidence be escalated?", "choices": ["Only when there is repeated or high-risk behavior", "Every time wildlife appears", "Only after deleting the photo", "Never"], "answer": 0}', NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_evidence, 'SFC-WILDLIFE-2026', 'link', 'Evidence escalation reference', 'External reference', 'Placeholder for evidence escalation SOP.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-WILDLIFE-2026', 'Scenario Practice and Field Readiness', 'Complete scenario checks for visitor reminders, wildlife contact, false alarms, and Admin escalation.', 'Scenario Practice', 'All Parks', 'Intermediate', '1 hour', 'Blended', '', '#ff7a1a', 'Wildlife Field Ready', '["Apply policy to scenarios", "Choose correct escalation paths", "Prepare for certificate review"]', 'Published', 5, 'Complete all required module items and pass the scenario check.');

SET @m_wild_final = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_wild_final, 'Module overview', 'Complete scenario checks for visitor reminders, wildlife contact, false alarms, and Admin escalation.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_final, 'SFC-WILDLIFE-2026', 'page', 'Scenario set overview', 'Final practice', 'This module combines policy, visitor communication, evidence review, and escalation into realistic field scenarios. Complete the checklist and quiz before certificate review.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_final, 'SFC-WILDLIFE-2026', 'text', 'Scenario reflection prompt', 'Reflection prompt', 'Choose one scenario and write what you would say to the visitor, what evidence you would record, and whether you would recommend monitoring, Ranger review, or Admin escalation.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_final, 'SFC-WILDLIFE-2026', 'checklist', 'Final wildlife readiness checklist', 'Final checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Can explain no-touch and no-feeding rules", "Can identify risky behavior", "Can write a neutral note", "Can recommend escalation correctly", "Can identify false alarm risk"]', 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_final, 'SFC-WILDLIFE-2026', 'quiz', 'Final wildlife readiness quiz', 'Final quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "A visitor feeds wildlife after two warnings and there is clear image evidence. What should happen?", "choices": ["Ignore the incident", "Recommend Admin escalation with evidence", "Delete the image", "Tell other visitors to feed too"], "answer": 1}', NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_final, 'SFC-WILDLIFE-2026', 'file', 'Wildlife readiness sign-off', 'File placeholder', 'Use this item as a final readiness sign-off form.', 'https://sarawakforestry.com/', 'wildlife-readiness-sign-off.txt', 'wildlife-readiness-sign-off.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_wild_final, 'SFC-WILDLIFE-2026', 'link', 'Wildlife readiness reference', 'External reference', 'Placeholder for additional reading.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

-- SFC Park Guide Orientation

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-GUIDE-2026', 'Digital Portal and Canvas Learning Flow', 'Learn how to use the SFC Digital Portal course shell, internal course navigation, module item detail, files, progress, and completion state.', 'Orientation', 'All Parks', 'Beginner', '50 minutes', 'Blended', '', '#ff7a1a', 'Portal Ready', '["Open assigned courses", "Use course-level navigation", "Complete module items", "Check progress and certificate state"]', 'Published', 1, 'Complete all required module items and pass the scenario check.');

SET @m_guide_portal = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_guide_portal, 'Module overview', 'Learn how to use the SFC Digital Portal course shell, internal course navigation, module item detail, files, progress, and completion state.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'page', 'Welcome to the SFC Digital Portal', 'Orientation page', 'The portal organizes training into courses. Each course contains an overview, modules, item detail, progress, files, and completion state. Park Guides complete items and quizzes so Admin can review evidence before certificate release.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'text', 'Course navigation quick reference', 'Reference note', 'Overview explains the course. Modules show the learning sequence. Item Detail opens the selected page, file, quiz, or checklist. Progress shows completion. Files stores resources. Completion shows certificate readiness.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'image', 'Portal flow diagram', 'Visual guide', 'Use this image item to explain how the course shell works.', 'http://localhost:5175/user/training/ecotourism-briefing.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'video', 'Portal walkthrough', 'Video placeholder', 'Use this video item as a recorded portal walkthrough placeholder.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'file', 'First login checklist', 'File placeholder', 'Use this file item to guide new Park Guides through first login steps.', 'https://sarawakforestry.com/', 'first-login-checklist.txt', 'first-login-checklist.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'link', 'SFC official website', 'External reference', 'Organization reference for orientation.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'checklist', 'First login checklist', 'First login tasks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Open the course list", "Select assigned course", "Read the overview", "Open module item detail", "Check completion state"]', 'published', 7);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_portal, 'SFC-GUIDE-2026', 'quiz', 'Portal navigation quiz', 'Navigation quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "Where should a Park Guide check certificate readiness?", "choices": ["Files", "Completion", "Admin Detection", "Sensor Rules"], "answer": 1}', NULL, 'published', 8);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-GUIDE-2026', 'Visitor Briefing and Trail Etiquette', 'Prepare consistent visitor briefings covering route expectations, protected-area rules, and respectful trail behavior.', 'Visitor Briefing', 'Bako National Park', 'Beginner', '55 minutes', 'Blended', '', '#ff7a1a', 'Briefing Ready', '["Prepare a short visitor briefing", "Explain trail etiquette", "Communicate no-touch rules clearly"]', 'Published', 2, 'Complete all required module items and pass the scenario check.');

SET @m_guide_briefing = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_guide_briefing, 'Module overview', 'Prepare consistent visitor briefings covering route expectations, protected-area rules, and respectful trail behavior.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_briefing, 'SFC-GUIDE-2026', 'page', 'Visitor briefing structure', 'Briefing guide', 'Start with welcome, route, duration, safety reminders, protected plants and wildlife rules, photo etiquette, waste policy, and help contact path.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_briefing, 'SFC-GUIDE-2026', 'text', 'Two-minute briefing script', 'Script', 'Welcome everyone. Please stay on the trail, follow guide instructions, do not touch or pluck plants, do not feed wildlife, and report any concern to the guide immediately.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_briefing, 'SFC-GUIDE-2026', 'image', 'Trail briefing visual', 'Visual aid', 'Use this image item to support the visitor briefing.', 'http://localhost:5175/user/training/visitor-safety.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_briefing, 'SFC-GUIDE-2026', 'checklist', 'Before departure checklist', 'Departure checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Confirm headcount", "Confirm route and weather", "Explain no-touch policy", "Explain wildlife distance", "Confirm emergency contact path"]', 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_briefing, 'SFC-GUIDE-2026', 'quiz', 'Briefing scenario check', 'Scenario quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "Which briefing point should always be included?", "choices": ["Shortcut trails are allowed", "Visitors may feed wildlife", "Do not touch or pluck protected plants", "Ignore weather changes"], "answer": 2}', NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_briefing, 'SFC-GUIDE-2026', 'file', 'Visitor briefing handout', 'File placeholder', 'Use this item as the visitor briefing handout.', 'https://sarawakforestry.com/', 'visitor-briefing-handout.txt', 'visitor-briefing-handout.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 6);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-GUIDE-2026', 'Park Safety and Emergency Escalation', 'Learn the basic safety checks, emergency reporting path, and when to contact Admin or Ranger support.', 'Safety', 'All Parks', 'Beginner', '1 hour', 'Blended', '', '#ff7a1a', 'Safety Ready', '["Prepare route safety checks", "Respond to visitor incidents", "Use help and escalation channels"]', 'Published', 3, 'Complete all required module items and pass the scenario check.');

SET @m_guide_safety = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_guide_safety, 'Module overview', 'Learn the basic safety checks, emergency reporting path, and when to contact Admin or Ranger support.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_safety, 'SFC-GUIDE-2026', 'page', 'Safety and escalation basics', 'Safety guide', 'Park Guides should monitor weather, trail condition, visitor health, wildlife presence, and communication readiness. Emergencies should be escalated through the correct contact path immediately.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_safety, 'SFC-GUIDE-2026', 'text', 'Emergency handover note', 'Handover template', 'Location:
Visitor condition:
Immediate action taken:
Support needed:
Contact person:
Time reported:', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_safety, 'SFC-GUIDE-2026', 'image', 'Rainforest safety visual', 'Safety image', 'Use this visual reminder for route preparation and weather awareness.', 'http://localhost:5175/user/training/kubah-rainforest-safety.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_safety, 'SFC-GUIDE-2026', 'checklist', 'Safety readiness checklist', 'Safety checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Weather checked", "Route condition checked", "Emergency contacts ready", "Visitor headcount recorded", "Escalation path known"]', 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_safety, 'SFC-GUIDE-2026', 'quiz', 'Emergency escalation quiz', 'Scenario quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "What should a guide do during a serious visitor injury?", "choices": ["Wait until the tour ends", "Escalate immediately through the correct contact path", "Only update the course progress page", "Delete the report"], "answer": 1}', NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_safety, 'SFC-GUIDE-2026', 'link', 'Safety reference', 'External reference', 'Placeholder for official safety reference.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-GUIDE-2026', 'Learning Evidence and Certificate Process', 'Understand how completed items, quizzes, and Admin review create certificate readiness.', 'Completion', 'All Parks', 'Beginner', '45 minutes', 'Blended', '', '#ff7a1a', 'Certificate Ready', '["Complete required module items", "Submit quiz attempts", "Understand Admin certificate release"]', 'Published', 4, 'Complete all required module items and pass the scenario check.');

SET @m_guide_evidence = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_guide_evidence, 'Module overview', 'Understand how completed items, quizzes, and Admin review create certificate readiness.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_evidence, 'SFC-GUIDE-2026', 'page', 'How course completion works', 'Completion guide', 'The course is complete only after required items are opened or submitted, quizzes are attempted, and Admin reviews completion evidence. Certificate release should not be automatic when evidence review is required.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_evidence, 'SFC-GUIDE-2026', 'text', 'Completion evidence note', 'Note', 'Completion evidence includes opened pages, submitted checklists, quiz attempts, and file/resource review. Admin can review this evidence before releasing certificates.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_evidence, 'SFC-GUIDE-2026', 'checklist', 'Certificate readiness checklist', 'Readiness checks', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["All required items opened", "Checklist submitted", "Quiz attempted", "Progress reaches requirement", "Admin review pending or released"]', 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_evidence, 'SFC-GUIDE-2026', 'quiz', 'Certificate process quiz', 'Certificate quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "Who should release a certificate after evidence review?", "choices": ["Any visitor", "Admin", "A random learner", "The browser automatically with no evidence"], "answer": 1}', NULL, 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_evidence, 'SFC-GUIDE-2026', 'file', 'Certificate evidence checklist', 'File placeholder', 'Use this item as a certificate evidence checklist.', 'https://sarawakforestry.com/', 'certificate-evidence-checklist.txt', 'certificate-evidence-checklist.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_evidence, 'SFC-GUIDE-2026', 'link', 'Certificate policy reference', 'External reference', 'Placeholder for certificate policy documentation.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 6);

INSERT INTO training_modules
  (course_id, title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, status, sort_order, criteria)
VALUES
  ('SFC-GUIDE-2026', 'Final Field Simulation', 'Complete a realistic guide scenario that combines visitor briefing, no-touch rules, wildlife distance, incident reporting, and help desk use.', 'Final Simulation', 'All Parks', 'Intermediate', '1 hour 10 minutes', 'Blended', '', '#ff7a1a', 'Field Ready', '["Apply guide briefing skills", "Respond to visitor rule issues", "Use help desk instead of broadcast replies", "Prepare for final Admin review"]', 'Published', 5, 'Complete all required module items and pass the scenario check.');

SET @m_guide_final = LAST_INSERT_ID();

INSERT INTO lessons (module_id, title, content, media_url, lesson_type, sort_order)
VALUES (@m_guide_final, 'Module overview', 'Complete a realistic guide scenario that combines visitor briefing, no-touch rules, wildlife distance, incident reporting, and help desk use.', NULL, 'Text', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_final, 'SFC-GUIDE-2026', 'page', 'Final simulation overview', 'Simulation guide', 'You will handle a simulated group briefing, a visitor near protected flora, a wildlife distance reminder, and a support request. The goal is to show safe communication, proper evidence handling, and correct escalation.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 1);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_final, 'SFC-GUIDE-2026', 'text', 'Simulation response prompt', 'Written response', 'Write how you would brief visitors, what you would say when someone tries to pluck a plant, and what help request you would submit if the announcement is unclear.', '', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 2);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_final, 'SFC-GUIDE-2026', 'image', 'Final field scenario visual', 'Visual scenario', 'Use this visual placeholder during the final simulation.', 'http://localhost:5175/user/training/protected-areas.webp', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 3);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_final, 'SFC-GUIDE-2026', 'checklist', 'Final field readiness checklist', 'Final checklist', '', '', NULL, NULL, NULL, 0, NULL, NULL, '["Briefing completed", "No-touch rule explained", "Wildlife distance explained", "Incident escalation path known", "Help Desk used for follow-up"]', 'published', 4);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_final, 'SFC-GUIDE-2026', 'quiz', 'Final guide readiness quiz', 'Final quiz', '', '', NULL, NULL, NULL, 0, NULL, '{"question": "If a broadcast announcement is unclear, what should a user do?", "choices": ["Reply to all users", "Create a Help Desk request", "Ignore it", "Change Admin settings"], "answer": 1}', NULL, 'published', 5);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_final, 'SFC-GUIDE-2026', 'file', 'Final field assessment sheet', 'File placeholder', 'Use this item as the final field assessment sheet.', 'https://sarawakforestry.com/', 'final-field-assessment-sheet.txt', 'final-field-assessment-sheet.txt', 'text/plain', 2048, NULL, NULL, NULL, 'published', 6);

INSERT INTO course_module_items
  (module_id, course_id, item_type, title, description, content, external_url, file_name, stored_name, mime_type, size_bytes, file_url, quiz_json, checklist_json, status, sort_order)
VALUES
  (@m_guide_final, 'SFC-GUIDE-2026', 'link', 'Final reading reference', 'External reference', 'Placeholder for final reading material.', 'https://sarawakforestry.com/', NULL, NULL, NULL, 0, NULL, NULL, NULL, 'published', 7);

COMMIT;

SELECT
  c.course_id,
  c.course_name,
  COUNT(DISTINCT tm.module_id) AS modules,
  COUNT(DISTINCT cmi.item_id) AS module_items,
  COUNT(DISTINCT cr.resource_id) AS resources,
  c.total_contact_hours AS contact_hours
FROM courses c
LEFT JOIN training_modules tm ON tm.course_id = c.course_id
LEFT JOIN course_module_items cmi ON cmi.course_id = c.course_id
LEFT JOIN course_resources cr ON cr.course_id = c.course_id
WHERE c.course_id IN ('SFC-FIELD-2026', 'SFC-WILDLIFE-2026', 'SFC-GUIDE-2026')
GROUP BY c.course_id, c.course_name, c.total_contact_hours
ORDER BY c.course_id;
