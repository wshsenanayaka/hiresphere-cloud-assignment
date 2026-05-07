const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_CHANGES'];
const SEVERITIES = ['INFO', 'SUGGESTION', 'WARNING', 'CRITICAL'];

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getColumns(tableName) {
  const [columns] = await pool.execute(`SHOW COLUMNS FROM ${tableName}`);
  return new Set(columns.map((column) => column.Field));
}

async function ensureReviewTables() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      candidate_id INT NOT NULL,
      interviewer_id INT NULL,
      title VARCHAR(180),
      github_link VARCHAR(255),
      file_url VARCHAR(255),
      submission_type VARCHAR(40) DEFAULT 'FILE',
      status ENUM('SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_CHANGES') NOT NULL DEFAULT 'SUBMITTED',
      file_name VARCHAR(255),
      file_path VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  );

  const columns = await getColumns('submissions');
  const alters = [
    ['interviewer_id', 'ALTER TABLE submissions ADD COLUMN interviewer_id INT NULL'],
    ['title', 'ALTER TABLE submissions ADD COLUMN title VARCHAR(180) NULL'],
    ['github_link', 'ALTER TABLE submissions ADD COLUMN github_link VARCHAR(255) NULL'],
    ['file_url', 'ALTER TABLE submissions ADD COLUMN file_url VARCHAR(255) NULL'],
    ['submission_type', "ALTER TABLE submissions ADD COLUMN submission_type VARCHAR(40) DEFAULT 'FILE'"],
    ['status', "ALTER TABLE submissions ADD COLUMN status ENUM('SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_CHANGES') NOT NULL DEFAULT 'SUBMITTED'"],
    ['updated_at', 'ALTER TABLE submissions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ];

  for (const [column, sql] of alters) {
    if (!columns.has(column)) {
      await pool.execute(sql);
    }
  }

  await pool.execute(
    `UPDATE submissions s
     JOIN bookings b ON b.id = s.booking_id
     SET
       s.interviewer_id = COALESCE(s.interviewer_id, b.interviewer_id),
       s.title = COALESCE(s.title, s.file_name, 'Candidate submission'),
       s.file_url = COALESCE(s.file_url, s.file_path),
       s.submission_type = COALESCE(s.submission_type, 'FILE')
     WHERE s.id IS NOT NULL`,
  );

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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_submission_annotations_submission_backend
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      CONSTRAINT fk_submission_annotations_interviewer_backend
        FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE
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
  await ensureReviewTables();
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

  const filename = path.basename(fileUrl);
  const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 250000) return 'File is too large to preview.';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function listInterviewerSubmissions(req, res, next) {
  try {
    await ensureReviewTables();
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
}

async function listCandidateSubmissions(req, res, next) {
  try {
    await ensureReviewTables();
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
}

async function getSubmission(req, res, next) {
  try {
    const submission = await getSubmissionById(req.params.submissionId);
    if (!submission) throw createHttpError(404, 'Submission not found.');
    res.json({ success: true, submission: normalizeSubmission(submission, tryReadLocalContent(submission.file_url || submission.file_path)) });
  } catch (error) {
    next(error);
  }
}

async function updateSubmissionStatus(req, res, next) {
  try {
    const { interviewerId, status } = req.body;
    const submission = await getSubmissionById(req.params.submissionId);
    if (!submission) throw createHttpError(404, 'Submission not found.');
    if (Number(interviewerId) !== Number(submission.interviewer_id)) {
      throw createHttpError(403, 'Only the assigned interviewer can update this submission.');
    }
    if (!STATUSES.includes(status)) throw createHttpError(400, 'Invalid submission status.');
    await pool.execute('UPDATE submissions SET status = ? WHERE id = ?', [status, submission.id]);
    const updatedSubmission = await getSubmissionById(submission.id);
    res.json({ success: true, message: 'Submission status updated.', submission: normalizeSubmission(updatedSubmission) });
  } catch (error) {
    next(error);
  }
}

async function createAnnotation(req, res, next) {
  try {
    const submission = await getSubmissionById(req.params.submissionId);
    if (!submission) throw createHttpError(404, 'Submission not found.');
    const { interviewerId, lineNumber = null, selectedText = '', comment, severity = 'INFO' } = req.body;
    if (Number(interviewerId) !== Number(submission.interviewer_id)) {
      throw createHttpError(403, 'Only the assigned interviewer can annotate this submission.');
    }
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
}

async function listAnnotations(req, res, next) {
  try {
    await ensureReviewTables();
    const [rows] = await pool.execute(
      'SELECT * FROM submission_annotations WHERE submission_id = ? ORDER BY COALESCE(line_number, 999999), created_at DESC',
      [req.params.submissionId],
    );
    res.json({ success: true, annotations: rows.map(normalizeAnnotation) });
  } catch (error) {
    next(error);
  }
}

async function updateAnnotation(req, res, next) {
  try {
    await ensureReviewTables();
    const [rows] = await pool.execute('SELECT * FROM submission_annotations WHERE id = ?', [req.params.annotationId]);
    const annotation = rows[0];
    if (!annotation) throw createHttpError(404, 'Annotation not found.');
    const { interviewerId, lineNumber = annotation.line_number, selectedText = annotation.selected_text, comment = annotation.comment, severity = annotation.severity } = req.body;
    if (Number(interviewerId) !== Number(annotation.interviewer_id)) {
      throw createHttpError(403, 'Only the assigned interviewer can update this annotation.');
    }
    if (!comment?.trim()) throw createHttpError(400, 'comment is required.');
    if (!SEVERITIES.includes(severity)) throw createHttpError(400, 'Invalid severity.');
    await pool.execute(
      'UPDATE submission_annotations SET line_number = ?, selected_text = ?, comment = ?, severity = ? WHERE id = ?',
      [lineNumber || null, selectedText || null, comment.trim(), severity, annotation.id],
    );
    const [updatedRows] = await pool.execute('SELECT * FROM submission_annotations WHERE id = ?', [annotation.id]);
    res.json({ success: true, message: 'Annotation updated.', annotation: normalizeAnnotation(updatedRows[0]) });
  } catch (error) {
    next(error);
  }
}

async function deleteAnnotation(req, res, next) {
  try {
    await ensureReviewTables();
    const [rows] = await pool.execute('SELECT * FROM submission_annotations WHERE id = ?', [req.params.annotationId]);
    const annotation = rows[0];
    if (!annotation) throw createHttpError(404, 'Annotation not found.');
    const interviewerId = req.body.interviewerId || req.query.interviewerId;
    if (Number(interviewerId) !== Number(annotation.interviewer_id)) {
      throw createHttpError(403, 'Only the assigned interviewer can delete this annotation.');
    }
    await pool.execute('DELETE FROM submission_annotations WHERE id = ?', [annotation.id]);
    res.json({ success: true, message: 'Annotation deleted.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ensureReviewTables,
  listInterviewerSubmissions,
  listCandidateSubmissions,
  getSubmission,
  updateSubmissionStatus,
  createAnnotation,
  listAnnotations,
  updateAnnotation,
  deleteAnnotation,
};
