ALTER TABLE training_modules ADD COLUMN criteria VARCHAR(255);

CREATE TABLE parks (
  park_id INT AUTO_INCREMENT PRIMARY KEY,
  park_name VARCHAR(100) NOT NULL
);

INSERT INTO parks (park_name) VALUES
('Bako National Park'),
('Gunung Gading National Park'),
('Kubah National Park');


ALTER TABLE users 
ADD COLUMN park_id INT NULL,
ADD CONSTRAINT fk_users_park FOREIGN KEY (park_id) REFERENCES parks(park_id);

ALTER TABLE training_modules 
ADD COLUMN park_id INT NULL,
ADD CONSTRAINT fk_training_modules_park FOREIGN KEY (park_id) REFERENCES parks(park_id);

UPDATE training_modules SET park_id = 1 WHERE module_id = 1; -- Biodiversity Foundations → Bako
UPDATE training_modules SET park_id = 2 WHERE module_id = 2; -- Visitor Safety Essentials → Gunung Gading
UPDATE training_modules SET park_id = 3 WHERE module_id = 3; -- Trail Operations and Compliance → Kubah
UPDATE training_modules SET park_id = 3 WHERE module_id = 4; -- Interpretive Guiding Workshop → Kubah

UPDATE users SET park_id = 1 WHERE user_id = 1;  -- Admin User → Bako
UPDATE users SET park_id = 2 WHERE user_id = 2;  -- Guide User → Gunung Gading
UPDATE users SET park_id = 3 WHERE user_id = 7;  -- Howard → Kubah
UPDATE users SET park_id = 1 WHERE user_id = 18; -- Temp Guide → Bako
UPDATE users SET park_id = 2 WHERE user_id = 19; -- Alex → Gunung Gading
UPDATE users SET park_id = 3 WHERE user_id IN (20,21,22); -- Adam → Kubah
UPDATE users SET park_id = 1 WHERE user_id = 23; -- Test User → Bako
UPDATE users SET park_id = 3 WHERE user_id = 26; -- Mary Taylor → Kubah


ALTER TABLE incidents 
ADD COLUMN park_id INT NULL,
ADD CONSTRAINT fk_incidents_park FOREIGN KEY (park_id) REFERENCES parks(park_id);

ALTER TABLE guide_profiles ADD COLUMN user_id INT NOT NULL;
ALTER TABLE guide_profiles ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id);

UPDATE guide_profiles SET user_id = 2 WHERE guide_id = 2;
UPDATE guide_profiles SET user_id = 7 WHERE guide_id = 7;
UPDATE guide_profiles SET user_id = 18 WHERE guide_id = 18;
UPDATE guide_profiles SET user_id = 19 WHERE guide_id = 19;
UPDATE guide_profiles SET user_id = 20 WHERE guide_id = 20;
UPDATE guide_profiles SET user_id = 21 WHERE guide_id = 21;
UPDATE guide_profiles SET user_id = 22 WHERE guide_id = 22;
UPDATE guide_profiles SET user_id = 23 WHERE guide_id = 23;
UPDATE guide_profiles SET user_id = 26 WHERE guide_id = 26;

ALTER TABLE guide_profiles 
MODIFY guide_id INT AUTO_INCREMENT;

