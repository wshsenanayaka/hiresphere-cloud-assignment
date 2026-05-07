const pool = require('../config/db');

async function createEvaluation(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { candidateId, bookingId, interviewerId, score, feedback, recommendation } = req.body;

    if (!candidateId || !bookingId || !interviewerId || score === undefined || !feedback) {
      return res.status(400).json({
        error: 'candidateId, bookingId, interviewerId, score, and feedback are required',
      });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO evaluations (candidate_id, booking_id, interviewer_id, score, feedback, recommendation)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [candidateId, bookingId, interviewerId, score, feedback, recommendation || null],
    );

    await connection.execute('UPDATE bookings SET status = ? WHERE id = ?', ['evaluated', bookingId]);
    await connection.commit();

    res.status(201).json({ id: result.insertId, candidateId, bookingId, score, recommendation });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function listCandidateEvaluations(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, i.name AS interviewer_name, b.booking_date
       FROM evaluations e
       JOIN interviewers i ON i.id = e.interviewer_id
       JOIN bookings b ON b.id = e.booking_id
       WHERE e.candidate_id = ?
       ORDER BY e.created_at DESC`,
      [req.params.candidateId],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvaluation,
  listCandidateEvaluations,
};
