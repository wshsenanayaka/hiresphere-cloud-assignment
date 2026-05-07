const express = require('express');
const {
  listInterviewerSubmissions,
  listCandidateSubmissions,
  getSubmission,
  updateSubmissionStatus,
  createAnnotation,
  listAnnotations,
  updateAnnotation,
  deleteAnnotation,
} = require('../controllers/submissionReviewController');

const router = express.Router();

router.get('/submissions/interviewer/:interviewerId', listInterviewerSubmissions);
router.get('/submissions/candidate/:candidateId', listCandidateSubmissions);
router.get('/submissions/:submissionId', getSubmission);
router.put('/submissions/:submissionId/status', updateSubmissionStatus);
router.post('/submissions/:submissionId/annotations', createAnnotation);
router.get('/submissions/:submissionId/annotations', listAnnotations);
router.put('/annotations/:annotationId', updateAnnotation);
router.delete('/annotations/:annotationId', deleteAnnotation);

module.exports = router;
