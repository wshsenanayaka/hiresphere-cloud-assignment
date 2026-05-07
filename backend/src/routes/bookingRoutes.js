const express = require('express');
const {
  createBooking,
  listCandidateBookings,
  listInterviewerBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');

const router = express.Router();

router.post('/', createBooking);
router.get('/candidate/:candidateId', listCandidateBookings);
router.get('/interviewer/:interviewerId', listInterviewerBookings);
router.put('/:bookingId/status', updateBookingStatus);

module.exports = router;
