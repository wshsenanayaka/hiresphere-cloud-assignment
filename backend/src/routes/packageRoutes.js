const express = require('express');
const {
  createPackage,
  listInterviewerPackages,
  listActivePackages,
  getPackage,
  updatePackage,
  deletePackage,
  bookPackage,
  listCandidatePackageBookings,
  usePackageSession,
} = require('../controllers/packageController');

const router = express.Router();

router.post('/', createPackage);
router.get('/interviewer/:interviewerId', listInterviewerPackages);
router.get('/active', listActivePackages);
router.get('/candidate/:candidateId/bookings', listCandidatePackageBookings);
router.get('/:packageId', getPackage);
router.put('/:packageId', updatePackage);
router.delete('/:packageId', deletePackage);
router.post('/:packageId/book', bookPackage);
router.put('/bookings/:bookingId/use-session', usePackageSession);

module.exports = router;
