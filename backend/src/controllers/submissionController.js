const pool = require('../config/db');
const {
  ensureReviewTables,
  listCandidateSubmissions: listCandidateReviewedSubmissions,
} = require('./submissionReviewController');

async function uploadSubmission(req, res, next) {
  try {
    const { candidateId, bookingId, notes } = req.body;

    if (!candidateId || !bookingId || !req.file) {
      return res.status(400).json({ error: 'candidateId, bookingId, and submission file are required' });
    }

    await ensureReviewTables();

    const [bookings] = await pool.execute('SELECT interviewer_id FROM bookings WHERE id = ?', [bookingId]);
    const interviewerId = bookings[0]?.interviewer_id || null;

    const [result] = await pool.execute(
      `INSERT INTO submissions
       (candidate_id, booking_id, interviewer_id, title, file_url, submission_type, status, file_name, file_path, notes)
       VALUES (?, ?, ?, ?, ?, 'FILE', 'SUBMITTED', ?, ?, ?)`,
      [
        candidateId,
        bookingId,
        interviewerId,
        req.file.originalname,
        `/uploads/${req.file.filename}`,
        req.file.originalname,
        `/uploads/${req.file.filename}`,
        notes || null,
      ],
    );

    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', ['submitted', bookingId]);

    res.status(201).json({
      id: result.insertId,
      candidateId: Number(candidateId),
      bookingId: Number(bookingId),
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    next(error);
  }
}

async function listCandidateSubmissions(req, res, next) {
  return listCandidateReviewedSubmissions(req, res, next);
}

module.exports = {
  listCandidateSubmissions,
  uploadSubmission,
};
