const express = require('express');
const { createEvaluation, listCandidateEvaluations } = require('../controllers/evaluationController');
const {
  createEvaluationReport,
  listCandidateReports,
  listInterviewerReports,
  getBookingReport,
  updateEvaluationReport,
} = require('../controllers/evaluationReportController');

const router = express.Router();

router.post('/', createEvaluationReport);
router.post('/simple', createEvaluation);
router.get('/candidate/:candidateId', listCandidateReports);
router.get('/legacy/candidate/:candidateId', listCandidateEvaluations);
router.get('/interviewer/:interviewerId', listInterviewerReports);
router.get('/booking/:bookingId', getBookingReport);
router.put('/:evaluationId', updateEvaluationReport);

module.exports = router;
