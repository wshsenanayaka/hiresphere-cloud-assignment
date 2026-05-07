const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7400;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';
const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_CHANGES'];
const SEVERITIES = ['INFO', 'SUGGESTION', 'WARNING', 'CRITICAL'];

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function ensureTables() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS submission_annotations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      submission_id INT NOT NULL,
      interviewer_id INT NOT NULL,
      line_number INT NULL,
      selected_text TEXT,
      comment TEXT NOT NULL,
      severity ENUM('INFO', 'SUGGESTION', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  );
}

function normalizeSubmission(row, content = null) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    candidateId: row.candidate_id,
    interviewerId: row.interviewer_id,
    title: row.title || row.file_name || 'Candidate submission',
    githubLink: row.github_link || '',
    fileUrl: row.file_url || row.file_path || '',
    fileName: row.file_name || '',
    submissionType: row.submission_type || 'FILE',
    status: row.status || 'SUBMITTED',
    candidateName: row.candidate_name || '',
    interviewerName: row.interviewer_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    content,
  };
}

function normalizeAnnotation(row) {
  return {
    id: row.id,
    submissionId: row.submission_id,
    interviewerId: row.interviewer_id,
    lineNumber: row.line_number,
    selectedText: row.selected_text || '',
    comment: row.comment,
    severity: row.severity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getSubmissionById(submissionId) {
  const [rows] = await pool.execute(
    `SELECT s.*, candidate.name AS candidate_name, interviewer_user.name AS interviewer_name
     FROM submissions s
     JOIN users candidate ON candidate.id = s.candidate_id
     LEFT JOIN interviewers i ON i.id = s.interviewer_id
     LEFT JOIN users interviewer_user ON interviewer_user.id = i.user_id
     WHERE s.id = ?`,
    [submissionId],
  );
  return rows[0] || null;
}

function tryReadLocalContent(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return null;
  const filePath = path.join(__dirname, '..', '..', 'backend', 'uploads', path.basename(fileUrl));
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 250000) return 'File is too large to preview.';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'hiresphere-submission-service' });
});

app.get('/submissions/interviewer/:interviewerId', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute(
      `SELECT s.*, candidate.name AS candidate_name
       FROM submissions s
       JOIN users candidate ON candidate.id = s.candidate_id
       WHERE s.interviewer_id = ?
       ORDER BY s.created_at DESC`,
      [req.params.interviewerId],
    );
    res.json({ success: true, submissions: rows.map((row) => normalizeSubmission(row)) });
  } catch (error) {
    next(error);
  }
});

app.get('/submissions/candidate/:candidateId', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute(
      `SELECT s.*, interviewer_user.name AS interviewer_name
       FROM submissions s
       LEFT JOIN interviewers i ON i.id = s.interviewer_id
       LEFT JOIN users interviewer_user ON interviewer_user.id = i.user_id
       WHERE s.candidate_id = ? AND s.status IN ('REVIEWED', 'NEEDS_CHANGES', 'UNDER_REVIEW')
       ORDER BY s.created_at DESC`,
      [req.params.candidateId],
    );
    res.json({ success: true, submissions: rows.map((row) => normalizeSubmission(row)) });
  } catch (error) {
    next(error);
  }
});

app.get('/submissions/:submissionId', async (req, res, next) => {
  try {
    const submission = await getSubmissionById(req.params.submissionId);
    if (!submission) throw createHttpError(404, 'Submission not found.');
    res.json({ success: true, submission: normalizeSubmission(submission, tryReadLocalContent(submission.file_url || submission.file_path)) });
  } catch (error) {
    next(error);
  }
});

app.put('/submissions/:submissionId/status', async (req, res, next) => {
  try {
    const submission = await getSubmissionById(req.params.submissionId);
    if (!submission) throw createHttpError(404, 'Submission not found.');
    if (Number(req.body.interviewerId) !== Number(submission.interviewer_id)) throw createHttpError(403, 'Only the assigned interviewer can update this submission.');
    if (!STATUSES.includes(req.body.status)) throw createHttpError(400, 'Invalid submission status.');
    await pool.execute('UPDATE submissions SET status = ? WHERE id = ?', [req.body.status, submission.id]);
    const updated = await getSubmissionById(submission.id);
    res.json({ success: true, message: 'Submission status updated.', submission: normalizeSubmission(updated) });
  } catch (error) {
    next(error);
  }
});

app.post('/submissions/:submissionId/annotations', async (req, res, next) => {
  try {
    await ensureTables();
    const submission = await getSubmissionById(req.params.submissionId);
    if (!submission) throw createHttpError(404, 'Submission not found.');
    const { interviewerId, lineNumber = null, selectedText = '', comment, severity = 'INFO' } = req.body;
    if (Number(interviewerId) !== Number(submission.interviewer_id)) throw createHttpError(403, 'Only the assigned interviewer can annotate this submission.');
    if (!comment?.trim()) throw createHttpError(400, 'comment is required.');
    if (!SEVERITIES.includes(severity)) throw createHttpError(400, 'Invalid severity.');
    const [result] = await pool.execute(
      `INSERT INTO submission_annotations (submission_id, interviewer_id, line_number, selected_text, comment, severity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [submission.id, interviewerId, lineNumber || null, selectedText || null, comment.trim(), severity],
    );
    const [rows] = await pool.execute('SELECT * FROM submission_annotations WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Annotation added.', annotation: normalizeAnnotation(rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.get('/submissions/:submissionId/annotations', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute('SELECT * FROM submission_annotations WHERE submission_id = ? ORDER BY COALESCE(line_number, 999999), created_at DESC', [req.params.submissionId]);
    res.json({ success: true, annotations: rows.map(normalizeAnnotation) });
  } catch (error) {
    next(error);
  }
});

app.put('/annotations/:annotationId', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute('SELECT * FROM submission_annotations WHERE id = ?', [req.params.annotationId]);
    const annotation = rows[0];
    if (!annotation) throw createHttpError(404, 'Annotation not found.');
    if (Number(req.body.interviewerId) !== Number(annotation.interviewer_id)) throw createHttpError(403, 'Only the assigned interviewer can update this annotation.');
    const severity = req.body.severity || annotation.severity;
    if (!SEVERITIES.includes(severity)) throw createHttpError(400, 'Invalid severity.');
    const comment = req.body.comment ?? annotation.comment;
    if (!comment?.trim()) throw createHttpError(400, 'comment is required.');
    await pool.execute('UPDATE submission_annotations SET line_number = ?, selected_text = ?, comment = ?, severity = ? WHERE id = ?', [
      req.body.lineNumber || annotation.line_number || null,
      req.body.selectedText || annotation.selected_text || null,
      comment.trim(),
      severity,
      annotation.id,
    ]);
    const [updatedRows] = await pool.execute('SELECT * FROM submission_annotations WHERE id = ?', [annotation.id]);
    res.json({ success: true, message: 'Annotation updated.', annotation: normalizeAnnotation(updatedRows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete('/annotations/:annotationId', async (req, res, next) => {
  try {
    await ensureTables();
    const [rows] = await pool.execute('SELECT * FROM submission_annotations WHERE id = ?', [req.params.annotationId]);
    const annotation = rows[0];
    if (!annotation) throw createHttpError(404, 'Annotation not found.');
    const interviewerId = req.body.interviewerId || req.query.interviewerId;
    if (Number(interviewerId) !== Number(annotation.interviewer_id)) throw createHttpError(403, 'Only the assigned interviewer can delete this annotation.');
    await pool.execute('DELETE FROM submission_annotations WHERE id = ?', [annotation.id]);
    res.json({ success: true, message: 'Annotation deleted.' });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Submission service running on http://localhost:${port}`);
});
