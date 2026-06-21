const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { calculateRiskProfile }                                          = require('../modules/registration-intelligence/riskEngine');
const { validateRegistrationInput, calculateRegistrationRisk, logRegistrationActivity } = require('../modules/registration-upgrade/registrationUpgrade');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const {
      name, email, phone, password, role,
      city, vehicleType, age, dailyHours,
      accidentHistory, workingHours,
    } = req.body;

    // ── Multi-level validation ────────────────────────────────────────────
    const { valid, errors } = validateRegistrationInput({ name, email, phone, password });
    if (!valid) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    // ── Duplicate email check ─────────────────────────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // ── Create user ───────────────────────────────────────────────────────
    const user = await User.create({ name, email, phone, password, role, city, vehicleType });

    // ── Registration risk profiling (upgrade module) ──────────────────────
    let regRiskScore = null;
    let regRiskLevel = null;
    if (role !== 'admin') {
      const regRisk = calculateRegistrationRisk({ age, vehicleType, workingHours, accidentHistory });
      regRiskScore  = regRisk.riskScore;
      regRiskLevel  = regRisk.riskLevel;
      console.log(`\n🛡️  [RegistrationUpgrade] Risk — Score: ${regRiskScore} | Level: ${regRiskLevel}`);
    }

    // ── Auto risk profile (existing intelligence module) ──────────────────
    if (role !== 'admin' && (vehicleType || city)) {
      const profile = calculateRiskProfile({ age, vehicleType, city, dailyHours, accidentHistory });
      await User.findByIdAndUpdate(user._id, {
        riskScore:       profile.riskScore,
        riskLevel:       profile.riskLevel,
        recommendedPlan: profile.recommendedPlan,
      });
      console.log('\n🚀 [RegistrationIntelligence] Auto Risk Profile — New Rider Signup');
      console.log(`   Name: ${name} | City: ${city} | Vehicle: ${vehicleType}`);
      console.log(`   Risk Score: ${profile.riskScore} | Level: ${profile.riskLevel} | Plan: ${profile.recommendedPlan}\n`);
    }

    // ── Activity log (non-blocking) ───────────────────────────────────────
    const ipAddress  = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const deviceType = req.headers['user-agent']
      ? (req.headers['user-agent'].includes('Mobile') ? 'mobile' : 'desktop')
      : 'unknown';
    logRegistrationActivity({
      userId: user._id, ipAddress, deviceType,
      registrationStatus: 'success',
      riskScore: regRiskScore, riskLevel: regRiskLevel,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Access denied. You are not registered as ${role}` });
    }

    // Update lastLogin
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { signup, login, getProfile };
