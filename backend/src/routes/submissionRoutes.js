const express = require('express');
const { listCandidateSubmissions, uploadSubmission } = require('../controllers/submissionController');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/upload', upload.single('submission'), uploadSubmission);
router.get('/:candidateId', listCandidateSubmissions);

module.exports = router;
