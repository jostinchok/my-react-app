DELIMITER $$

CREATE PROCEDURE add_column_if_missing(
    IN target_table VARCHAR(64),
    IN target_column VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = target_table
          AND COLUMN_NAME = target_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', target_table, '` ADD COLUMN ', column_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

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

CREATE TABLE IF NOT EXISTS guide_profiles (
    guide_id INT PRIMARY KEY,
    phone VARCHAR(20),
    organization VARCHAR(100),
    years_experience INT DEFAULT 0,
    address VARCHAR(255),
    avatar_url VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (guide_id) REFERENCES users(user_id) ON DELETE CASCADE
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

CALL add_column_if_missing('courses', 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_missing('training_modules', 'course_id', 'course_id VARCHAR(50) NULL');
CALL add_column_if_missing('training_modules', 'status', 'status VARCHAR(50) DEFAULT ''Published''');
CALL add_column_if_missing('training_modules', 'sort_order', 'sort_order INT DEFAULT 0');
CALL add_column_if_missing('training_modules', 'criteria', 'criteria TEXT NULL');
CALL add_column_if_missing('lessons', 'lesson_type', 'lesson_type VARCHAR(50) DEFAULT ''Text''');
CALL add_column_if_missing('lessons', 'sort_order', 'sort_order INT DEFAULT 0');
CALL add_column_if_missing('quizzes', 'sort_order', 'sort_order INT DEFAULT 0');
CALL add_column_if_missing('questions', 'sort_order', 'sort_order INT DEFAULT 0');
CALL add_column_if_missing('options', 'sort_order', 'sort_order INT DEFAULT 0');
CALL add_column_if_missing('progress', 'progress_percent', 'progress_percent INT DEFAULT 0');
CALL add_column_if_missing('certifications', 'certificate_code', 'certificate_code VARCHAR(120) NULL');

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

CREATE TABLE IF NOT EXISTS admin_badges (
    badge_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'General',
    require_quiz BOOLEAN DEFAULT TRUE,
    require_physical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP PROCEDURE add_column_if_missing;
