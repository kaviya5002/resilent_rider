const User = require('../models/User');
const Transaction = require('../models/Transaction');
const InsurancePlan = require('../models/InsurancePlan');
const Loan = require('../models/Loan');

// @desc    Get rider dashboard summary
// @route   GET /api/rider/dashboard
// @access  Private (user)
const getDashboard = async (req, res) => {
  try {
    const rider = await User.findById(req.user.id);

    const activePlan = await InsurancePlan.findOne({
      rider: req.user.id,
      status: 'active',
    });

    const activeLoan = await Loan.findOne({
      rider: req.user.id,
      status: { $in: ['approved', 'disbursed', 'repaying'] },
    });

    // Last 7 days earnings
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyTransactions = await Transaction.find({
      rider: req.user.id,
      type: 'earning',
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: {
        rider: {
          id: rider._id,
          name: rider.name,
          email: rider.email,
          totalEarnings: rider.totalEarnings,
          weeklyEarnings: rider.weeklyEarnings,
          riskScore: rider.riskScore,
          currentZone: rider.currentZone,
        },
        insurance: activePlan || null,
        loan: activeLoan || null,
        weeklyTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get rider earnings history
// @route   GET /api/rider/earnings
// @access  Private (user)
const getEarnings = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const transactions = await Transaction.find({
      rider: req.user.id,
      type: 'earning',
      date: { $gte: startDate },
    }).sort({ date: -1 });

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({ success: true, data: { transactions, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get rider profile
// @route   GET /api/rider/profile
// @access  Private (user)
const getProfile = async (req, res) => {
  try {
    const rider = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update rider profile
// @route   PUT /api/rider/profile
// @access  Private (user)
const updateProfile = async (req, res) => {
  try {
    const { name, phone, currentZone } = req.body;
    const rider = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, currentZone },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: rider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get rider notifications
// @route   GET /api/rider/notifications
// @access  Private (user)
const getNotifications = async (req, res) => {
  try {
    const rider      = await User.findById(req.user.id);
    const activePlan = await InsurancePlan.findOne({ rider: req.user.id, status: 'active' });
    const activeLoan = await Loan.findOne({ rider: req.user.id, status: { $in: ['pending', 'approved', 'disbursed'] } });

    const notifications = [];
    const now = new Date();

    if (activePlan) {
      const daysLeft = Math.ceil((new Date(activePlan.endDate) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) {
        notifications.push({
          id: 'ins-renewal',
          type: 'info',
          icon: 'ℹ️',
          title: 'Insurance Renewal',
          message: `Your insurance policy renews in ${daysLeft} days`,
          time: 'Just now',
          read: false,
        });
      }
    }

    if (activeLoan) {
      notifications.push({
        id: `loan-${activeLoan._id}`,
        type: activeLoan.status === 'approved' ? 'success' : 'info',
        icon: activeLoan.status === 'approved' ? '✓' : 'ℹ️',
        title: 'Loan Update',
        message: `Your loan of $${activeLoan.amount} is ${activeLoan.status}`,
        time: new Date(activeLoan.updatedAt).toLocaleDateString(),
        read: false,
      });
    }

    notifications.push({
      id: 'welcome',
      type: 'success',
      icon: '🎉',
      title: `Welcome, ${rider.name}!`,
      message: 'Your ResilientRider dashboard is ready.',
      time: 'Today',
      read: true,
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getEarnings, getProfile, updateProfile, getNotifications };
