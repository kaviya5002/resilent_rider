const express = require('express');
const router  = express.Router();
const { runChecks } = require('./automationController');
const { protect } = require('../../middleware/authMiddleware');

// GET /api/automation/check/:userId
router.get('/check/:userId', protect, runChecks);

module.exports = router;
