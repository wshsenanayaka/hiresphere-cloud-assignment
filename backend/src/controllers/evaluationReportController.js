const pool = require('../config/db');

const RECOMMENDATIONS = ['Strong Hire', 'Hire', 'Needs Improvement', 'Not Ready'];
const SCORE_FIELDS = [
  'technicalScore',
  'communicationScore',
  'problemSolvingScore',
  'codingScore',
  'systemDesignScore',
  'behavioralScore',
];

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function ensureEvaluationReportTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS evaluation_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL UNIQUE,
      candidate_id INT NOT NULL,
      interviewer_id INT NOT NULL,
      technical_score INT NOT NULL,
      communication_score INT NOT NULL,
      problem_solving_score INT NOT NULL,
      coding_score INT NOT NULL,
      system_design_score INT NOT NULL,
      behavioral_score INT NOT NULL,
      overall_score DECIMAL(4,2) NOT NULL,
      strengths TEXT,
      improvement_areas TEXT,
      interviewer_comments TEXT,
      recommendation ENUM('Strong Hire', 'Hire', 'Needs Improvement', 'Not Ready') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_evaluation_reports_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      CONSTRAINT fk_evaluation_reports_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_evaluation_reports_interviewer FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
    )`,
  );
}

function normalizeReport(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    candidateId: row.candidate_id,
    interviewerId: row.interviewer_id,
    candidateName: row.candidate_name || '',
    interviewerName: row.interviewer_name || '',
    technicalScore: row.technical_score,
    communicationScore: row.communication_score,
    problemSolvingScore: row.problem_solving_score,
    codingScore: row.coding_score,
    systemDesignScore: row.system_design_score,
    behavioralScore: row.behavioral_score,
    overallScore: Number(row.overall_score),
    strengths: row.strengths || '',
    improvementAreas: row.improvement_areas || '',
    interviewerComments: row.interviewer_comments || '',
    recommendation: row.recommendation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function payloadFromBody(body) {
  return {
    bookingId: body.bookingId || body.booking_id,
    candidateId: body.candidateId || body.candidate_id,
    interviewerId: body.interviewerId || body.interviewer_id,
    technicalScore: body.technicalScore ?? body.technical_score,
    communicationScore: body.communicationScore ?? body.communication_score,
    problemSolvingScore: body.problemSolvingScore ?? body.problem_solving_score,
    codingScore: body.codingScore ?? body.coding_score,
    systemDesignScore: body.systemDesignScore ?? body.system_design_score,
    behavioralScore: body.behavioralScore ?? body.behavioral_score,
    strengths: body.strengths || '',
    improvementAreas: body.improvementAreas ?? body.improvement_areas ?? '',
    interviewerComments: body.interviewerComments ?? body.interviewer_comments ?? '',
    recommendation: body.recommendation,
  };
}

function validateReport(payload, { partial = false } = {}) {
  const errors = [];
  if (!partial && !payload.bookingId) errors.push('booking_id is required.');
  if (!partial && !payload.candidateId) errors.push('candidate_id is required.');
  if (!partial && !payload.interviewerId) errors.push('interviewer_id is required.');
  for (const field of SCORE_FIELDS) {
    if (!partial || payload[field] !== undefined) {
      const score = Number(payload[field]);
      if (score < 1 || score > 5) errors.push(`${field} must be between 1 and 5.`);
    }
  }
  if (payload.recommendation && !RECOMMENDATIONS.includes(payload.recommendation)) {
    errors.push('Invalid recommendation.');
  }
  if (!partial && !payload.recommendation) errors.push('recommendation is required.');
  if (errors.length) throw createHttpError(400, errors.join(' '));
}

function calculateOverall(payload) {
  const total = SCORE_FIELDS.reduce((sum, field) => sum + Number(payload[field]), 0);
  return Number((total / SCORE_FIELDS.length).toFixed(2));
}

async function getBooking(bookingId) {
  const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
  return rows[0] || null;
}

async function createEvaluationReport(req, res, next) {
  try {
    await ensureEvaluationReportTable();
    const payload = payloadFromBody(req.body);
    validateReport(payload);
    const booking = await getBooking(payload.bookingId);
    if (!booking) throw createHttpError(404, 'Booking not found.');
    if (Number(booking.interviewer_id) !== Number(payload.interviewerId)) throw createHttpError(403, 'Only assigned interviewer can create report.');
    if (Number(booking.candidate_id) !== Number(payload.candidateId)) throw createHttpError(403, 'Candidate does not match booking.');
    const [existing] = await pool.execute('SELECT id FROM evaluation_reports WHERE booking_id = ?', [payload.bookingId]);
    if (existing.length) throw createHttpError(409, 'One booking can have only one evaluation report.');
    const overall = calculateOverall(payload);
    const [result] = await pool.execute(
      `INSERT INTO evaluation_reports
       (booking_id, candidate_id, interviewer_id, technical_score, communication_score, problem_solving_score,
        coding_score, system_design_score, behavioral_score, overall_score, strengths, improvement_areas,
        interviewer_comments, recommendation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payload.bookingId, payload.candidateId, payload.interviewerId, payload.technicalScore, payload.communicationScore,
        payload.problemSolvingScore, payload.codingScore, payload.systemDesignScore, payload.behavioralScore, overall,
        payload.strengths, payload.improvementAreas, payload.interviewerComments, payload.recommendation],
    );
    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', ['evaluated', payload.bookingId]);
    const [rows] = await pool.execute('SELECT * FROM evaluation_reports WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Evaluation report created.', report: normalizeReport(rows[0]) });
  } catch (error) {
    next(error);
  }
}

async function listCandidateReports(req, res, next) {
  try {
    await ensureEvaluationReportTable();
    const [rows] = await pool.execute(
      `SELECT r.*, i.name AS interviewer_name
       FROM evaluation_reports r
       JOIN interviewers i ON i.id = r.interviewer_id
       WHERE r.candidate_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.candidateId],
    );
    res.json({ success: true, reports: rows.map(normalizeReport) });
  } catch (error) { next(error); }
}

async function listInterviewerReports(req, res, next) {
  try {
    await ensureEvaluationReportTable();
    const [rows] = await pool.execute(
      `SELECT r.*, u.name AS candidate_name
       FROM evaluation_reports r
       JOIN users u ON u.id = r.candidate_id
       WHERE r.interviewer_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.interviewerId],
    );
    res.json({ success: true, reports: rows.map(normalizeReport) });
  } catch (error) { next(error); }
}

async function getBookingReport(req, res, next) {
  try {
    await ensureEvaluationReportTable();
    const [rows] = await pool.execute('SELECT * FROM evaluation_reports WHERE booking_id = ?', [req.params.bookingId]);
    if (!rows[0]) throw createHttpError(404, 'Evaluation report not found.');
    res.json({ success: true, report: normalizeReport(rows[0]) });
  } catch (error) { next(error); }
}

async function updateEvaluationReport(req, res, next) {
  try {
    await ensureEvaluationReportTable();
    const [rows] = await pool.execute('SELECT * FROM evaluation_reports WHERE id = ?', [req.params.evaluationId]);
    const report = rows[0];
    if (!report) throw createHttpError(404, 'Evaluation report not found.');
    const payload = { ...normalizeReport(report), ...payloadFromBody(req.body) };
    payload.bookingId = report.booking_id;
    payload.candidateId = report.candidate_id;
    payload.interviewerId = req.body.interviewerId || req.body.interviewer_id || report.interviewer_id;
    if (Number(payload.interviewerId) !== Number(report.interviewer_id)) throw createHttpError(403, 'Only assigned interviewer can update report.');
    validateReport(payload, { partial: true });
    const overall = calculateOverall(payload);
    await pool.execute(
      `UPDATE evaluation_reports
       SET technical_score = ?, communication_score = ?, problem_solving_score = ?, coding_score = ?,
           system_design_score = ?, behavioral_score = ?, overall_score = ?, strengths = ?,
           improvement_areas = ?, interviewer_comments = ?, recommendation = ?
       WHERE id = ?`,
      [payload.technicalScore, payload.communicationScore, payload.problemSolvingScore, payload.codingScore,
        payload.systemDesignScore, payload.behavioralScore, overall, payload.strengths, payload.improvementAreas,
        payload.interviewerComments, payload.recommendation, report.id],
    );
    const [updated] = await pool.execute('SELECT * FROM evaluation_reports WHERE id = ?', [report.id]);
    res.json({ success: true, message: 'Evaluation report updated.', report: normalizeReport(updated[0]) });
  } catch (error) { next(error); }
}

module.exports = {
  createEvaluationReport,
  listCandidateReports,
  listInterviewerReports,
  getBookingReport,
  updateEvaluationReport,
};
