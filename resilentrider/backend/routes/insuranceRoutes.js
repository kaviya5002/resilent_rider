const express = require('express');
const router = express.Router();
const { getMyPlan, subscribePlan, getAvailablePlans, getDynamicPremium } = require('../controllers/insuranceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/plans', getAvailablePlans);
router.get('/my-plan', protect, getMyPlan);
router.post('/subscribe', protect, subscribePlan);
router.get('/premium', protect, getDynamicPremium);

module.exports = router;
