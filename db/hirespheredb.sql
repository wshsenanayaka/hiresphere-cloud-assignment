-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: May 07, 2026 at 07:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hirespheredb`
--

-- --------------------------------------------------------

--
-- Table structure for table `availability_slots`
--

CREATE TABLE `availability_slots` (
  `id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` varchar(50) DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `availability_slots`
--

INSERT INTO `availability_slots` (`id`, `interviewer_id`, `start_time`, `end_time`, `status`, `created_at`) VALUES
(1, 1, '2026-05-08 22:34:00', '2026-05-08 22:34:00', 'booked', '2026-05-06 17:04:16'),
(2, 1, '2026-05-08 22:34:00', '2026-05-08 22:34:00', 'booked', '2026-05-06 17:04:37'),
(3, 1, '2026-05-08 22:34:00', '2026-05-08 22:34:00', 'booked', '2026-05-06 17:04:38'),
(4, 1, '2026-05-25 13:43:00', '2026-05-25 13:43:00', 'booked', '2026-05-07 08:13:47'),
(5, 1, '2026-05-08 10:00:00', '2026-05-08 10:00:00', 'booked', '2026-05-07 16:31:04');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `availability_slot_id` int(11) DEFAULT NULL,
  `booking_date` datetime NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `meeting_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `scheduled_date` date DEFAULT NULL,
  `scheduled_time` time DEFAULT NULL,
  `interview_type` varchar(80) DEFAULT NULL,
  `domain` varchar(80) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rejection_reason` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `candidate_id`, `interviewer_id`, `availability_slot_id`, `booking_date`, `status`, `meeting_link`, `created_at`, `scheduled_date`, `scheduled_time`, `interview_type`, `domain`, `price`, `rejection_reason`, `updated_at`) VALUES
(1, 1, 1, 1, '2026-05-08 22:34:00', 'REJECTED', 'Outlook Calendar / bank', '2026-05-06 17:23:10', '2026-05-08', '22:34:00', 'System Design', 'Backend', 0.00, NULL, '2026-05-07 12:40:42'),
(2, 1, 1, 2, '2026-05-08 22:34:00', 'COMPLETED', 'Outlook Calendar / bank', '2026-05-06 17:24:57', '2026-05-08', '22:34:00', 'System Design', 'Backend', 0.00, NULL, '2026-05-07 12:40:42'),
(3, 1, 1, 3, '2026-05-08 22:34:00', 'COMPLETED', 'Google Calendar / bank', '2026-05-07 08:06:51', '2026-05-08', '22:34:00', 'System Design', 'Backend', 0.00, NULL, '2026-05-07 12:40:42'),
(4, 1, 1, 4, '2026-05-25 13:43:00', 'ACCEPTED', 'Google Calendar / bank', '2026-05-07 09:16:44', '2026-05-25', '13:43:00', 'System Design', 'Backend', 0.00, NULL, '2026-05-07 12:40:42'),
(5, 1, 1, NULL, '0000-00-00 00:00:00', 'PENDING', NULL, '2026-05-07 12:40:42', '2026-05-10', '10:00:00', 'Technical Interview', 'Cloud Computing', 45.00, NULL, '2026-05-07 12:40:42'),
(6, 1, 1, NULL, '0000-00-00 00:00:00', 'PENDING', NULL, '2026-05-07 12:40:42', '2026-05-11', '14:30:00', 'HR Interview', 'Software Engineering', 35.00, NULL, '2026-05-07 12:40:42'),
(7, 1, 1, 5, '2026-05-08 10:00:00', 'ACCEPTED', 'Apple Calendar / bank', '2026-05-07 16:32:34', '2026-05-08', '10:00:00', 'System Design', 'Backend', 45.00, NULL, '2026-05-07 16:33:28');

-- --------------------------------------------------------

--
-- Table structure for table `candidate_package_bookings`
--

CREATE TABLE `candidate_package_bookings` (
  `id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `total_sessions` int(11) NOT NULL,
  `used_sessions` int(11) NOT NULL DEFAULT 0,
  `remaining_sessions` int(11) NOT NULL,
  `payment_status` enum('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `booking_status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `candidate_package_bookings`
--

INSERT INTO `candidate_package_bookings` (`id`, `candidate_id`, `interviewer_id`, `package_id`, `total_sessions`, `used_sessions`, `remaining_sessions`, `payment_status`, `booking_status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 3, 0, 3, 'PAID', 'ACTIVE', '2026-05-07 17:01:47', '2026-05-07 17:01:47');

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `feedback` text NOT NULL,
  `recommendation` varchar(80) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluations`
--

INSERT INTO `evaluations` (`id`, `candidate_id`, `booking_id`, `interviewer_id`, `score`, `feedback`, `recommendation`, `created_at`) VALUES
(1, 1, 2, 1, 100, 'AD', 'Review complete', '2026-05-06 17:35:29'),
(2, 1, 3, 1, 100, 'Good', 'Review complete', '2026-05-07 09:35:22'),
(3, 1, 3, 1, 50, 'ok', 'Review complete', '2026-05-07 11:53:29');

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_reports`
--

CREATE TABLE `evaluation_reports` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `technical_score` int(11) NOT NULL,
  `communication_score` int(11) NOT NULL,
  `problem_solving_score` int(11) NOT NULL,
  `coding_score` int(11) NOT NULL,
  `system_design_score` int(11) NOT NULL,
  `behavioral_score` int(11) NOT NULL,
  `overall_score` decimal(4,2) NOT NULL,
  `strengths` text DEFAULT NULL,
  `improvement_areas` text DEFAULT NULL,
  `interviewer_comments` text DEFAULT NULL,
  `recommendation` enum('Strong Hire','Hire','Needs Improvement','Not Ready') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluation_reports`
--

INSERT INTO `evaluation_reports` (`id`, `booking_id`, `candidate_id`, `interviewer_id`, `technical_score`, `communication_score`, `problem_solving_score`, `coding_score`, `system_design_score`, `behavioral_score`, `overall_score`, `strengths`, `improvement_areas`, `interviewer_comments`, `recommendation`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 4, 4, 5, 4, 3, 4, 4.00, 'Strong API fundamentals and clear debugging process.', 'Improve system design trade-off discussion and scalability examples.', 'Candidate communicated well and handled follow-up questions confidently.', 'Hire', '2026-05-07 17:14:03', '2026-05-07 17:14:03');

-- --------------------------------------------------------

--
-- Table structure for table `interviewers`
--

CREATE TABLE `interviewers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `domain` varchar(80) NOT NULL,
  `interview_type` varchar(80) NOT NULL,
  `skills` text DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interviewers`
--

INSERT INTO `interviewers` (`id`, `user_id`, `name`, `domain`, `interview_type`, `skills`, `rating`, `created_at`) VALUES
(1, 3, 'Hasitha Senananayaka', 'Backend', 'System Design', 'Node.js, MySQL, REST APIs', 4.50, '2026-05-06 17:04:00');

-- --------------------------------------------------------

--
-- Table structure for table `interviewer_pricing`
--

CREATE TABLE `interviewer_pricing` (
  `id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `interview_type` enum('DSA','System Design','Behavioral') NOT NULL,
  `domain` enum('Backend','Frontend','DevOps','AI/ML','Mobile') NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interviewer_pricing`
--

INSERT INTO `interviewer_pricing` (`id`, `interviewer_id`, `interview_type`, `domain`, `duration_minutes`, `price`, `currency`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'DSA', 'Backend', 60, 45.00, 'USD', 0, '2026-05-07 12:40:30', '2026-05-07 12:45:50'),
(2, 1, 'System Design', 'Backend', 90, 75.00, 'USD', 0, '2026-05-07 12:40:30', '2026-05-07 12:45:48'),
(3, 1, 'Behavioral', 'Frontend', 45, 35.00, 'USD', 0, '2026-05-07 12:40:30', '2026-05-07 12:45:45');

-- --------------------------------------------------------

--
-- Table structure for table `interview_packages`
--

CREATE TABLE `interview_packages` (
  `id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `package_name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `domain` varchar(80) NOT NULL,
  `interview_type` varchar(80) NOT NULL,
  `session_count` int(11) NOT NULL,
  `duration_minutes_per_session` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `discount_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interview_packages`
--

INSERT INTO `interview_packages` (`id`, `interviewer_id`, `package_name`, `description`, `domain`, `interview_type`, `session_count`, `duration_minutes_per_session`, `total_price`, `currency`, `discount_percentage`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Backend Interview Sprint', 'Three backend interview sessions with code and system design practice.', 'Backend', 'System Design', 3, 60, 120.00, 'USD', 10.00, 1, '2026-05-07 17:01:47', '2026-05-07 17:01:47'),
(2, 1, 'DSA Fast Track', 'Four DSA practice interviews for candidates preparing for technical rounds.', 'Backend', 'DSA', 4, 45, 140.00, 'USD', 15.00, 1, '2026-05-07 17:01:47', '2026-05-07 17:01:47');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `booking_id`, `sender_id`, `receiver_id`, `message`, `created_at`) VALUES
(1, 2, 3, 1, 'Hi', '2026-05-06 17:43:01'),
(2, 2, 1, 3, 'Hi - He', '2026-05-06 17:44:44'),
(3, 1, 1, 3, 'Hi madam', '2026-05-06 17:50:24'),
(4, 2, 3, 1, 'hi', '2026-05-07 11:53:42');

-- --------------------------------------------------------

--
-- Table structure for table `message_reads`
--

CREATE TABLE `message_reads` (
  `id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `message_reads`
--

INSERT INTO `message_reads` (`id`, `message_id`, `user_id`, `read_at`) VALUES
(1, 1, 1, '2026-05-06 17:44:36'),
(3, 2, 3, '2026-05-06 18:00:59');

-- --------------------------------------------------------

--
-- Table structure for table `profiles`
--

CREATE TABLE `profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `domain` varchar(80) DEFAULT NULL,
  `experience_years` int(11) DEFAULT 0,
  `bio` text DEFAULT NULL,
  `resume_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `interviewer_id` int(11) DEFAULT NULL,
  `title` varchar(180) DEFAULT NULL,
  `github_link` varchar(255) DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `submission_type` varchar(40) DEFAULT 'FILE',
  `status` enum('SUBMITTED','UNDER_REVIEW','REVIEWED','NEEDS_CHANGES') NOT NULL DEFAULT 'SUBMITTED',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `candidate_id`, `booking_id`, `file_name`, `file_path`, `notes`, `created_at`, `interviewer_id`, `title`, `github_link`, `file_url`, `submission_type`, `status`, `updated_at`) VALUES
(1, 1, 2, 'Employee Satisfaction Survey 2025.xlsx', '/uploads/1778088312882-Employee-Satisfaction-Survey-2025.xlsx', NULL, '2026-05-06 17:25:12', 1, 'Employee Satisfaction Survey 2025.xlsx', NULL, '/uploads/1778088312882-Employee-Satisfaction-Survey-2025.xlsx', 'FILE', 'SUBMITTED', '2026-05-07 16:20:41'),
(2, 1, 1, '', '', NULL, '2026-05-07 16:20:41', 1, 'REST API Challenge', 'https://github.com/example/hire-api', '/uploads/sample-submission.js', 'GITHUB', 'UNDER_REVIEW', '2026-05-07 16:28:38');

-- --------------------------------------------------------

--
-- Table structure for table `submission_annotations`
--

CREATE TABLE `submission_annotations` (
  `id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `interviewer_id` int(11) NOT NULL,
  `line_number` int(11) DEFAULT NULL,
  `selected_text` text DEFAULT NULL,
  `comment` text NOT NULL,
  `severity` enum('INFO','SUGGESTION','WARNING','CRITICAL') NOT NULL DEFAULT 'INFO',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `submission_annotations`
--

INSERT INTO `submission_annotations` (`id`, `submission_id`, `interviewer_id`, `line_number`, `selected_text`, `comment`, `severity`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 12, 'pool.execute(...)', 'Good use of prepared statements.', 'INFO', '2026-05-07 16:20:41', '2026-05-07 16:20:41');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('candidate','interviewer','admin') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Hasitha Senananayaka', 'hasithas@mclarens.lk', 'scrypt$b09c45c52d84a374c311c86af567ca3b$8a0f98bfc47503c98fa082024d126214eccb678fdb2496d55d984a1cc0fef5475ab22012ece61ccbd701567e1d53d753f85f7621e9e8dd93262605a449af3680', 'candidate', '2026-05-06 14:13:05'),
(2, 'Demo Candidate', 'candidate@example.com', 'scrypt$ce6a52662a0f6e75f6089ec9257a040e$29492350f9038b74f3374c1409c274b179fd178cef581910cc4b9b87342dd7ec639aebef944b8fdd24fab9b617cc0433425ba7ee8744dfd9b3ee74f0fd7f21fc', 'candidate', '2026-05-06 17:01:46'),
(3, 'Hasitha Senananayaka', 'w.hasitha@outlook.com', 'scrypt$afaf114fbe04e1d19e251c43e00be69b$1769f3a0047c99f904e4525637fb0222bbbee1d3a962394e993538846deed15ab22c5c551d8959197f8cacb7362ea1ce6a152d5aa38361c18d39409a5cbc64f5', 'interviewer', '2026-05-06 17:04:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `availability_slots`
--
ALTER TABLE `availability_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_slots_interviewer` (`interviewer_id`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bookings_candidate` (`candidate_id`),
  ADD KEY `fk_bookings_interviewer` (`interviewer_id`),
  ADD KEY `fk_bookings_slot` (`availability_slot_id`);

--
-- Indexes for table `candidate_package_bookings`
--
ALTER TABLE `candidate_package_bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_candidate_package_candidate_service` (`candidate_id`),
  ADD KEY `fk_candidate_package_interviewer_service` (`interviewer_id`),
  ADD KEY `fk_candidate_package_package_service` (`package_id`);

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_evaluations_candidate` (`candidate_id`),
  ADD KEY `fk_evaluations_booking` (`booking_id`),
  ADD KEY `fk_evaluations_interviewer` (`interviewer_id`);

--
-- Indexes for table `evaluation_reports`
--
ALTER TABLE `evaluation_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`),
  ADD KEY `fk_evaluation_reports_candidate_service` (`candidate_id`),
  ADD KEY `fk_evaluation_reports_interviewer_service` (`interviewer_id`);

--
-- Indexes for table `interviewers`
--
ALTER TABLE `interviewers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `interviewer_pricing`
--
ALTER TABLE `interviewer_pricing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interviewer_pricing_lookup` (`interviewer_id`,`interview_type`,`domain`,`duration_minutes`,`is_active`);

--
-- Indexes for table `interview_packages`
--
ALTER TABLE `interview_packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_interview_packages_interviewer_service` (`interviewer_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_messages_booking` (`booking_id`),
  ADD KEY `fk_messages_sender` (`sender_id`),
  ADD KEY `fk_messages_receiver` (`receiver_id`);

--
-- Indexes for table `message_reads`
--
ALTER TABLE `message_reads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_message_user_read` (`message_id`,`user_id`),
  ADD KEY `fk_message_reads_user` (`user_id`);

--
-- Indexes for table `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_submissions_candidate` (`candidate_id`),
  ADD KEY `fk_submissions_booking` (`booking_id`);

--
-- Indexes for table `submission_annotations`
--
ALTER TABLE `submission_annotations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_submission_annotations_submission` (`submission_id`),
  ADD KEY `fk_submission_annotations_interviewer` (`interviewer_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `availability_slots`
--
ALTER TABLE `availability_slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `candidate_package_bookings`
--
ALTER TABLE `candidate_package_bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `evaluation_reports`
--
ALTER TABLE `evaluation_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interviewers`
--
ALTER TABLE `interviewers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `interviewer_pricing`
--
ALTER TABLE `interviewer_pricing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `interview_packages`
--
ALTER TABLE `interview_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `message_reads`
--
ALTER TABLE `message_reads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `profiles`
--
ALTER TABLE `profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `submission_annotations`
--
ALTER TABLE `submission_annotations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `availability_slots`
--
ALTER TABLE `availability_slots`
  ADD CONSTRAINT `fk_slots_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bookings_slot` FOREIGN KEY (`availability_slot_id`) REFERENCES `availability_slots` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `candidate_package_bookings`
--
ALTER TABLE `candidate_package_bookings`
  ADD CONSTRAINT `fk_candidate_package_candidate_service` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_candidate_package_interviewer_service` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_candidate_package_package_service` FOREIGN KEY (`package_id`) REFERENCES `interview_packages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `fk_evaluations_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_evaluations_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_evaluations_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_reports`
--
ALTER TABLE `evaluation_reports`
  ADD CONSTRAINT `fk_evaluation_reports_booking_service` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_evaluation_reports_candidate_service` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_evaluation_reports_interviewer_service` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `interviewers`
--
ALTER TABLE `interviewers`
  ADD CONSTRAINT `fk_interviewers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `interviewer_pricing`
--
ALTER TABLE `interviewer_pricing`
  ADD CONSTRAINT `fk_interviewer_pricing_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `interview_packages`
--
ALTER TABLE `interview_packages`
  ADD CONSTRAINT `fk_interview_packages_interviewer_service` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `message_reads`
--
ALTER TABLE `message_reads`
  ADD CONSTRAINT `fk_message_reads_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_message_reads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `profiles`
--
ALTER TABLE `profiles`
  ADD CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_submissions_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_submissions_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `submission_annotations`
--
ALTER TABLE `submission_annotations`
  ADD CONSTRAINT `fk_submission_annotations_interviewer` FOREIGN KEY (`interviewer_id`) REFERENCES `interviewers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_submission_annotations_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
