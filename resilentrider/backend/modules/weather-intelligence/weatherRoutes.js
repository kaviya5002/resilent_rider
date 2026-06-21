const express    = require('express');
const router     = express.Router();
const { validateClaim } = require('./weatherController');
const { protect }       = require('../../middleware/authMiddleware');

// POST /api/weather/validate-claim
router.post('/validate-claim', protect, validateClaim);

module.exports = router;
