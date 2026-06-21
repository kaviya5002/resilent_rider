const express = require('express');
const router  = express.Router();
const { getRiskProfile } = require('./registrationController');

// POST /api/registration/risk-profile
router.post('/risk-profile', getRiskProfile);

module.exports = router;
