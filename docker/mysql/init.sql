CREATE DATABASE IF NOT EXISTS hiresphere;
USE hiresphere;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('candidate', 'interviewer', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interviewers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    domain VARCHAR(80) NOT NULL,
    interview_type VARCHAR(80) NOT NULL,
    skills TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviewers_user_docker FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interviewer_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_slots_interviewer_docker FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    interviewer_id INT NOT NULL,
    availability_slot_id INT,
    booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_date DATE NULL,
    scheduled_time TIME NULL,
    interview_type VARCHAR(80) NULL,
    domain VARCHAR(80) NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING',
    meeting_link VARCHAR(255),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_candidate_docker FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_interviewer_docker FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_slot_docker FOREIGN KEY (availability_slot_id) REFERENCES availability_slots(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    booking_id INT NOT NULL,
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
    CONSTRAINT fk_submissions_candidate_docker FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_booking_docker FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_interviewer_docker FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    booking_id INT NOT NULL,
    interviewer_id INT NOT NULL,
    score INT NOT NULL,
    feedback TEXT NOT NULL,
    recommendation VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evaluations_candidate_docker FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluations_booking_docker FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluations_interviewer_docker FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_booking_docker FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender_docker FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_receiver_docker FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_message_read (message_id, user_id),
    CONSTRAINT fk_message_reads_message_docker FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_reads_user_docker FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
