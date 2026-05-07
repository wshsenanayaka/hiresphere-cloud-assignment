const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7600;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';
const RECOMMENDATIONS = ['Strong Hire', 'Hire', 'Needs Improvement', 'Not Ready'];
const FIELDS = ['technicalScore', 'communicationScore', 'problemSolvingScore', 'codingScore', 'systemDesignScore', 'behavioralScore'];

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

function err(status, message) { const error = new Error(message); error.status = status; return error; }
async function ensureTable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS evaluation_reports (
    id INT AUTO_INCREMENT PRIMARY KEY, booking_id INT NOT NULL UNIQUE, candidate_id INT NOT NULL, interviewer_id INT NOT NULL,
    technical_score INT NOT NULL, communication_score INT NOT NULL, problem_solving_score INT NOT NULL, coding_score INT NOT NULL,
    system_design_score INT NOT NULL, behavioral_score INT NOT NULL, overall_score DECIMAL(4,2) NOT NULL,
    strengths TEXT, improvement_areas TEXT, interviewer_comments TEXT,
    recommendation ENUM('Strong Hire','Hire','Needs Improvement','Not Ready') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
}
function body(b) {
  return {
    bookingId: b.bookingId || b.booking_id, candidateId: b.candidateId || b.candidate_id, interviewerId: b.interviewerId || b.interviewer_id,
    technicalScore: b.technicalScore ?? b.technical_score, communicationScore: b.communicationScore ?? b.communication_score,
    problemSolvingScore: b.problemSolvingScore ?? b.problem_solving_score, codingScore: b.codingScore ?? b.coding_score,
    systemDesignScore: b.systemDesignScore ?? b.system_design_score, behavioralScore: b.behavioralScore ?? b.behavioral_score,
    strengths: b.strengths || '', improvementAreas: b.improvementAreas ?? b.improvement_areas ?? '',
    interviewerComments: b.interviewerComments ?? b.interviewer_comments ?? '', recommendation: b.recommendation,
  };
}
function validate(p) {
  for (const f of FIELDS) if (Number(p[f]) < 1 || Number(p[f]) > 5) throw err(400, 'Scores must be between 1 and 5.');
  if (!RECOMMENDATIONS.includes(p.recommendation)) throw err(400, 'Invalid recommendation.');
}
function overall(p) { return Number((FIELDS.reduce((s, f) => s + Number(p[f]), 0) / FIELDS.length).toFixed(2)); }
function norm(r) {
  return {
    id: r.id, bookingId: r.booking_id, candidateId: r.candidate_id, interviewerId: r.interviewer_id,
    technicalScore: r.technical_score, communicationScore: r.communication_score, problemSolvingScore: r.problem_solving_score,
    codingScore: r.coding_score, systemDesignScore: r.system_design_score, behavioralScore: r.behavioral_score,
    overallScore: Number(r.overall_score), strengths: r.strengths || '', improvementAreas: r.improvement_areas || '',
    interviewerComments: r.interviewer_comments || '', recommendation: r.recommendation, createdAt: r.created_at, updatedAt: r.updated_at,
    candidateName: r.candidate_name || '', interviewerName: r.interviewer_name || '',
  };
}
async function booking(id) { const [r] = await pool.execute('SELECT * FROM bookings WHERE id=?', [id]); return r[0]; }

app.get('/health', (req, res) => res.json({ success: true, service: 'hiresphere-evaluation-service' }));
app.post('/evaluations', async (req, res, next) => {
  try {
    await ensureTable(); const p = body(req.body); validate(p);
    const b = await booking(p.bookingId); if (!b) throw err(404, 'Booking not found.');
    if (Number(b.interviewer_id) !== Number(p.interviewerId)) throw err(403, 'Only assigned interviewer can create report.');
    const [ex] = await pool.execute('SELECT id FROM evaluation_reports WHERE booking_id=?', [p.bookingId]);
    if (ex.length) throw err(409, 'One booking can have only one evaluation report.');
    const [result] = await pool.execute(`INSERT INTO evaluation_reports (booking_id,candidate_id,interviewer_id,technical_score,communication_score,problem_solving_score,coding_score,system_design_score,behavioral_score,overall_score,strengths,improvement_areas,interviewer_comments,recommendation) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [p.bookingId, p.candidateId, p.interviewerId, p.technicalScore, p.communicationScore, p.problemSolvingScore, p.codingScore, p.systemDesignScore, p.behavioralScore, overall(p), p.strengths, p.improvementAreas, p.interviewerComments, p.recommendation]);
    const [rows] = await pool.execute('SELECT * FROM evaluation_reports WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Evaluation report created.', report: norm(rows[0]) });
  } catch (e) { next(e); }
});
app.get('/evaluations/candidate/:candidateId', async (req, res, next) => { try { await ensureTable(); const [r] = await pool.execute('SELECT * FROM evaluation_reports WHERE candidate_id=? ORDER BY created_at DESC', [req.params.candidateId]); res.json({ success: true, reports: r.map(norm) }); } catch (e) { next(e); } });
app.get('/evaluations/interviewer/:interviewerId', async (req, res, next) => { try { await ensureTable(); const [r] = await pool.execute('SELECT * FROM evaluation_reports WHERE interviewer_id=? ORDER BY created_at DESC', [req.params.interviewerId]); res.json({ success: true, reports: r.map(norm) }); } catch (e) { next(e); } });
app.get('/evaluations/booking/:bookingId', async (req, res, next) => { try { await ensureTable(); const [r] = await pool.execute('SELECT * FROM evaluation_reports WHERE booking_id=?', [req.params.bookingId]); if (!r[0]) throw err(404, 'Evaluation report not found.'); res.json({ success: true, report: norm(r[0]) }); } catch (e) { next(e); } });
app.put('/evaluations/:evaluationId', async (req, res, next) => {
  try {
    await ensureTable(); const [rows] = await pool.execute('SELECT * FROM evaluation_reports WHERE id=?', [req.params.evaluationId]); const old = rows[0]; if (!old) throw err(404, 'Evaluation report not found.');
    const p = { ...body(req.body), bookingId: old.booking_id, candidateId: old.candidate_id, interviewerId: req.body.interviewerId || old.interviewer_id };
    for (const [k, col] of [['technicalScore','technical_score'],['communicationScore','communication_score'],['problemSolvingScore','problem_solving_score'],['codingScore','coding_score'],['systemDesignScore','system_design_score'],['behavioralScore','behavioral_score']]) p[k] ??= old[col];
    p.recommendation ||= old.recommendation; validate(p);
    if (Number(p.interviewerId) !== Number(old.interviewer_id)) throw err(403, 'Only assigned interviewer can update report.');
    await pool.execute(`UPDATE evaluation_reports SET technical_score=?,communication_score=?,problem_solving_score=?,coding_score=?,system_design_score=?,behavioral_score=?,overall_score=?,strengths=?,improvement_areas=?,interviewer_comments=?,recommendation=? WHERE id=?`,
      [p.technicalScore,p.communicationScore,p.problemSolvingScore,p.codingScore,p.systemDesignScore,p.behavioralScore,overall(p),p.strengths,p.improvementAreas,p.interviewerComments,p.recommendation,old.id]);
    const [updated] = await pool.execute('SELECT * FROM evaluation_reports WHERE id=?', [old.id]); res.json({ success: true, message: 'Evaluation report updated.', report: norm(updated[0]) });
  } catch (e) { next(e); }
});
app.use((e, req, res, next) => { console.error(e); res.status(e.status || 500).json({ success: false, error: e.message || 'Internal server error' }); });
app.listen(port, () => console.log(`Evaluation service running on http://localhost:${port}`));
