const express = require('express');
const { getProfile, upsertProfile } = require('../controllers/profileController');

const router = express.Router();

router.post('/', upsertProfile);
router.get('/:userId', getProfile);

module.exports = router;
