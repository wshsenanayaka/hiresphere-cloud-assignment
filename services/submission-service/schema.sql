CREATE DATABASE IF NOT EXISTS hirespheredb;
USE hirespheredb;

CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    candidate_id INT NOT NULL,
    interviewer_id INT NULL,
    title VARCHAR(180),
    github_link VARCHAR(255),
    file_url VARCHAR(255),
    submission_type VARCHAR(40) DEFAULT 'FILE',
    status ENUM('SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_CHANGES') NOT NULL DEFAULT 'SUBMITTED',
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_submission_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_review_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_review_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL
);

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS interviewer_id INT NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS title VARCHAR(180) NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS github_link VARCHAR(255) NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS file_url VARCHAR(255) NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_type VARCHAR(40) DEFAULT 'FILE';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status ENUM('SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_CHANGES') NOT NULL DEFAULT 'SUBMITTED';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE submissions s
JOIN bookings b ON b.id = s.booking_id
SET
    s.interviewer_id = COALESCE(s.interviewer_id, b.interviewer_id),
    s.title = COALESCE(s.title, s.file_name, 'Candidate submission'),
    s.file_url = COALESCE(s.file_url, s.file_path),
    s.submission_type = COALESCE(s.submission_type, 'FILE')
WHERE s.id IS NOT NULL;

CREATE TABLE IF NOT EXISTS submission_annotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    interviewer_id INT NOT NULL,
    line_number INT NULL,
    selected_text TEXT,
    comment TEXT NOT NULL,
    severity ENUM('INFO', 'SUGGESTION', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_submission_annotations_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_annotations_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
);

-- Sample data. Change IDs to match your local database.
INSERT INTO submissions (
    booking_id,
    candidate_id,
    interviewer_id,
    title,
    github_link,
    file_url,
    submission_type,
    status
) VALUES
    (1, 1, 1, 'REST API Challenge', 'https://github.com/example/hire-api', '/uploads/sample-submission.js', 'GITHUB', 'SUBMITTED');

INSERT INTO submission_annotations (
    submission_id,
    interviewer_id,
    line_number,
    selected_text,
    comment,
    severity
) VALUES
    (1, 1, 12, 'pool.execute(...)', 'Good use of prepared statements.', 'INFO');
