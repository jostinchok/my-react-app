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
    years_experience INT DEFAULT 0,
    address VARCHAR(255),
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

INSERT IGNORE INTO guide_profiles (guide_id, phone, organization)
VALUES ((SELECT user_id FROM users WHERE email = 'guide@test.com'), '0123456789', 'Sarawak Forestry');
