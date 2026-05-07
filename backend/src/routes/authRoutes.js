const express = require('express');
const { loginOrSignup } = require('../controllers/authController');

const router = express.Router();

router.post('/', loginOrSignup);

module.exports = router;
