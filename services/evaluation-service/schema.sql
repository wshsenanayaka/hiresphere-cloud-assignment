CREATE DATABASE IF NOT EXISTS hirespheredb;
USE hirespheredb;

CREATE TABLE IF NOT EXISTS evaluation_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    candidate_id INT NOT NULL,
    interviewer_id INT NOT NULL,
    technical_score INT NOT NULL,
    communication_score INT NOT NULL,
    problem_solving_score INT NOT NULL,
    coding_score INT NOT NULL,
    system_design_score INT NOT NULL,
    behavioral_score INT NOT NULL,
    overall_score DECIMAL(4,2) NOT NULL,
    strengths TEXT,
    improvement_areas TEXT,
    interviewer_comments TEXT,
    recommendation ENUM('Strong Hire', 'Hire', 'Needs Improvement', 'Not Ready') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_evaluation_reports_booking_service FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_reports_candidate_service FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_reports_interviewer_service FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
);

-- Sample report data. Change IDs to match your database.
INSERT INTO evaluation_reports (
    booking_id, candidate_id, interviewer_id,
    technical_score, communication_score, problem_solving_score,
    coding_score, system_design_score, behavioral_score,
    overall_score, strengths, improvement_areas, interviewer_comments, recommendation
) VALUES (
    1, 1, 1,
    4, 4, 5,
    4, 3, 4,
    4.00,
    'Strong API fundamentals and clear debugging process.',
    'Improve system design trade-off discussion and scalability examples.',
    'Candidate communicated well and handled follow-up questions confidently.',
    'Hire'
);
