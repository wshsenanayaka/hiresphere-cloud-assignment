const pool = require('../config/db');

async function getBookingColumns(connection) {
  const [columns] = await connection.execute('SHOW COLUMNS FROM bookings');
  return new Set(columns.map((column) => column.Field));
}

async function getInterviewerDetails(connection, interviewerId) {
  const [rows] = await connection.execute('SELECT domain, interview_type FROM interviewers WHERE id = ?', [interviewerId]);
  return rows[0] || {};
}

function splitBookingDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const [datePart = value, timePart = '00:00:00'] = String(value).split(/[T ]/);
    return {
      scheduledDate: datePart,
      scheduledTime: timePart.length === 5 ? `${timePart}:00` : timePart,
    };
  }

  return {
    scheduledDate: date.toISOString().slice(0, 10),
    scheduledTime: date.toTimeString().slice(0, 8),
  };
}

async function createBooking(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { candidateId, interviewerId, availabilitySlotId, bookingDate, meetingLink } = req.body;

    if (!candidateId || !interviewerId || !bookingDate) {
      return res.status(400).json({ error: 'candidateId, interviewerId, and bookingDate are required' });
    }

    await connection.beginTransaction();

    const bookingColumns = await getBookingColumns(connection);
    const interviewer = await getInterviewerDetails(connection, interviewerId);
    const { scheduledDate, scheduledTime } = splitBookingDate(bookingDate);
    const fields = ['candidate_id', 'interviewer_id', 'availability_slot_id', 'booking_date', 'status', 'meeting_link'];
    const values = [candidateId, interviewerId, availabilitySlotId || null, bookingDate, 'PENDING', meetingLink || null];

    if (bookingColumns.has('scheduled_date')) {
      fields.push('scheduled_date');
      values.push(scheduledDate);
    }

    if (bookingColumns.has('scheduled_time')) {
      fields.push('scheduled_time');
      values.push(scheduledTime);
    }

    if (bookingColumns.has('interview_type')) {
      fields.push('interview_type');
      values.push(interviewer.interview_type || 'General Interview');
    }

    if (bookingColumns.has('domain')) {
      fields.push('domain');
      values.push(interviewer.domain || 'General');
    }

    if (bookingColumns.has('price')) {
      fields.push('price');
      values.push(45);
    }

    const [result] = await connection.execute(
      `INSERT INTO bookings (${fields.join(', ')})
       VALUES (${fields.map(() => '?').join(', ')})`,
      values,
    );

    if (availabilitySlotId) {
      await connection.execute('UPDATE availability_slots SET status = ? WHERE id = ?', ['booked', availabilitySlotId]);
    }

    await connection.commit();
    res.status(201).json({ id: result.insertId, candidateId, interviewerId, bookingDate, status: 'PENDING' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listCandidateBookings(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, i.name AS interviewer_name, i.domain, i.interview_type,
              s.file_name AS submission_file_name,
              e.feedback AS evaluation_feedback,
              e.score AS evaluation_score
       FROM bookings b
       JOIN interviewers i ON i.id = b.interviewer_id
       LEFT JOIN submissions s ON s.booking_id = b.id
       LEFT JOIN evaluations e ON e.booking_id = b.id
       WHERE b.candidate_id = ?
       ORDER BY b.booking_date DESC`,
      [req.params.candidateId],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function listInterviewerBookings(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, u.name AS candidate_name, i.name AS interviewer_name,
              s.file_name AS submission_file_name,
              e.feedback AS evaluation_feedback,
              e.score AS evaluation_score
       FROM bookings b
       JOIN users u ON u.id = b.candidate_id
       JOIN interviewers i ON i.id = b.interviewer_id
       LEFT JOIN submissions s ON s.booking_id = b.id
       LEFT JOIN evaluations e ON e.booking_id = b.id
       WHERE b.interviewer_id = ?
       ORDER BY b.booking_date DESC`,
      [req.params.interviewerId],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const { status, rejectionReason = null } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const bookingColumns = await getBookingColumns(pool);
    const fields = ['status = ?'];
    const values = [status];

    if (bookingColumns.has('rejection_reason')) {
      fields.push('rejection_reason = ?');
      values.push(rejectionReason);
    }

    values.push(req.params.bookingId);

    const [result] = await pool.execute(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, values);

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ id: Number(req.params.bookingId), status });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  listCandidateBookings,
  listInterviewerBookings,
  updateBookingStatus,
};
