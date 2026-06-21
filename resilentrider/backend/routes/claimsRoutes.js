const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createClaim,
  getUserClaims,
  getAllClaims,
  approveClaim,
  rejectClaim,
  requestDocuments,
  processPayment,
  getAnalytics,
  getUserNotifications,
} = require('../controllers/claimsController');

router.post('/create',                    protect,              createClaim);
router.get('/user/:userId',               protect,              getUserClaims);
router.get('/admin/all',                  protect, adminOnly,   getAllClaims);
router.put('/approve/:claimId',           protect, adminOnly,   approveClaim);
router.put('/reject/:claimId',            protect, adminOnly,   rejectClaim);
router.put('/request-documents/:claimId', protect, adminOnly,   requestDocuments);
router.put('/payment/:claimId',           protect, adminOnly,   processPayment);
router.get('/analytics',                  protect, adminOnly,   getAnalytics);
router.get('/notifications/:userId',      protect,              getUserNotifications);

module.exports = router;
