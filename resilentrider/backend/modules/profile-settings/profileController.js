const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// ── User endpoints ────────────────────────────────────────────────────────────

/**
 * @desc  Get user profile
 * @route GET /api/user/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    console.log(`\n👤 [ProfileSettings] User profile loaded successfully — ${user.email}\n`);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Update user profile fields
 * @route PUT /api/user/profile/update
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const ALLOWED = ['name', 'phone', 'address', 'profilePhoto', 'city', 'vehicleType'];
    const updates = {};
    ALLOWED.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    console.log(`\n👤 [ProfileSettings] User profile updated — ${user.email}\n`);

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Update user notification + theme settings, or change password
 * @route PUT /api/user/settings/update
 * @access Private
 */
const updateUserSettings = async (req, res) => {
  try {
    const { notifications, theme, currentPassword, newPassword } = req.body;
    const updates = {};

    if (notifications) updates.notifications = notifications;
    if (theme)         updates.theme = theme;

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      const user = await User.findById(req.user.id).select('+password');
      const match = await user.matchPassword(currentPassword);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // ── Emit real-time settings sync when notifications changed ──────────────────────────────────────────────
    if (notifications && req.app) {
      const io = req.app.get('io');
      if (io) {
        io.to(String(req.user.id)).emit('notification_settings_updated', {
          userId:        String(req.user.id),
          notifications: user.notifications,
        });
      }
    }

    console.log(`\n⚙️  [ProfileSettings] User settings updated successfully — ${user.email}\n`);

    res.status(200).json({ success: true, message: 'Settings updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin endpoints ───────────────────────────────────────────────────────────

/**
 * @desc  Get admin profile
 * @route GET /api/admin/profile
 * @access Private (admin)
 */
const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    // Update lastLogin on every profile fetch
    await User.findByIdAndUpdate(req.user.id, { lastLogin: new Date() });

    console.log(`\n🔐 [ProfileSettings] Admin profile loaded successfully — ${admin.email}\n`);

    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Update admin system settings
 * @route PUT /api/admin/settings/update
 * @access Private (admin)
 */
const updateAdminSettings = async (req, res) => {
  try {
    const { adminSettings, notifications } = req.body;
    const updates = {};

    if (adminSettings) updates.adminSettings = adminSettings;
    if (notifications)  updates.notifications = notifications;

    const admin = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    console.log(`\n⚙️  [ProfileSettings] Admin settings updated successfully — ${admin.email}\n`);

    res.status(200).json({ success: true, message: 'Admin settings updated successfully', data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserProfile, updateUserProfile, updateUserSettings, getAdminProfile, updateAdminSettings };
