const express = require('express');
const router  = express.Router();
const { updateLocation, getLocationHistory, getLatestLocation } = require('./locationController');
const { protect } = require('../../middleware/authMiddleware');

// POST /api/location/update
router.post('/update', protect, updateLocation);

// GET /api/location/latest/:userId  — single most recent point (fast)
router.get('/latest/:userId', protect, getLatestLocation);

// GET /api/location/history/:userId — last 100 points
router.get('/history/:userId', protect, getLocationHistory);

module.exports = router;
