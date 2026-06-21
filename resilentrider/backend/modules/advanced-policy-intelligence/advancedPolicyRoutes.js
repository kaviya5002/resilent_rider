const express = require('express');
const router  = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { calculatePolicyHealthScore } = require('./policyHealthScore');
const { adjustCoverageBasedOnRisk }  = require('./coverageAdjustment');
const { predictClaimRisk }           = require('./claimPrediction');
const { runAdvancedPolicyIntelligence } = require('./policyIntelligence');

// GET /api/policy/health/:userId
router.get('/health/:userId', protect, async (req, res) => {
  try {
    const result = await calculatePolicyHealthScore(req.params.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/policy/adjust-coverage/:userId
router.get('/adjust-coverage/:userId', protect, async (req, res) => {
  try {
    const result = await adjustCoverageBasedOnRisk(req.params.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/policy/predict-claim/:userId
router.get('/predict-claim/:userId', protect, async (req, res) => {
  try {
    const result = await predictClaimRisk(req.params.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/policy/run-intelligence/:userId
router.get('/run-intelligence/:userId', protect, async (req, res) => {
  try {
    const result = await runAdvancedPolicyIntelligence(req.params.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
