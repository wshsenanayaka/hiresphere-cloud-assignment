const express = require('express');
const { listCandidateSubmissions, uploadSubmission } = require('../controllers/submissionController');
const {
  listInterviewerSubmissions,
  getSubmission,
  updateSubmissionStatus,
  createAnnotation,
  listAnnotations,
} = require('../controllers/submissionReviewController');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/upload', upload.single('submission'), uploadSubmission);
router.get('/interviewer/:interviewerId', listInterviewerSubmissions);
router.get('/candidate/:candidateId', listCandidateSubmissions);
router.get('/:submissionId/annotations', listAnnotations);
router.post('/:submissionId/annotations', createAnnotation);
router.put('/:submissionId/status', updateSubmissionStatus);
router.get('/:submissionId', getSubmission);
router.get('/:candidateId', listCandidateSubmissions);

module.exports = router;
