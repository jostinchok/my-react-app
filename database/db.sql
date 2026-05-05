CREATE DATABASE IF NOT EXISTS park_guide_database;
USE park_guide_database;

CREATE TABLE IF NOT EXISTS courses (
    course_id VARCHAR(50) PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_contact_hours INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS parks (
    park_id INT AUTO_INCREMENT PRIMARY KEY,
    park_name VARCHAR(100) NOT NULL
);

INSERT IGNORE INTO parks (park_id, park_name) VALUES
    (1, 'Bako National Park'),
    (2, 'Gunung Gading National Park'),
    (3, 'Kubah National Park');

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    park_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (park_id) REFERENCES parks(park_id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_token (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_avatars (
    user_id INT PRIMARY KEY,
    stored_name VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guide_profiles (
    guide_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(100),
    -- user_page database require
    guide_code VARCHAR(50),
    years_experience INT DEFAULT 0,
    birthday DATE,
    address VARCHAR(255),
    avatar_url VARCHAR(255),
    -- until here
    status ENUM('active', 'inactive') DEFAULT 'active',
    UNIQUE KEY unique_guide_profiles_user_id (user_id),
    FOREIGN KEY (guide_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_modules (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(50) NULL,
    title VARCHAR(255),
    description TEXT,
    status VARCHAR(30) DEFAULT 'Draft',
    sort_order INT DEFAULT 0,
    criteria VARCHAR(255),
    park_id INT NULL,
    -- user_page database require
    category VARCHAR(100),
    park VARCHAR(100),
    level VARCHAR(50),
    duration VARCHAR(50),
    format VARCHAR(50),
    image_url VARCHAR(255),
    accent_color VARCHAR(20),
    badge_name VARCHAR(100),
    objectives TEXT,
    -- until here
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (park_id) REFERENCES parks(park_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255),
    content TEXT,
    media_url VARCHAR(255),
    lesson_type VARCHAR(20) DEFAULT 'text',
    sort_order INT DEFAULT 0,
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    question_text TEXT,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

CREATE TABLE IF NOT EXISTS options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT,
    option_text TEXT,
    is_correct BOOLEAN,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);

CREATE TABLE IF NOT EXISTS progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_id INT,
    progress_percent INT DEFAULT 0,
    -- user_page database require
    completed_lessons TEXT,
    quiz_passed BOOLEAN DEFAULT FALSE,
    quiz_score INT DEFAULT 0,
    -- until here
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completion_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);
ALTER TABLE progress ADD UNIQUE KEY unique_user_module_progress (user_id, module_id);

CREATE TABLE IF NOT EXISTS certifications (
    cert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_id INT,
    -- user_page database require
    title VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Pending',
    certificate_code VARCHAR(100) NULL,
    -- until here
    issue_date DATETIME,
    expiry_date DATETIME,
    UNIQUE KEY uniq_certifications_user_module (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS incidents (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    guide_id INT,
    incident_type VARCHAR(100),
    confidence FLOAT,
    timestamp DATETIME,
    park_id INT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    FOREIGN KEY (guide_id) REFERENCES users(user_id),
    FOREIGN KEY (park_id) REFERENCES parks(park_id)
);

CREATE TABLE IF NOT EXISTS evidence (
    evidence_id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT,
    file_path VARCHAR(255),
    file_type ENUM('image', 'video'),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    -- user_page database require
    title VARCHAR(255),
    type VARCHAR(50) DEFAULT 'training',
    -- until here
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    reviewed_by INT NULL,
    remarks VARCHAR(255) NULL,
    UNIQUE KEY uniq_course_enrollment_user_course (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- user_page database require
CREATE TABLE IF NOT EXISTS schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_id INT,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    type VARCHAR(50) DEFAULT 'Reminder',
    status VARCHAR(50) DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);
-- until here

CREATE TABLE IF NOT EXISTS course_resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    uploaded_by INT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150) NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_course_resources_course (course_id, created_at)
);

INSERT IGNORE INTO roles (role_id, role_name) VALUES (1, 'admin'), (2, 'guide');

-- Test password for seeded users: 1234
INSERT INTO users (role_id, name, email, password_hash)
VALUES (1, 'Admin User', 'admin@test.com', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6')
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    name = VALUES(name),
    password_hash = VALUES(password_hash);

INSERT INTO users (role_id, name, email, password_hash)
VALUES (2, 'Guide User', 'guide@test.com', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6')
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    name = VALUES(name),
    password_hash = VALUES(password_hash);

UPDATE users SET park_id = 1 WHERE email = 'admin@test.com';
UPDATE users SET park_id = 2 WHERE email = 'guide@test.com';

INSERT IGNORE INTO guide_profiles (guide_id, user_id, phone, organization)
VALUES (
    (SELECT user_id FROM users WHERE email = 'guide@test.com'),
    (SELECT user_id FROM users WHERE email = 'guide@test.com'),
    '0123456789',
    'Sarawak Forestry'
);

-- Ensure compatibility for existing databases created before these columns existed.
SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'guide_profiles'
      AND COLUMN_NAME = 'user_id'
);
SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE guide_profiles ADD COLUMN user_id INT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE guide_profiles SET user_id = guide_id WHERE user_id IS NULL;

SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'guide_profiles'
      AND COLUMN_NAME = 'guide_code'
);
SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE guide_profiles ADD COLUMN guide_code VARCHAR(50)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'guide_profiles'
      AND COLUMN_NAME = 'birthday'
);
SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE guide_profiles ADD COLUMN birthday DATE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'guide_profiles'
      AND COLUMN_NAME = 'years_experience'
);
SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE guide_profiles ADD COLUMN years_experience INT DEFAULT 0',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'guide_profiles'
      AND COLUMN_NAME = 'address'
);
SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE guide_profiles ADD COLUMN address VARCHAR(255)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'guide_profiles'
      AND COLUMN_NAME = 'avatar_url'
);
SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE guide_profiles ADD COLUMN avatar_url VARCHAR(255)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE guide_profiles gp
JOIN users u ON u.user_id = gp.guide_id
SET
    gp.guide_code = COALESCE(gp.guide_code, CONCAT('PG-', LPAD(gp.guide_id, 4, '0'))),
    gp.phone = COALESCE(NULLIF(gp.phone, ''), '0123456789'),
    gp.organization = COALESCE(NULLIF(gp.organization, ''), 'Bako National Park'),
    gp.years_experience = COALESCE(gp.years_experience, 2),
    gp.birthday = COALESCE(gp.birthday, '1996-04-12'),
    gp.address = COALESCE(NULLIF(gp.address, ''), 'Sarawak Forestry HQ'),
    gp.avatar_url = COALESCE(gp.avatar_url, '')
WHERE u.email = 'guide@test.com';

INSERT INTO training_modules (module_id, title, description, criteria, park_id, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, created_by)
VALUES
  (1, 'Bako Trail Guiding', 'Trail briefing, interpretation, and visitor management basics.', 'Require 100% Progress', 1, 'Guiding', 'Bako National Park', 'Beginner', '2h 20m', 'Blended', '', '#ff7a1a', 'Bako Trail Guide Badge', '["Prepare visitor pre-brief checklist","Lead interpretation stops clearly","Handle route pacing and reroutes"]', (SELECT user_id FROM users WHERE email = 'admin@test.com')),
  (2, 'Visitor Safety Response', 'Incident awareness, escalation, and immediate response protocol.', 'Require 100% Progress', 2, 'Safety', 'Kubah National Park', 'Intermediate', '1h 45m', 'Workshop', '', '#6bdc45', 'Safety Response Badge', '["Identify incident severity quickly","Execute first response flow correctly","Document incidents consistently"]', (SELECT user_id FROM users WHERE email = 'admin@test.com')),
  (3, 'Conservation Law Essentials', 'Protected-area rules and compliance communication.', 'Require 100% Progress', 3, 'Compliance', 'Gunung Gading National Park', 'Beginner', '2h 05m', 'Online', '', '#ffd23f', 'Conservation Compliance Badge', '["Explain protected-area restrictions","Apply clear compliance messaging","Record repeated rule breaches"]', (SELECT user_id FROM users WHERE email = 'admin@test.com'))
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  criteria = VALUES(criteria),
  park_id = VALUES(park_id),
  category = VALUES(category),
  park = VALUES(park),
  level = VALUES(level),
  duration = VALUES(duration),
  format = VALUES(format),
  accent_color = VALUES(accent_color),
  badge_name = VALUES(badge_name),
  objectives = VALUES(objectives);

INSERT INTO lessons (module_id, title, content)
VALUES
  (1, 'Trail pre-brief checklist', 'Checklist before entering the trail.'),
  (1, 'Visitor group pacing', 'Safe pace strategy for mixed visitors.'),
  (1, 'Hazard communication cues', 'How to communicate terrain hazards quickly.'),
  (2, 'Incident severity matrix', 'Classify incidents by urgency.'),
  (2, 'On-site communication flow', 'Communicate with command and visitors.'),
  (3, 'Core conservation laws', 'Foundational protected-area legal principles.'),
  (3, 'Visitor rule communication', 'How to explain rules clearly.')
ON DUPLICATE KEY UPDATE content = VALUES(content);

INSERT INTO quizzes (quiz_id, module_id, title)
VALUES
  (1, 1, 'Bako Trail Quiz'),
  (2, 2, 'Visitor Safety Quiz'),
  (3, 3, 'Conservation Law Quiz')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO questions (question_id, quiz_id, question_text)
VALUES
  (1, 1, 'What is the first action when the trail becomes slippery from heavy rain?'),
  (2, 1, 'What is the safest way to handle a lagging visitor?'),
  (3, 2, 'When a visitor reports chest pain, what should you do first?'),
  (4, 3, 'Which statement best reflects compliance communication?')
ON DUPLICATE KEY UPDATE question_text = VALUES(question_text);

INSERT INTO options (option_id, question_id, option_text, is_correct)
VALUES
  (1, 1, 'Continue quickly to finish route', FALSE),
  (2, 1, 'Stop, regroup visitors, and reassess safe route', TRUE),
  (3, 1, 'Ignore and continue briefing later', FALSE),
  (4, 2, 'Leave them behind', FALSE),
  (5, 2, 'Pause group and re-align pacing', TRUE),
  (6, 2, 'Increase speed for everyone', FALSE),
  (7, 3, 'Finish current trail explanation', FALSE),
  (8, 3, 'Assess and escalate emergency protocol immediately', TRUE),
  (9, 3, 'Wait for visitor to rest', FALSE),
  (10, 4, 'Ignore minor breaches', FALSE),
  (11, 4, 'Use clear instruction and document repeat cases', TRUE),
  (12, 4, 'Argue with visitors', FALSE)
ON DUPLICATE KEY UPDATE
  option_text = VALUES(option_text),
  is_correct = VALUES(is_correct);

INSERT INTO progress (user_id, module_id, progress_percent, completed_lessons, quiz_passed, quiz_score, status, completion_date)
VALUES
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 1, 100, '0,1,2', TRUE, 100, 'completed', NOW()),
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 2, 45, '0', FALSE, 45, 'in_progress', NULL),
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 3, 0, '', FALSE, 0, 'not_started', NULL)
ON DUPLICATE KEY UPDATE
  progress_percent = VALUES(progress_percent),
  completed_lessons = VALUES(completed_lessons),
  quiz_passed = VALUES(quiz_passed),
  quiz_score = VALUES(quiz_score),
  status = VALUES(status),
  completion_date = VALUES(completion_date);

INSERT INTO certifications (user_id, module_id, title, status, certificate_code, issue_date, expiry_date)
VALUES
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 1, 'Bako Trail Guide Badge', 'Approved', 'CERT-DEMO-BAKO', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 2, 'Safety Response Badge', 'Pending', NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  status = VALUES(status),
  certificate_code = VALUES(certificate_code),
  issue_date = VALUES(issue_date),
  expiry_date = VALUES(expiry_date);

INSERT INTO notifications (user_id, title, type, message, is_read)
VALUES
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 'Module updated', 'training', 'Visitor Safety Response has new checklist items.', FALSE),
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 'Reminder set', 'schedule', 'Bako Trail practice is due tomorrow.', FALSE),
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 'Certificate ready', 'certificate', 'Your Bako certificate is ready for download.', TRUE)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  type = VALUES(type),
  message = VALUES(message),
  is_read = VALUES(is_read);

INSERT INTO schedule (user_id, module_id, title, date, location, type, status)
VALUES
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 1, 'Bako Trail refresher', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Field Session', 'Field', 'Scheduled'),
  ((SELECT user_id FROM users WHERE email = 'guide@test.com'), 2, 'Safety drill review', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Training Hall', 'Quiz', 'Scheduled')
ON DUPLICATE KEY UPDATE
  module_id = VALUES(module_id),
  title = VALUES(title),
  date = VALUES(date),
  location = VALUES(location),
  type = VALUES(type),
  status = VALUES(status);
