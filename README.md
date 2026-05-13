# HireSphere Cloud Interview Platform

HireSphere is a cloud-based interview management platform for mock interview workflows. Candidates can search interviewers, book sessions, upload submissions, chat, join live interviews, buy bundled packages, and view feedback. Interviewers can manage availability, set pricing, approve bookings, annotate submissions, create packages, and publish structured evaluation reports.

## Tech Stack

- Frontend: React with Vite
- Backend: Node.js Express
- Database: MySQL
- Realtime messaging: Socket.IO
- File storage: Local uploads for assignment testing
- Optional services: booking, messaging, live session, interviewer pricing, submission review, package, evaluation

## Run Locally

Use these commands for the normal local setup:

```bash
npm run dev
npm run backend
npm run live:dev
npm run messages:dev
```

Open:

```txt
http://127.0.0.1:5173
```

Most new assignment features also work through the main backend at:

```txt
http://localhost:5000
```

So the optional microservices are not required for local testing unless you specifically want to run them separately.

## Optional Microservices

Install and run any optional service:

```bash
cd services/<service-name>
npm install
cd ../..
npm run <script-name>
```

Available scripts:

```bash
npm run booking:dev
npm run interviewer:dev
npm run submissions:dev
npm run packages:dev
npm run evaluations:dev
```

## User Flow

1. Start the app and backend services.
2. Open the frontend URL.
3. Select `Candidate` or `Interviewer`.
4. Login or sign up.
5. Use the dashboard for the selected role.

## Candidate Features

Candidates can:

- Search interviewers
- Book interviews
- Upload submissions
- View booking history
- View submission feedback
- View structured evaluation reports
- Browse and buy interview packages
- Track purchased package sessions
- Message interviewers
- Join live interviews

Candidate booking flow:

```txt
Login
-> Candidate Dashboard
-> Select Interviewer
-> Select Time Slot
-> Enter Challenge Title
-> Select Calendar
-> Select Payment Method
-> Pay and Book
-> Booking created as PENDING
-> Wait for interviewer approval
```

Candidate package flow:

```txt
Candidate Dashboard
-> Packages
-> Filter by domain or interview type
-> Select package
-> Book package
-> My packages
-> Track used and remaining sessions
```

Candidate feedback flow:

```txt
Candidate Dashboard
-> Feedback
-> View reviewed submissions
-> Read annotations and review status
```

Candidate report flow:

```txt
Candidate Dashboard
-> Reports
-> View score categories
-> Read strengths, improvement areas, comments, and recommendation
```

## Interviewer Features

Interviewers can:

- Add availability slots
- Set pricing per session
- Create bundled interview packages
- View booking requests
- Accept or reject bookings
- Review candidate submissions
- Add submission annotations
- Create structured evaluation reports
- Upload simple evaluations
- Message candidates
- Join live interviews

Availability flow:

```txt
Login
-> Interviewer Dashboard
-> Availability Management
-> Select Date
-> Select Time
-> Add Slot
```

Pricing flow:

```txt
Interviewer Dashboard
-> Set Pricing
-> Select interview type
-> Select domain
-> Enter duration
-> Enter price
-> Save pricing
```

Package flow:

```txt
Interviewer Dashboard
-> Packages
-> Create package
-> Enter package details
-> Save package
-> Candidates can book active packages
```

Submission annotation flow:

```txt
Interviewer Dashboard
-> Review submissions
-> Select candidate submission
-> View file or GitHub link
-> Add line/comment/severity annotation
-> Update review status
```

Structured evaluation flow:

```txt
Interviewer Dashboard
-> Evaluation reports
-> Select booking
-> Add category scores
-> Add strengths and improvement areas
-> Select recommendation
-> Create report
```

## Supported Values

Interview types:

```txt
DSA
System Design
Behavioral
```

Domains:

```txt
Backend
Frontend
DevOps
AI/ML
Mobile
```

Submission status:

```txt
SUBMITTED
UNDER_REVIEW
REVIEWED
NEEDS_CHANGES
```

Annotation severity:

```txt
INFO
SUGGESTION
WARNING
CRITICAL
```

Package payment status:

```txt
PENDING
PAID
FAILED
REFUNDED
```

Package booking status:

```txt
ACTIVE
COMPLETED
CANCELLED
```

Evaluation recommendations:

```txt
Strong Hire
Hire
Needs Improvement
Not Ready
```

## Kubernetes Deployment

The Kubernetes manifests are in `k8s/`. They create the `hiresphere` namespace, shared ConfigMap and Secret values, a MySQL Deployment with a persistent volume claim, Deployments for the backend services, ClusterIP Services for internal communication, a NodePort Service for the frontend, and an Ingress for path-based routing.

### Docker image build commands

Build the images before applying the Kubernetes files:

```bash
docker build -t hiresphere-backend:latest ./backend
docker build -t hiresphere-frontend:latest ./frontend
docker build -t hiresphere-interviewer-service:latest ./services/interviewer-service
docker build -t hiresphere-booking-service:latest ./services/booking-service
docker build -t hiresphere-submission-service:latest ./services/submission-service
docker build -t hiresphere-evaluation-service:latest ./services/evaluation-service
docker build -t hiresphere-messaging-service:latest ./services/messaging-service
docker build -t hiresphere-live-session-service:latest ./services/live-session-service
docker build -t hiresphere-package-service:latest ./services/package-service
```

For Minikube, build the images inside the Minikube Docker environment or load the images into Minikube before applying the manifests.

### Minikube testing commands

```bash
minikube start
minikube addons enable ingress
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
kubectl apply -R -f k8s/
kubectl get pods -n hiresphere
kubectl get svc -n hiresphere
minikube service frontend-service -n hiresphere
```

Apply the namespace first, then use the recursive `kubectl apply -R -f k8s/` command if your Kubernetes CLI does not apply YAML files inside subfolders.

### EKS deployment notes

For AWS EKS deployment, push the Docker images to AWS ECR, create an EKS cluster, update kubeconfig for the cluster, apply the `k8s/` manifests, and use the AWS Load Balancer Controller or another Ingress Controller to expose the application.

### Report explanation

Docker containers are deployed to Kubernetes as Pods. Kubernetes Deployments manage replicas and self-healing. Kubernetes Services provide internal communication between the frontend, backend services, and MySQL. Ingress/API Gateway provides external routing to the correct service path. For local testing, Minikube can be used. For cloud deployment, AWS EKS can be used.

## API Summary

Pricing:

```txt
POST   /pricing
GET    /pricing/interviewer/:interviewerId
GET    /pricing/interviewer/:interviewerId/active
PUT    /pricing/:pricingId
DELETE /pricing/:pricingId
```

Submissions and annotations:

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

Packages:

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

Structured evaluations:

```txt
POST /evaluations
GET  /evaluations/candidate/:candidateId
GET  /evaluations/interviewer/:interviewerId
GET  /evaluations/booking/:bookingId
PUT  /evaluations/:evaluationId
```

## Useful Commands

Install dependencies:

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

Run live service:

```bash
npm run live:dev
```

Run messaging service:

```bash
npm run messages:dev
```

Build frontend:

```bash
npm run build
```

## Docker Commands

Run the full Docker setup:

```bash
docker compose build
docker compose up -d
```

Stop containers:

```bash
docker compose down
```

View logs:

```bash
docker logs hiresphere-frontend
docker logs hiresphere-backend
docker logs hiresphere-booking-service
```

Build optional service images manually:

```bash
docker build -t hiresphere-interviewer-service:latest services/interviewer-service
docker build -t hiresphere-submission-service:latest services/submission-service
docker build -t hiresphere-package-service:latest services/package-service
docker build -t hiresphere-evaluation-service:latest services/evaluation-service
```

Common Docker notes:

- `node_modules`, `.env`, `.git`, and `*.log` files are ignored by Docker.
- If a port is already in use, stop the local process or change the port mapping in `docker-compose.yml`.
- MySQL uses a healthcheck before services start. If a service still starts too early, rerun it with `docker compose restart <service-name>`.
- The MySQL database is initialized from `docker/mysql/init.sql` on first volume creation.

## Kubernetes

Apply optional service deployments:

```bash
kubectl apply -f services/interviewer-service/k8s-deployment.yaml
kubectl apply -f services/submission-service/k8s-deployment.yaml
kubectl apply -f services/package-service/k8s-deployment.yaml
kubectl apply -f services/evaluation-service/k8s-deployment.yaml
```

## Sample SQL

Pricing:

```sql
INSERT INTO interviewer_pricing
(interviewer_id, interview_type, domain, duration_minutes, price, currency, is_active)
VALUES
(1, 'DSA', 'Backend', 60, 45.00, 'USD', 1);
```

Package:

```sql
INSERT INTO interview_packages
(interviewer_id, package_name, description, domain, interview_type, session_count,
 duration_minutes_per_session, total_price, currency, discount_percentage, is_active)
VALUES
(1, 'Backend Interview Sprint', 'Three backend interview sessions.',
 'Backend', 'System Design', 3, 60, 120.00, 'USD', 10.00, 1);
```

Submission annotation:

```sql
INSERT INTO submission_annotations
(submission_id, interviewer_id, line_number, selected_text, comment, severity)
VALUES
(1, 1, 12, 'pool.execute(...)', 'Good use of prepared statements.', 'INFO');
```

Structured evaluation report:

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

## Assignment Report Summary

HireSphere is a cloud-based interview management platform built with React, Node.js Express, and MySQL. The system supports candidate and interviewer workflows including booking, messaging, live interviews, pricing, bundled packages, submission annotations, and structured evaluation reports. The backend uses prepared SQL statements and assignment-friendly local storage. Optional microservices are provided for cloud deployment, while the main backend also exposes fallback routes for local testing.
