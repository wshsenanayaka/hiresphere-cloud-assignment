const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7200;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'];

function normalizeBooking(row) {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    candidateName: row.candidate_name,
    interviewerId: row.interviewer_id,
    interviewerName: row.interviewer_name,
    scheduledDate: row.scheduled_date || row.booking_date?.toISOString?.().slice(0, 10) || String(row.booking_date || '').slice(0, 10),
    scheduledTime: row.scheduled_time || row.booking_date?.toTimeString?.().slice(0, 8) || String(row.booking_date || '').slice(11, 19),
    interviewType: row.interview_type || 'General Interview',
    domain: row.domain || 'General',
    price: Number(row.price || 0),
    status: String(row.status || '').toLowerCase() === 'booked' ? 'PENDING' : row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getBookingById(bookingId) {
  const [rows] = await pool.execute(
    `SELECT b.*, candidate.name AS candidate_name, interviewer_user.name AS interviewer_name
     FROM bookings b
     JOIN users candidate ON candidate.id = b.candidate_id
     JOIN interviewers i ON i.id = b.interviewer_id
     JOIN users interviewer_user ON interviewer_user.id = i.user_id
     WHERE b.id = ?`,
    [bookingId],
  );

  return rows[0] || null;
}

async function listBookingsByInterviewer(interviewerId, onlyPending = false) {
  const params = [interviewerId];
  let statusFilter = '';

  if (onlyPending) {
    statusFilter = 'AND (UPPER(b.status) = ? OR LOWER(b.status) = ?)';
    params.push('PENDING');
    params.push('booked');
  }

  const [rows] = await pool.execute(
    `SELECT b.*, candidate.name AS candidate_name, interviewer_user.name AS interviewer_name
     FROM bookings b
     JOIN users candidate ON candidate.id = b.candidate_id
     JOIN interviewers i ON i.id = b.interviewer_id
     JOIN users interviewer_user ON interviewer_user.id = i.user_id
     WHERE b.interviewer_id = ?
     ${statusFilter}
     ORDER BY b.scheduled_date ASC, b.scheduled_time ASC, b.created_at DESC`,
    params,
  );

  return rows.map(normalizeBooking);
}

async function listBookingsByCandidate(candidateId) {
  const [rows] = await pool.execute(
    `SELECT b.*, candidate.name AS candidate_name, interviewer_user.name AS interviewer_name
     FROM bookings b
     JOIN users candidate ON candidate.id = b.candidate_id
     JOIN interviewers i ON i.id = b.interviewer_id
     JOIN users interviewer_user ON interviewer_user.id = i.user_id
     WHERE b.candidate_id = ?
     ORDER BY b.scheduled_date ASC, b.scheduled_time ASC, b.created_at DESC`,
    [candidateId],
  );

  return rows.map(normalizeBooking);
}

async function updateBookingStatus({ bookingId, interviewerId, status, rejectionReason = null }) {
  if (!interviewerId) {
    throw createHttpError(400, 'interviewerId is required.');
  }

  if (!BOOKING_STATUSES.includes(status)) {
    throw createHttpError(400, 'Invalid booking status.');
  }

  const booking = await getBookingById(bookingId);

  if (!booking) {
    throw createHttpError(404, 'Booking request not found.');
  }

  if (Number(booking.interviewer_id) !== Number(interviewerId)) {
    throw createHttpError(403, 'Only the assigned interviewer can update this booking.');
  }

  const currentStatus = String(booking.status || '').toUpperCase();

  if (currentStatus !== 'PENDING' && currentStatus !== 'BOOKED') {
    throw createHttpError(409, 'Only PENDING bookings can be accepted or rejected.');
  }

  await pool.execute(
    `UPDATE bookings
     SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, rejectionReason, bookingId],
  );

  const updatedBooking = await getBookingById(bookingId);
  return normalizeBooking(updatedBooking);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hiresphere-booking-service' });
});

app.get('/bookings/interviewer/:interviewerId/pending', async (req, res, next) => {
  try {
    const bookings = await listBookingsByInterviewer(req.params.interviewerId, true);
    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

app.get('/bookings/interviewer/:interviewerId', async (req, res, next) => {
  try {
    const bookings = await listBookingsByInterviewer(req.params.interviewerId);
    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

app.get('/bookings/candidate/:candidateId', async (req, res, next) => {
  try {
    const bookings = await listBookingsByCandidate(req.params.candidateId);
    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

app.put('/bookings/:bookingId/accept', async (req, res, next) => {
  try {
    const booking = await updateBookingStatus({
      bookingId: req.params.bookingId,
      interviewerId: req.body.interviewerId,
      status: 'ACCEPTED',
    });

    res.json({ success: true, message: 'Booking accepted successfully.', booking });
  } catch (error) {
    next(error);
  }
});

app.put('/bookings/:bookingId/reject', async (req, res, next) => {
  try {
    const booking = await updateBookingStatus({
      bookingId: req.params.bookingId,
      interviewerId: req.body.interviewerId,
      status: 'REJECTED',
      rejectionReason: req.body.rejectionReason || null,
    });

    res.json({ success: true, message: 'Booking rejected successfully.', booking });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Booking service running on http://localhost:${port}`);
});
