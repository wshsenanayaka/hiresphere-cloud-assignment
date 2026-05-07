const express = require('express');
const {
  createPricing,
  listInterviewerPricing,
  listActiveInterviewerPricing,
  updatePricing,
  deletePricing,
} = require('../controllers/pricingController');

const router = express.Router();

router.post('/', createPricing);
router.get('/interviewer/:interviewerId', listInterviewerPricing);
router.get('/interviewer/:interviewerId/active', listActiveInterviewerPricing);
router.put('/:pricingId', updatePricing);
router.delete('/:pricingId', deletePricing);

module.exports = router;
