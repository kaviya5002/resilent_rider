const express = require('express');
const router = express.Router();
const { getStats, getAllRiders, getAllClaims, updateClaimStatus, getFraudAlerts, getSystemOverview, getLiveLocations, getFraudDetection } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats',           getStats);
router.get('/riders',          getAllRiders);
router.get('/claims',          getAllClaims);
router.put('/claims/:id',      updateClaimStatus);
router.get('/fraud-alerts',    getFraudAlerts);
router.get('/system-overview', getSystemOverview);
router.get('/live-locations',  getLiveLocations);
router.get('/fraud-detection', getFraudDetection);

module.exports = router;
