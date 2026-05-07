CREATE DATABASE IF NOT EXISTS hirespheredb;
USE hirespheredb;

CREATE TABLE IF NOT EXISTS interviewer_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interviewer_id INT NOT NULL,
    interview_type ENUM('DSA', 'System Design', 'Behavioral') NOT NULL,
    domain ENUM('Backend', 'Frontend', 'DevOps', 'AI/ML', 'Mobile') NOT NULL,
    duration_minutes INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviewer_pricing_interviewer
      FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
    INDEX idx_interviewer_pricing_lookup (interviewer_id, interview_type, domain, duration_minutes, is_active)
);

-- Sample pricing data. Change interviewer_id values to match your database.
INSERT INTO interviewer_pricing (
    interviewer_id,
    interview_type,
    domain,
    duration_minutes,
    price,
    currency,
    is_active
) VALUES
    (1, 'DSA', 'Backend', 60, 45.00, 'USD', 1),
    (1, 'System Design', 'Backend', 90, 75.00, 'USD', 1),
    (1, 'Behavioral', 'Frontend', 45, 35.00, 'USD', 1);
