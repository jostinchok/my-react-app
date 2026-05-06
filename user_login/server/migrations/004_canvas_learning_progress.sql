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
