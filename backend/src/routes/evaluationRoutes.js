const express = require('express');
const { createEvaluation, listCandidateEvaluations } = require('../controllers/evaluationController');

const router = express.Router();

router.post('/', createEvaluation);
router.get('/candidate/:candidateId', listCandidateEvaluations);

module.exports = router;
