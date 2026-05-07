const pool = require('../config/db');

async function uploadSubmission(req, res, next) {
  try {
    const { candidateId, bookingId, notes } = req.body;

    if (!candidateId || !bookingId || !req.file) {
      return res.status(400).json({ error: 'candidateId, bookingId, and submission file are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO submissions (candidate_id, booking_id, file_name, file_path, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [candidateId, bookingId, req.file.originalname, `/uploads/${req.file.filename}`, notes || null],
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
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, b.booking_date, b.status AS booking_status
       FROM submissions s
       JOIN bookings b ON b.id = s.booking_id
       WHERE s.candidate_id = ?
       ORDER BY s.created_at DESC`,
      [req.params.candidateId],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCandidateSubmissions,
  uploadSubmission,
};
