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
