const express = require('express');
const { createMessage, listBookingMessages } = require('../controllers/messageController');

const router = express.Router();

router.post('/', createMessage);
router.get('/:bookingId', listBookingMessages);

module.exports = router;
