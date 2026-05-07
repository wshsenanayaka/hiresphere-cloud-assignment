CREATE DATABASE IF NOT EXISTS hirespheredb;
USE hirespheredb;

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    interviewer_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    interview_type VARCHAR(80) NOT NULL,
    domain VARCHAR(80) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_service_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_service_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
);

-- Run these ALTER statements when your project already has the older bookings table.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_date DATE NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_time TIME NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS interview_type VARCHAR(80) NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS domain VARCHAR(80) NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE bookings b
LEFT JOIN interviewers i ON i.id = b.interviewer_id
SET
    b.scheduled_date = COALESCE(b.scheduled_date, DATE(b.booking_date)),
    b.scheduled_time = COALESCE(b.scheduled_time, TIME(b.booking_date)),
    b.interview_type = COALESCE(b.interview_type, i.interview_type, 'General Interview'),
    b.domain = COALESCE(b.domain, i.domain, 'General'),
    b.status = CASE
        WHEN UPPER(b.status) IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED') THEN UPPER(b.status)
        WHEN LOWER(b.status) = 'booked' THEN 'PENDING'
        WHEN LOWER(b.status) = 'evaluated' THEN 'COMPLETED'
        ELSE 'PENDING'
    END
WHERE b.id IS NOT NULL;

ALTER TABLE bookings
    MODIFY COLUMN status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING';

-- Sample assignment data. Change IDs to match your users/interviewers.
INSERT INTO bookings (
    candidate_id,
    interviewer_id,
    scheduled_date,
    scheduled_time,
    interview_type,
    domain,
    price,
    status
) VALUES
    (1, 1, '2026-05-10', '10:00:00', 'Technical Interview', 'Cloud Computing', 45.00, 'PENDING'),
    (1, 1, '2026-05-11', '14:30:00', 'HR Interview', 'Software Engineering', 35.00, 'PENDING');
