CREATE DATABASE IF NOT EXISTS hirespheredb;
USE hirespheredb;

CREATE TABLE IF NOT EXISTS interview_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interviewer_id INT NOT NULL,
    package_name VARCHAR(160) NOT NULL,
    description TEXT,
    domain VARCHAR(80) NOT NULL,
    interview_type VARCHAR(80) NOT NULL,
    session_count INT NOT NULL,
    duration_minutes_per_session INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interview_packages_interviewer_service
      FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_package_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    interviewer_id INT NOT NULL,
    package_id INT NOT NULL,
    total_sessions INT NOT NULL,
    used_sessions INT NOT NULL DEFAULT 0,
    remaining_sessions INT NOT NULL,
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    booking_status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_package_candidate_service FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_candidate_package_interviewer_service FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
    CONSTRAINT fk_candidate_package_package_service FOREIGN KEY (package_id) REFERENCES interview_packages(id) ON DELETE CASCADE
);

-- Sample package data. Change IDs to match your local users/interviewers.
INSERT INTO interview_packages (
    interviewer_id,
    package_name,
    description,
    domain,
    interview_type,
    session_count,
    duration_minutes_per_session,
    total_price,
    currency,
    discount_percentage,
    is_active
) VALUES
    (1, 'Backend Interview Sprint', 'Three backend interview sessions with code and system design practice.', 'Backend', 'System Design', 3, 60, 120.00, 'USD', 10.00, 1),
    (1, 'DSA Fast Track', 'Four DSA practice interviews for candidates preparing for technical rounds.', 'Backend', 'DSA', 4, 45, 140.00, 'USD', 15.00, 1);

INSERT INTO candidate_package_bookings (
    candidate_id,
    interviewer_id,
    package_id,
    total_sessions,
    used_sessions,
    remaining_sessions,
    payment_status,
    booking_status
) VALUES
    (1, 1, 1, 3, 0, 3, 'PAID', 'ACTIVE');
