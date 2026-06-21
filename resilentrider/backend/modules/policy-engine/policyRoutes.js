const express = require('express');
const router  = express.Router();
const { createPolicy, getUserPolicies, updatePolicy } = require('./policyController');
const { protect } = require('../../middleware/authMiddleware');

// POST /api/policy/create
router.post('/create', protect, createPolicy);

// GET /api/policy/user/:userId
router.get('/user/:userId', protect, getUserPolicies);

// PUT /api/policy/update/:policyId
router.put('/update/:policyId', protect, updatePolicy);

module.exports = router;
