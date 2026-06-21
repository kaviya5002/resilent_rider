const Claim        = require('../models/Claim');
const Notification = require('../models/Notification');
const InsurancePlan = require('../models/InsurancePlan');
const { createAndEmit } = require('../modules/notifications/notificationController');

// ── AI Risk Score helper ──────────────────────────────────────
async function calcRisk(userId, amount, coverageAmount, docCount, incidentDate) {
  let score = 0;

  const ratio = amount / (coverageAmount || 25000);
  if (ratio > 0.8) score += 30;
  else if (ratio > 0.5) score += 20;
  else if (ratio > 0.3) score += 10;

  const recentCount = await Claim.countDocuments({
    rider: userId,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });
  if (recentCount >= 3) score += 30;
  else if (recentCount >= 2) score += 20;
  else if (recentCount >= 1) score += 10;

  if (docCount === 0) score += 20;
  else if (docCount === 1) score += 10;

  const daysDiff = Math.floor((Date.now() - new Date(incidentDate)) / (1000 * 60 * 60 * 24));
  if (daysDiff === 0) score += 15;
  else if (daysDiff > 30) score += 10;

  score = Math.min(100, Math.max(0, score));
  const riskLevel = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
  return { riskScore: score, riskLevel };
}

// ── Notification helper — creates DB record + emits socket ──────
async function notify(req, userId, title, message, type = 'info', claimId = null) {
  try {
    const io = req?.app?.get('io') || null;
    await createAndEmit(io, { userId, title, message, type, claimId });
  } catch {}
}

// POST /api/claims/create
const createClaim = async (req, res) => {
  try {
    const { policyId, claimAmount, claimType, incidentDate, description, documents, isEmergency } = req.body;
    const userId = req.user._id;

    if (!claimAmount || claimAmount <= 0)
      return res.status(400).json({ success: false, message: 'Claim amount must be greater than 0' });
    if (!incidentDate || new Date(incidentDate) > new Date())
      return res.status(400).json({ success: false, message: 'Incident date cannot be in the future' });
    if (!claimType || !description)
      return res.status(400).json({ success: false, message: 'Claim type and description are required' });

    const plan = await InsurancePlan.findById(policyId);
    if (!plan)
      return res.status(404).json({ success: false, message: 'Insurance plan not found' });

    const docCount = Array.isArray(documents) ? documents.length : 0;
    const { riskScore, riskLevel } = await calcRisk(userId, claimAmount, plan.coverageAmount, docCount, incidentDate);

    const autoStatus = riskLevel === 'LOW' ? 'submitted' : riskLevel === 'MEDIUM' ? 'under_review' : 'submitted';

    const claim = await Claim.create({
      rider:         userId,
      insurancePlan: policyId,
      amount:        claimAmount,
      claimType,
      incidentDate:  new Date(incidentDate),
      description,
      documents:     Array.isArray(documents) ? documents.map(d => ({ name: d, url: '' })) : [],
      isEmergency:   !!isEmergency,
      priority:      isEmergency ? 'High' : 'Normal',
      status:        autoStatus,
      riskScore,
      riskLevel,
      activityLog:   [{ action: 'Claim Created', performedBy: 'rider', timestamp: new Date() }],
    });

    await notify(req, userId, 'Claim Submitted', `Your claim of ₹${claimAmount.toLocaleString()} has been submitted. Claim ID: ${claim._id}`, 'claim', claim._id);
    if (isEmergency) await notify(req, userId, 'Emergency Claim', '🚨 Emergency claim fast-tracked for immediate review.', 'warning', claim._id);

    console.log('Claim submitted successfully');
    res.status(201).json({ success: true, message: 'Claim submitted successfully', data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// GET /api/claims/user/:userId
const getUserClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ rider: req.params.userId })
      .populate('insurancePlan', 'planName coverageAmount')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/claims/admin/all
const getAllClaims = async (req, res) => {
  try {
    const { status, risk, priority, search } = req.query;
    const filter = {};
    if (status)   filter.status    = status;
    if (risk)     filter.riskLevel = risk;
    if (priority) filter.priority  = priority;

    let claims = await Claim.find(filter)
      .populate('rider', 'name email')
      .populate('insurancePlan', 'planName coverageAmount')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      claims = claims.filter(c =>
        c.rider?.name?.toLowerCase().includes(s) ||
        c._id.toString().includes(s)
      );
    }

    res.status(200).json({ success: true, data: claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/claims/approve/:claimId
const approveClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    claim.status       = 'approved';
    claim.adminComment = req.body.adminComment || 'Claim approved.';
    claim.reviewedBy   = req.user._id;
    claim.activityLog.push({ action: 'Claim Approved', performedBy: req.user.name || 'admin', timestamp: new Date() });
    await claim.save();

    await notify(req, claim.rider, 'Claim Approved ✅', 'Your claim has been approved. Payment will be processed shortly.', 'payout', claim._id);
    console.log('Claim approved');
    res.status(200).json({ success: true, message: 'Claim approved', data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/claims/reject/:claimId
const rejectClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    claim.status       = 'rejected';
    claim.adminComment = req.body.adminComment || 'Claim rejected.';
    claim.reviewedBy   = req.user._id;
    claim.activityLog.push({ action: 'Claim Rejected', performedBy: req.user.name || 'admin', timestamp: new Date() });
    await claim.save();

    await notify(req, claim.rider, 'Claim Rejected', `Your claim has been rejected. Reason: ${claim.adminComment}`, 'error', claim._id);
    console.log('Claim rejected');
    res.status(200).json({ success: true, message: 'Claim rejected', data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/claims/request-documents/:claimId
const requestDocuments = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    claim.status       = 'under_review';
    claim.adminComment = req.body.adminComment || 'Additional documents required.';
    claim.activityLog.push({ action: 'Documents Requested', performedBy: req.user.name || 'admin', timestamp: new Date() });
    await claim.save();

    await notify(req, claim.rider, 'Documents Required', 'Additional documents required for your claim. Please upload them.', 'warning', claim._id);
    res.status(200).json({ success: true, message: 'Documents requested', data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/claims/payment/:claimId
const processPayment = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    if (claim.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Claim must be approved before payment' });

    claim.status        = 'paid';
    claim.paidAt        = new Date();
    claim.approvedAmount = req.body.approvedAmount || claim.amount;
    claim.activityLog.push({ action: 'Payment Processed', performedBy: req.user.name || 'admin', timestamp: new Date() });
    await claim.save();

    await notify(req, claim.rider, 'Payment Processed 💰', `Payment of ₹${claim.approvedAmount.toLocaleString()} has been processed for your claim.`, 'payout', claim._id);
    console.log('Payment processed');
    res.status(200).json({ success: true, message: 'Payment processed', data: claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/claims/analytics
const getAnalytics = async (req, res) => {
  try {
    const [total, approved, rejected, paid, highRisk, emergency] = await Promise.all([
      Claim.countDocuments(),
      Claim.countDocuments({ status: 'approved' }),
      Claim.countDocuments({ status: 'rejected' }),
      Claim.countDocuments({ status: 'paid' }),
      Claim.countDocuments({ riskLevel: 'HIGH' }),
      Claim.countDocuments({ isEmergency: true }),
    ]);

    const paidClaims = await Claim.find({ status: 'paid' });
    const totalPayout = paidClaims.reduce((s, c) => s + (c.approvedAmount || c.amount || 0), 0);

    console.log('Claim analytics loaded');
    res.status(200).json({ success: true, data: { total, approved, rejected, paid, highRisk, emergency, totalPayout } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/claims/notifications/:userId
const getUserNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createClaim, getUserClaims, getAllClaims, approveClaim, rejectClaim, requestDocuments, processPayment, getAnalytics, getUserNotifications };
