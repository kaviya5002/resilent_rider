const express = require('express');
const router  = express.Router();
const {
  getUserProfile, updateUserProfile, updateUserSettings,
  getAdminProfile, updateAdminSettings,
} = require('./profileController');
const { protect, adminOnly } = require('../../middleware/authMiddleware');

// ── User routes ───────────────────────────────────────────────
router.get('/user/profile',           protect, getUserProfile);
router.put('/user/profile/update',    protect, updateUserProfile);
router.put('/user/settings/update',   protect, updateUserSettings);

// ── Admin routes ──────────────────────────────────────────────
router.get('/admin/profile',          protect, adminOnly, getAdminProfile);
router.put('/admin/settings/update',  protect, adminOnly, updateAdminSettings);

module.exports = router;
