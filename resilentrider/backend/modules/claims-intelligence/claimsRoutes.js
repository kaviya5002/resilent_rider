const express = require('express');
const router  = express.Router();
const { submitClaim, getUserClaims, updateClaimStatus } = require('./claimsController');
const { protect } = require('../../middleware/authMiddleware');

// POST /api/claims/submit
router.post('/submit', protect, submitClaim);

// GET /api/claims/user/:userId
router.get('/user/:userId', protect, getUserClaims);

// PUT /api/claims/update-status/:claimId
router.put('/update-status/:claimId', protect, updateClaimStatus);

module.exports = router;
