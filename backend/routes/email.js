const express = require('express');
const router = express.Router();
const { sendEmail } = require('../controllers/email');
const { auth } = require('../middleware/Auth');

// POST /api/email
router.post('/', auth, sendEmail);

module.exports = router;
