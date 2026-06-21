const Notification = require('../../models/Notification');
const User         = require('../../models/User');

// ── AI priority resolver ──────────────────────────────────────
function resolvePriority(type) {
  if (['fraud', 'error'].includes(type))                        return 'high';
  if (['claim', 'loan', 'warning', 'payout'].includes(type))   return 'medium';
  return 'low';
}

const TYPE_ICON = {
  fraud: '🚨', error: '❌', claim: '📋', loan: '💰', payout: '💸',
  warning: '⚠️', success: '✅', system: '⚙️', weather: '🌦️', info: 'ℹ️',
};

/**
 * createAndEmit — shared helper used by claimsController, loanController, etc.
 * Creates a Notification doc and emits socket event to the user's room.
 * Respects user notification preferences before saving/emitting.
 */
async function createAndEmit(io, { userId, title, message, type = 'info', priority, claimId, metadata = {} }) {
  // ── Check user notification preferences ──────────────────────────────────────────────
  try {
    const user = await User.findById(userId).select('notifications').lean();
    if (user?.notifications) {
      const prefs = user.notifications;
      // Block claim-type notifications if claimAlerts is off
      if (type === 'claim' && prefs.claimAlerts === false) return null;
      // Block premium reminders if premiumReminder is off
      if (type === 'system' && metadata?.reminderType === 'premium' && prefs.premiumReminder === false) return null;
      // Block fraud/error/warning if both email and sms are off (no channel to deliver)
      // We still save high-priority alerts regardless — they are always stored
    }
  } catch { /* non-blocking — proceed if user lookup fails */ }

  const resolvedPriority = priority || resolvePriority(type);
  const icon = TYPE_ICON[type] || 'ℹ️';
  const notif = await Notification.create({
    userId, title, message, type,
    priority: resolvedPriority,
    claimId:  claimId || null,
    metadata: { icon, ...metadata },
  });
  if (io) io.to(String(userId)).emit('new_notification', notif);
  return notif;
}

// GET /api/notifications/user?limit=20&page=1&filter=all|unread|high
const getUserNotifications = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const filter = req.query.filter || 'all';

    const query = { userId: req.user._id };
    if (filter === 'unread') query.isRead   = false;
    if (filter === 'high')   query.priority = 'high';

    const [notifs, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true, data: notifs, unreadCount,
      total, page, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/notifications/admin?limit=20&filter=all|fraud|claim|system|payout
const getAdminNotifications = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const filter = req.query.filter || 'all';

    const query = {};
    if (filter !== 'all') query.type = filter;

    const [notifs, counts] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email'),
      Notification.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    ]);

    const typeCounts = {};
    counts.forEach(c => { typeCounts[c._id] = c.count; });

    res.status(200).json({ success: true, data: notifs, typeCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/read/:id
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, read: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, read: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/notifications/send  (admin → specific user)
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority } = req.body;
    if (!userId || !title || !message)
      return res.status(400).json({ success: false, message: 'userId, title and message are required' });

    const notif = await createAndEmit(req.app.get('io'), {
      userId, title, message,
      type:     type     || 'info',
      priority: priority || resolvePriority(type || 'info'),
    });
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/notifications/broadcast  (admin → all riders)
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, priority } = req.body;
    if (!title || !message)
      return res.status(400).json({ success: false, message: 'title and message are required' });

    const riders = await User.find({ role: 'rider' }).select('_id').lean();
    const io     = req.app.get('io');
    const resolvedPriority = priority || resolvePriority(type || 'system');
    const icon   = TYPE_ICON[type] || '📢';

    const docs = riders.map(r => ({
      userId:   r._id,
      title, message,
      type:     type || 'system',
      priority: resolvedPriority,
      metadata: { icon, broadcast: true },
    }));

    const inserted = await Notification.insertMany(docs);
    if (io) inserted.forEach(n => io.to(String(n.userId)).emit('new_notification', n));

    console.log(`[Broadcast] "${title}" → ${riders.length} riders`);
    res.status(201).json({ success: true, count: riders.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/notifications/settings
const getNotifSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.status(200).json({ success: true, data: user.notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/settings
// Accepts either full object { email, sms, claimAlerts, premiumReminder }
// or individual fields — both patterns work
const updateNotifSettings = async (req, res) => {
  try {
    const { email, sms, claimAlerts, premiumReminder } = req.body;
    const updates = {};
    if (email           !== undefined) updates['notifications.email']           = email;
    if (sms             !== undefined) updates['notifications.sms']             = sms;
    if (claimAlerts     !== undefined) updates['notifications.claimAlerts']     = claimAlerts;
    if (premiumReminder !== undefined) updates['notifications.premiumReminder'] = premiumReminder;

    // If nothing matched individual fields, try treating body as full object
    if (Object.keys(updates).length === 0) {
      const body = req.body;
      if (typeof body.email           === 'boolean') updates['notifications.email']           = body.email;
      if (typeof body.sms             === 'boolean') updates['notifications.sms']             = body.sms;
      if (typeof body.claimAlerts     === 'boolean') updates['notifications.claimAlerts']     = body.claimAlerts;
      if (typeof body.premiumReminder === 'boolean') updates['notifications.premiumReminder'] = body.premiumReminder;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );

    // ── Emit real-time settings sync to all tabs/devices of this user ──────────────────────────────────────────────
    const io = req.app.get('io');
    if (io) {
      io.to(String(req.user._id)).emit('notification_settings_updated', {
        userId:        String(req.user._id),
        notifications: user.notifications,
      });
    }

    console.log(`[Notifications] Settings updated for ${user.email}`);
    res.status(200).json({ success: true, data: user.notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getUserNotifications, getAdminNotifications,
  markAsRead, markAllAsRead,
  createNotification, broadcastNotification,
  deleteNotification,
  getNotifSettings, updateNotifSettings,
  createAndEmit,
};
