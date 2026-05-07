# HireSphere Express API

## Setup

1. Create the MySQL database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Run that command from the `backend` folder. From the project root, use:

```bash
mysql -u root -p < backend/database/schema.sql
```

2. Copy `backend/.env.example` to `backend/.env` and update the database credentials.

3. Run the API:

```bash
npm run server
```

The API starts on `http://localhost:5000` by default.

## Swagger / OpenAPI

The Swagger API document is available at:

```text
backend/docs/openapi.yaml
```

You can open it in Swagger Editor or import it into Postman.

## Folder Structure

```text
backend/
  index.js                 # Server entry point
  db.js                    # Backward-compatible DB export
  database/schema.sql      # MySQL schema
  src/
    app.js                 # Express app setup and middleware
    server.js              # Starts the HTTP server
    config/
      db.js                # MySQL connection pool
      env.js               # Environment variable config
    controllers/           # Request handlers and business logic
    middleware/            # Error handler and upload middleware
    routes/                # Express route definitions
    utils/                 # Shared helpers such as password hashing
```

## Endpoints

### Auth Service

- `POST /auth`

```json
{
  "mode": "signup",
  "name": "Demo Candidate",
  "email": "candidate@example.com",
  "password": "password123",
  "role": "candidate"
}
```

### Profile Service

- `POST /profiles`
- `GET /profiles/:userId`

```json
{
  "userId": 1,
  "fullName": "Demo Candidate",
  "phone": "0771234567",
  "domain": "Backend",
  "experienceYears": 2,
  "bio": "Node.js candidate",
  "resumeUrl": "https://example.com/resume.pdf"
}
```

### Interviewer Service

- `GET /interviewers`
- `GET /interviewers/search?domain=Backend&type=DSA`
- `POST /interviewers/availability`

```json
{
  "interviewerId": 1,
  "startTime": "2026-05-06 10:00:00",
  "endTime": "2026-05-06 11:00:00"
}
```

### Booking Service

- `POST /bookings`
- `GET /bookings/candidate/:candidateId`
- `GET /bookings/interviewer/:interviewerId`
- `PUT /bookings/:bookingId/status`

```json
{
  "candidateId": 1,
  "interviewerId": 1,
  "availabilitySlotId": 1,
  "bookingDate": "2026-05-06 10:00:00",
  "meetingLink": "https://meet.example.com/session"
}
```

### Submission Service

- `POST /submissions/upload`
- `GET /submissions/:candidateId`

Send `candidateId`, `bookingId`, optional `notes`, and a file field named `submission` as `multipart/form-data`.

### Evaluation Service

- `POST /evaluations`
- `GET /evaluations/candidate/:candidateId`

```json
{
  "candidateId": 1,
  "bookingId": 1,
  "interviewerId": 1,
  "score": 86,
  "feedback": "Strong API design and deployment explanation.",
  "recommendation": "shortlist"
}
```

### Messaging Service

- `POST /messages`
- `GET /messages/:bookingId`

```json
{
  "bookingId": 1,
  "senderId": 1,
  "receiverId": 2,
  "message": "I uploaded the submission."
}
```
