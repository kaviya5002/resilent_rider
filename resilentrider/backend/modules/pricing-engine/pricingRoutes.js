const express = require('express');
const router  = express.Router();
const { getDynamicPricing } = require('./pricingController');
const { protect } = require('../../middleware/authMiddleware');

// GET /api/pricing/calculate/:userId
router.get('/calculate/:userId', protect, getDynamicPricing);

module.exports = router;
