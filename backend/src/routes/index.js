const express = require('express');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const evaluationRoutes = require('./evaluationRoutes');
const interviewerRoutes = require('./interviewerRoutes');
const messageRoutes = require('./messageRoutes');
const pricingRoutes = require('./pricingRoutes');
const profileRoutes = require('./profileRoutes');
const submissionRoutes = require('./submissionRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/interviewers', interviewerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/submissions', submissionRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/messages', messageRoutes);
router.use('/pricing', pricingRoutes);

module.exports = router;
