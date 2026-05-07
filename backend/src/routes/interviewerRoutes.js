const express = require('express');
const {
  createAvailabilitySlot,
  listInterviewers,
  searchInterviewers,
} = require('../controllers/interviewerController');

const router = express.Router();

router.get('/', listInterviewers);
router.get('/search', searchInterviewers);
router.post('/availability', createAvailabilitySlot);

module.exports = router;
