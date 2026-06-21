const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../../middleware/authMiddleware');
const {
  getUserNotifications, getAdminNotifications,
  markAsRead, markAllAsRead,
  createNotification, broadcastNotification,
  deleteNotification,
  getNotifSettings, updateNotifSettings,
} = require('./notificationController');

router.get('/user',       protect,              getUserNotifications);
router.get('/admin',      protect, adminOnly,   getAdminNotifications);
router.put('/read/:id',   protect,              markAsRead);
router.put('/read-all',   protect,              markAllAsRead);
router.post('/send',      protect, adminOnly,   createNotification);
router.post('/broadcast', protect, adminOnly,   broadcastNotification);
// legacy alias kept for backward compat
router.post('/create',    protect, adminOnly,   createNotification);
router.delete('/:id',     protect,              deleteNotification);
router.get('/settings',   protect,              getNotifSettings);
router.put('/settings',   protect,              updateNotifSettings);

module.exports = router;
