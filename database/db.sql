CREATE DATABASE IF NOT EXISTS park_guide_database;
USE park_guide_database;

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    birthday DATE NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
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

CREATE TABLE IF NOT EXISTS guide_profiles (
    guide_id INT PRIMARY KEY,
    phone VARCHAR(20),
    organization VARCHAR(100),
    -- user_page database require
    birthday DATE,
    years_experience INT DEFAULT 0,
    address VARCHAR(255),
    assigned_park VARCHAR(100),
    avatar_url VARCHAR(255),
    -- until here
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (guide_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS training_modules (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
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

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title VARCHAR(255),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    question_text TEXT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
);

CREATE TABLE IF NOT EXISTS options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT,
    option_text TEXT,
    is_correct BOOLEAN,
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);

CREATE TABLE IF NOT EXISTS progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_id INT,
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

CREATE TABLE IF NOT EXISTS certifications (
    cert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_id INT,
    -- user_page database require
    title VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Pending',
    -- until here
    issue_date DATETIME,
    expiry_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id)
);

CREATE TABLE IF NOT EXISTS incidents (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    guide_id INT,
    incident_type VARCHAR(100),
    confidence FLOAT,
    timestamp DATETIME,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    FOREIGN KEY (guide_id) REFERENCES users(user_id)
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

CREATE TABLE IF NOT EXISTS course_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    module_id INT NULL,
    course_key VARCHAR(120) NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120),
    size_bytes BIGINT UNSIGNED DEFAULT 0,
    file_url VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES training_modules(module_id) ON DELETE SET NULL,
    INDEX idx_course_files_user_uploaded (user_id, uploaded_at),
    INDEX idx_course_files_module (module_id)
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

CREATE TABLE IF NOT EXISTS monitoring_incidents (
    incident_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    public_id VARCHAR(128) NOT NULL UNIQUE,
    source ENUM('AI_CAMERA', 'IOT_SENSOR') NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('New', 'Reviewed', 'Acknowledged', 'In Review', 'Resolved', 'False Alarm') NOT NULL DEFAULT 'New',
    location VARCHAR(255) NOT NULL DEFAULT 'Unknown location',
    occurred_at DATETIME(3) NOT NULL,
    notes TEXT NULL,
    raw_payload JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_monitoring_incidents_occurred_at (occurred_at),
    INDEX idx_monitoring_incidents_source_status (source, status),
    INDEX idx_monitoring_incidents_event_type (event_type)
);

CREATE TABLE IF NOT EXISTS monitoring_incident_ai_metadata (
    incident_id BIGINT UNSIGNED PRIMARY KEY,
    predicted_class VARCHAR(100) NULL,
    confidence DECIMAL(8, 6) NOT NULL DEFAULT 0,
    margin DECIMAL(8, 6) NOT NULL DEFAULT 0,
    bbox_json JSON NULL,
    probabilities_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_monitoring_ai_incident
        FOREIGN KEY (incident_id)
        REFERENCES monitoring_incidents (incident_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monitoring_incident_iot_metadata (
    incident_id BIGINT UNSIGNED PRIMARY KEY,
    sensor_id VARCHAR(100) NOT NULL DEFAULT 'plant-zone-01',
    distance_cm DECIMAL(10, 3) NULL,
    threshold_cm DECIMAL(10, 3) NULL,
    mqtt_topic VARCHAR(255) NULL,
    received_at DATETIME(3) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_monitoring_iot_incident
        FOREIGN KEY (incident_id)
        REFERENCES monitoring_incidents (incident_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monitoring_incident_actions (
    action_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    incident_id BIGINT UNSIGNED NOT NULL,
    action_type ENUM('created', 'status_changed', 'note_added', 'metadata_updated') NOT NULL,
    from_status ENUM('New', 'Reviewed', 'Acknowledged', 'In Review', 'Resolved', 'False Alarm') NULL,
    to_status ENUM('New', 'Reviewed', 'Acknowledged', 'In Review', 'Resolved', 'False Alarm') NULL,
    actor_role ENUM('system', 'admin', 'park_ranger', 'ai_camera', 'iot_sensor', 'api') NOT NULL DEFAULT 'system',
    actor_label VARCHAR(120) NULL,
    comment TEXT NULL,
    raw_context JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_monitoring_actions_incident_created (incident_id, created_at),
    CONSTRAINT fk_monitoring_action_incident
        FOREIGN KEY (incident_id)
        REFERENCES monitoring_incidents (incident_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monitoring_incident_evidence_files (
    evidence_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    incident_id BIGINT UNSIGNED NOT NULL,
    evidence_type ENUM('image', 'json', 'video', 'other') NOT NULL DEFAULT 'image',
    browser_url VARCHAR(512) NOT NULL,
    storage_key VARCHAR(512) NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NULL,
    size_bytes BIGINT UNSIGNED NULL,
    sha256 CHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_monitoring_evidence_url (incident_id, browser_url),
    INDEX idx_monitoring_evidence_incident_created (incident_id, created_at),
    CONSTRAINT fk_monitoring_evidence_incident
        FOREIGN KEY (incident_id)
        REFERENCES monitoring_incidents (incident_id)
        ON DELETE CASCADE
);

INSERT IGNORE INTO roles (role_id, role_name) VALUES (1, 'admin'), (2, 'guide'), (3, 'ranger');

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

INSERT IGNORE INTO guide_profiles (guide_id, phone, organization)
VALUES ((SELECT user_id FROM users WHERE email = 'guide@test.com'), '0123456789', 'Sarawak Forestry');

-- Presentation demo login accounts. Password for each account: 1234
INSERT INTO users (role_id, name, email, password_hash)
VALUES
    ((SELECT role_id FROM roles WHERE role_name = 'admin'), 'Admin Demo', 'admin@example.com', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6'),
    ((SELECT role_id FROM roles WHERE role_name = 'guide'), 'User 1', 'user1@demo.local', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6'),
    ((SELECT role_id FROM roles WHERE role_name = 'guide'), 'User 2', 'user2@demo.local', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6'),
    ((SELECT role_id FROM roles WHERE role_name = 'guide'), 'User 3', 'user3@demo.local', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6'),
    ((SELECT role_id FROM roles WHERE role_name = 'ranger'), 'Ranger 1', 'ranger1@demo.local', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6'),
    ((SELECT role_id FROM roles WHERE role_name = 'ranger'), 'Ranger 2', 'ranger2@demo.local', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6'),
    ((SELECT role_id FROM roles WHERE role_name = 'ranger'), 'Ranger 3', 'ranger3@demo.local', '$2b$10$bf7s79R/uXOcXtMqY3S36.d/pgJs14Nob9Kkls4a93in/uY9vmOa6')
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    name = VALUES(name),
    password_hash = VALUES(password_hash);

INSERT INTO guide_profiles (guide_id, phone, organization, years_experience, address, status)
SELECT user_id, '', 'Sarawak Forestry Corporation', 2, 'Bako National Park demo profile', 'active'
FROM users
WHERE email = 'user1@demo.local'
ON DUPLICATE KEY UPDATE
    organization = VALUES(organization),
    years_experience = VALUES(years_experience),
    address = VALUES(address),
    status = VALUES(status);

INSERT INTO guide_profiles (guide_id, phone, organization, years_experience, address, status)
SELECT user_id, '', 'Sarawak Forestry Corporation', 2, 'Semenggoh Nature Reserve demo profile', 'active'
FROM users
WHERE email = 'user2@demo.local'
ON DUPLICATE KEY UPDATE
    organization = VALUES(organization),
    years_experience = VALUES(years_experience),
    address = VALUES(address),
    status = VALUES(status);

INSERT INTO guide_profiles (guide_id, phone, organization, years_experience, address, status)
SELECT user_id, '', 'Sarawak Forestry Corporation', 2, 'Gunung Mulu National Park demo profile', 'active'
FROM users
WHERE email = 'user3@demo.local'
ON DUPLICATE KEY UPDATE
    organization = VALUES(organization),
    years_experience = VALUES(years_experience),
    address = VALUES(address),
    status = VALUES(status);

INSERT INTO training_modules
    (title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, created_by)
SELECT
    'Introduction to Sarawak Protected Areas',
    'Learn protected area zones, visitor expectations, and guide conduct.',
    'Orientation',
    'All Parks',
    'Beginner',
    '30 min',
    'Online',
    '/training/protected-areas.webp',
    '#ff7a1a',
    'Protected Areas Starter',
    '["Explain the role of SFC protected areas","Recognize visitor zones and access expectations","Use the guide code of conduct during briefings"]',
    (SELECT user_id FROM users WHERE email = 'admin@test.com')
WHERE NOT EXISTS (
    SELECT 1 FROM training_modules WHERE title = 'Introduction to Sarawak Protected Areas'
);

INSERT INTO training_modules
    (title, description, category, park, level, duration, format, image_url, accent_color, badge_name, objectives, created_by)
SELECT
    'Visitor Safety and Emergency Response',
    'Prepare for weather changes, injury response, visitor separation, and radio escalation.',
    'Safety',
    'All Parks',
    'Intermediate',
    '55 min',
    'Field',
    '/training/visitor-safety.webp',
    '#ff9f1c',
    'Safety Responder',
    '["Assess visitor risk quickly","Use radio escalation protocol","Document handover notes clearly"]',
    (SELECT user_id FROM users WHERE email = 'admin@test.com')
WHERE NOT EXISTS (
    SELECT 1 FROM training_modules WHERE title = 'Visitor Safety and Emergency Response'
);

INSERT INTO lessons (module_id, title, content, media_url)
SELECT tm.module_id, 'Protected area purpose and zones', 'Understand why zones exist and how guides explain them.', '/training/protected-areas.webp'
FROM training_modules tm
WHERE tm.title = 'Introduction to Sarawak Protected Areas'
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.module_id = tm.module_id AND l.title = 'Protected area purpose and zones'
);

INSERT INTO lessons (module_id, title, content, media_url)
SELECT tm.module_id, 'Guide conduct and visitor briefing', 'Practice the expectations to explain before a route begins.', '/training/ecotourism-briefing.webp'
FROM training_modules tm
WHERE tm.title = 'Introduction to Sarawak Protected Areas'
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.module_id = tm.module_id AND l.title = 'Guide conduct and visitor briefing'
);

INSERT INTO lessons (module_id, title, content, media_url)
SELECT tm.module_id, 'Weather risk and route decision tree', 'Identify when conditions require a route change or escalation.', '/training/safety-response.webp'
FROM training_modules tm
WHERE tm.title = 'Visitor Safety and Emergency Response'
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.module_id = tm.module_id AND l.title = 'Weather risk and route decision tree'
);

INSERT INTO lessons (module_id, title, content, media_url)
SELECT tm.module_id, 'Radio escalation protocol', 'Use clear radio messages during visitor safety incidents.', '/training/visitor-safety.webp'
FROM training_modules tm
WHERE tm.title = 'Visitor Safety and Emergency Response'
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.module_id = tm.module_id AND l.title = 'Radio escalation protocol'
);

INSERT INTO quizzes (module_id, title)
SELECT tm.module_id, 'Protected Areas Check'
FROM training_modules tm
WHERE tm.title = 'Introduction to Sarawak Protected Areas'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.module_id = tm.module_id AND q.title = 'Protected Areas Check'
);

INSERT INTO quizzes (module_id, title)
SELECT tm.module_id, 'Safety Response Check'
FROM training_modules tm
WHERE tm.title = 'Visitor Safety and Emergency Response'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.module_id = tm.module_id AND q.title = 'Safety Response Check'
);

INSERT INTO questions (quiz_id, question_text)
SELECT q.quiz_id, 'What should a guide confirm before leading visitors into a protected area zone?'
FROM quizzes q
WHERE q.title = 'Protected Areas Check'
AND NOT EXISTS (
    SELECT 1 FROM questions qs WHERE qs.quiz_id = q.quiz_id
);

INSERT INTO questions (quiz_id, question_text)
SELECT q.quiz_id, 'When should a guide escalate a weather risk?'
FROM quizzes q
WHERE q.title = 'Safety Response Check'
AND NOT EXISTS (
    SELECT 1 FROM questions qs WHERE qs.quiz_id = q.quiz_id
);

INSERT INTO `options` (question_id, option_text, is_correct)
SELECT qs.question_id, 'Route permissions, visitor expectations, and conservation rules', TRUE
FROM questions qs
WHERE qs.question_text = 'What should a guide confirm before leading visitors into a protected area zone?'
AND NOT EXISTS (
    SELECT 1 FROM `options` o WHERE o.question_id = qs.question_id
);

INSERT INTO `options` (question_id, option_text, is_correct)
SELECT qs.question_id, 'Only the estimated walking time', FALSE
FROM questions qs
WHERE qs.question_text = 'What should a guide confirm before leading visitors into a protected area zone?'
AND NOT EXISTS (
    SELECT 1 FROM `options` o WHERE o.question_id = qs.question_id AND o.option_text = 'Only the estimated walking time'
);

INSERT INTO `options` (question_id, option_text, is_correct)
SELECT qs.question_id, 'When conditions cross the risk threshold or visibility drops', TRUE
FROM questions qs
WHERE qs.question_text = 'When should a guide escalate a weather risk?'
AND NOT EXISTS (
    SELECT 1 FROM `options` o WHERE o.question_id = qs.question_id
);

INSERT INTO `options` (question_id, option_text, is_correct)
SELECT qs.question_id, 'Only after visitors complain', FALSE
FROM questions qs
WHERE qs.question_text = 'When should a guide escalate a weather risk?'
AND NOT EXISTS (
    SELECT 1 FROM `options` o WHERE o.question_id = qs.question_id AND o.option_text = 'Only after visitors complain'
);

INSERT INTO notifications (user_id, title, type, message)
SELECT user_id, 'Training modules ready', 'training', 'Your first database-backed training modules are available.'
FROM users
WHERE email = 'guide@test.com'
AND NOT EXISTS (
    SELECT 1 FROM notifications WHERE title = 'Training modules ready'
);

INSERT INTO schedule (user_id, module_id, title, date, location, type, status)
SELECT
    (SELECT user_id FROM users WHERE email = 'guide@test.com'),
    tm.module_id,
    'Review protected areas module',
    DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY),
    'Self-paced',
    'Reminder',
    'Scheduled'
FROM training_modules tm
WHERE tm.title = 'Introduction to Sarawak Protected Areas'
AND NOT EXISTS (
    SELECT 1 FROM schedule WHERE title = 'Review protected areas module'
);
