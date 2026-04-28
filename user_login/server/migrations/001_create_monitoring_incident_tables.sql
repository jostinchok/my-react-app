CREATE DATABASE IF NOT EXISTS cos30049_assignment;

USE cos30049_assignment;

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
