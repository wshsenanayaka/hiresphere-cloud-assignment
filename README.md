# HireSphere Cloud Interview Platform

HireSphere is a cloud-based interview management platform. Candidates can book interview sessions, upload submissions, chat with interviewers, and join live interviews. Interviewers can manage availability, set pricing per session, approve or reject booking requests, and publish evaluations.

## Tech Stack

- Frontend: React with Vite
- Backend: Node.js Express
- Database: MySQL
- Realtime messaging: Socket.IO
- Live session service: Node.js
- Microservices: Booking, messaging, live session, interviewer pricing

## Run Locally

Start the services you normally use:

```bash
npm run dev
npm run backend
npm run live:dev
npm run messages:dev
```

Open the app:

```txt
http://127.0.0.1:5173
```

The pricing feature works through the main backend at:

```txt
http://localhost:5000/pricing
```

The separate interviewer service is optional. If you want to run it:

```bash
cd services/interviewer-service
npm install
cd ../..
npm run interviewer:dev
```

## System Flow

1. Start the frontend and backend services.
2. Open the React app in the browser.
3. Select a user type:
   - Candidate
   - Interviewer
4. Login or sign up.
5. Use the dashboard based on the selected role.

## Candidate Flow

Candidate users can:

- Search interviewers
- Book interviews
- Upload submissions
- View booking history
- Message interviewers
- Join live interviews

Booking flow:

```txt
Login
→ Candidate Dashboard
→ Select Interviewer
→ Select Time Slot
→ Enter Challenge Title
→ Select Calendar
→ Select Payment Method
→ Click Pay and Book
→ Booking created as PENDING
→ Wait for interviewer approval
```

Submission flow:

```txt
Candidate Dashboard
→ Upload Submission
→ Select Interview
→ Choose File
→ Click Upload
→ Submission saved
```

Candidate dashboard metric tabs:

```txt
Interviewers → Scrolls to interviewer list
Booked → Shows all booking history
Submitted → Shows submitted interviews
Evaluated → Shows evaluated interviews
```

## Interviewer Flow

Interviewer users can:

- Add availability slots
- Set pricing per session
- View booking requests
- Accept or reject bookings
- Upload evaluations
- Message candidates
- Join live interviews

Availability flow:

```txt
Login
→ Interviewer Dashboard
→ Availability Management
→ Select Date
→ Select Time
→ Click Add Slot
→ Slot available for candidates
```

Pricing flow:

```txt
Interviewer Dashboard
→ Click Set Pricing
→ Add Pricing
→ Select Interview Type
→ Select Domain
→ Enter Duration Minutes
→ Enter Price
→ Select Currency
→ Active pricing checked
→ Click Create Pricing
→ Pricing saved
```

Supported interview types:

```txt
DSA
System Design
Behavioral
```

Supported domains:

```txt
Backend
Frontend
DevOps
AI/ML
Mobile
```

Booking approval flow:

```txt
Interviewer Dashboard
→ Click Booking Requests
→ View Pending Requests
→ Accept or Reject
→ Candidate can see status in history
```

Evaluation flow:

```txt
Interviewer Dashboard
→ Evaluation Upload
→ Select Candidate Interview
→ Enter Score
→ Enter Feedback
→ Click Publish Evaluation
→ Candidate sees evaluation
```

## Messaging Flow

```txt
Candidate or Interviewer Dashboard
→ Click Message
→ Chat window opens
→ Send message
→ Other user receives message
```

Required service:

```bash
npm run messages:dev
```

## Live Interview Flow

```txt
Candidate or Interviewer Dashboard
→ Click Join
→ Live interview room opens
→ Camera and microphone start
→ Interview session begins
```

Required service:

```bash
npm run live:dev
```

## Pricing API

Pricing endpoints:

```txt
POST   /pricing
GET    /pricing/interviewer/:interviewerId
GET    /pricing/interviewer/:interviewerId/active
PUT    /pricing/:pricingId
DELETE /pricing/:pricingId
```

Pricing validation:

- `interviewer_id` is required.
- `interview_type` is required.
- `domain` is required.
- `duration_minutes` must be greater than 0.
- `price` must be greater than 0.
- Default currency is `USD`.
- Only the related interviewer can update or delete pricing.
- Duplicate active pricing is prevented for the same interviewer, interview type, domain, and duration.

## Submission Annotation Feature

Interviewers can review candidate coding submissions, add line-based annotations, comment on selected text, set severity, and update review status. Candidates can view reviewed submissions and reviewer annotations.

Submission status values:

```txt
SUBMITTED
UNDER_REVIEW
REVIEWED
NEEDS_CHANGES
```

Annotation severity values:

```txt
INFO
SUGGESTION
WARNING
CRITICAL
```

Submission review endpoints:

```txt
GET    /submissions/interviewer/:interviewerId
GET    /submissions/candidate/:candidateId
GET    /submissions/:submissionId
PUT    /submissions/:submissionId/status
POST   /submissions/:submissionId/annotations
GET    /submissions/:submissionId/annotations
PUT    /annotations/:annotationId
DELETE /annotations/:annotationId
```

Run the optional submission microservice:

```bash
cd services/submission-service
npm install
cd ../..
npm run submissions:dev
```

The app also includes a fallback through the main backend, so this feature works with:

```bash
npm run backend
```

Build the submission service Docker image:

```bash
docker build -t hiresphere-submission-service:latest services/submission-service
```

Apply Kubernetes deployment:

```bash
kubectl apply -f services/submission-service/k8s-deployment.yaml
```

Sample submission SQL:

```sql
INSERT INTO submissions
(booking_id, candidate_id, interviewer_id, title, github_link, file_url, submission_type, status)
VALUES
(1, 1, 1, 'REST API Challenge', 'https://github.com/example/hire-api', '/uploads/sample-submission.js', 'GITHUB', 'SUBMITTED');
```

Submission annotation report summary:

```txt
The Annotate Candidate Submissions feature allows interviewers to review uploaded candidate work and provide structured feedback. Interviewers can view assigned submissions, inspect local file content or GitHub links, add annotations with severity levels, and update review status. Candidates can view reviewed submissions and annotations from their feedback page. The feature uses Express APIs, MySQL tables for submissions and annotations, prepared statements for database safety, and local file storage for assignment testing.
```

## Bundled Interview Packages Feature

Interviewers can create bundled interview packages, and candidates can browse, book, and track package session usage.

Package endpoints:

```txt
POST   /packages
GET    /packages/interviewer/:interviewerId
GET    /packages/active
GET    /packages/:packageId
PUT    /packages/:packageId
DELETE /packages/:packageId
POST   /packages/:packageId/book
GET    /packages/candidate/:candidateId/bookings
PUT    /packages/bookings/:bookingId/use-session
```

Payment status values:

```txt
PENDING
PAID
FAILED
REFUNDED
```

Booking status values:

```txt
ACTIVE
COMPLETED
CANCELLED
```

Run the optional package microservice:

```bash
cd services/package-service
npm install
cd ../..
npm run packages:dev
```

The app also includes a fallback through the main backend, so this feature works with:

```bash
npm run backend
```

Build the package service Docker image:

```bash
docker build -t hiresphere-package-service:latest services/package-service
```

Apply Kubernetes deployment:

```bash
kubectl apply -f services/package-service/k8s-deployment.yaml
```

Sample package SQL:

```sql
INSERT INTO interview_packages
(interviewer_id, package_name, description, domain, interview_type, session_count,
 duration_minutes_per_session, total_price, currency, discount_percentage, is_active)
VALUES
(1, 'Backend Interview Sprint', 'Three backend interview sessions with code and system design practice.',
 'Backend', 'System Design', 3, 60, 120.00, 'USD', 10.00, 1);
```

Package feature report summary:

```txt
The Bundled Interview Packages feature allows interviewers to sell multi-session interview preparation packages. Interviewers can create, update, view, and deactivate packages with session count, duration, price, discount, domain, and interview type. Candidates can browse active packages, filter by domain and interview type, book packages, and track used and remaining sessions. The backend uses Express and MySQL with prepared statements, ownership checks, session usage tracking, and automatic completion when remaining sessions reach zero.
```

## Structured Evaluation Reports Feature

Interviewers can create structured reports after mock interviews, and candidates can view their reports.

Evaluation endpoints:

```txt
POST /evaluations
GET  /evaluations/candidate/:candidateId
GET  /evaluations/interviewer/:interviewerId
GET  /evaluations/booking/:bookingId
PUT  /evaluations/:evaluationId
```

Recommendation values:

```txt
Strong Hire
Hire
Needs Improvement
Not Ready
```

Run the optional evaluation microservice:

```bash
cd services/evaluation-service
npm install
cd ../..
npm run evaluations:dev
```

The app also includes a fallback through the main backend, so this feature works with:

```bash
npm run backend
```

Build the evaluation service Docker image:

```bash
docker build -t hiresphere-evaluation-service:latest services/evaluation-service
```

Apply Kubernetes deployment:

```bash
kubectl apply -f services/evaluation-service/k8s-deployment.yaml
```

Sample evaluation report SQL:

```sql
INSERT INTO evaluation_reports
(booking_id, candidate_id, interviewer_id, technical_score, communication_score,
 problem_solving_score, coding_score, system_design_score, behavioral_score,
 overall_score, strengths, improvement_areas, interviewer_comments, recommendation)
VALUES
(1, 1, 1, 4, 4, 5, 4, 3, 4, 4.00,
 'Strong API fundamentals.',
 'Improve scalability trade-off explanations.',
 'Candidate communicated confidently.',
 'Hire');
```

Evaluation report feature summary:

```txt
The Structured Evaluation Reports feature allows interviewers to create detailed post-interview feedback using six score categories: technical, communication, problem solving, coding, system design, and behavioral. The backend calculates the overall score automatically and enforces one report per booking. Candidates can view their recommendation, category scores, strengths, improvement areas, and interviewer comments. The feature uses Express APIs, MySQL prepared statements, ownership validation, and a React report card interface.
```

## Success and Error Messages

The system uses SweetAlert messages.

Success examples:

```txt
Booking successful
Submission uploaded
Slot added
Pricing created
Booking accepted
Evaluation published
```

Error examples:

```txt
Create failed
Upload failed
Booking failed
Failed to fetch
```

## Useful Commands

Install root dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Run main backend:

```bash
npm run backend
```

Run live session service:

```bash
npm run live:dev
```

Run messaging service:

```bash
npm run messages:dev
```

Run interviewer pricing service, optional:

```bash
npm run interviewer:dev
```

Build frontend:

```bash
npm run build
```

## Docker Commands

Build interviewer service image:

```bash
docker build -t hiresphere-interviewer-service:latest services/interviewer-service
```

Run interviewer service container:

```bash
docker run -p 7300:7300 --env-file services/interviewer-service/.env hiresphere-interviewer-service:latest
```

## Kubernetes

Interviewer service deployment file:

```txt
services/interviewer-service/k8s-deployment.yaml
```

Apply deployment:

```bash
kubectl apply -f services/interviewer-service/k8s-deployment.yaml
```

## Sample Pricing SQL

```sql
INSERT INTO interviewer_pricing
(interviewer_id, interview_type, domain, duration_minutes, price, currency, is_active)
VALUES
(1, 'DSA', 'Backend', 60, 45.00, 'USD', 1);
```

## Assignment Report Summary

HireSphere is a cloud-based interview management platform built using React, Node.js Express, and MySQL. The system supports two main user roles: candidates and interviewers. Candidates can search interviewers, book interview sessions, upload submissions, join live interviews, and view evaluation results. Interviewers can manage availability, set session pricing, approve or reject booking requests, communicate with candidates, and publish evaluations. The application also includes messaging and live session services to support realtime communication and interview collaboration.
