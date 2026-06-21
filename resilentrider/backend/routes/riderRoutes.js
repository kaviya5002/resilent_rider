const express = require('express');
const router = express.Router();
const { getDashboard, getEarnings, getProfile, updateProfile, getNotifications } = require('../controllers/riderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All rider routes require auth

router.get('/dashboard', getDashboard);
router.get('/earnings', getEarnings);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/notifications', getNotifications);

module.exports = router;
