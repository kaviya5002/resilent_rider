/**
 * Loan Intelligence — Eligibility, Risk, Decision, Notifications, Audit
 * -----------------------------------------------------------------------
 */

const User        = require('../../models/User');
const Loan        = require('../../models/Loan');
const Transaction = require('../../models/Transaction');
const Claim       = require('../../models/Claim');
const AuditLog    = require('../../models/AuditLog');

// ── STEP 1: Loan Eligibility Engine ──────────────────────────────────────────

/**
 * checkLoanEligibility
 * @param {string} userId
 * @returns {{ eligible: boolean, reason: string }}
 */
async function checkLoanEligibility(userId) {
  const user = await User.findById(userId);
  if (!user) return { eligible: false, reason: 'User not found' };

  // Rule 1 — Minimum account age: 30 days
  const accountAgeDays = (Date.now() - new Date(user.createdAt)) / 86400000;
  if (accountAgeDays < 30) {
    return { eligible: false, reason: `Account must be at least 30 days old (current: ${Math.floor(accountAgeDays)} days)` };
  }

  // Rule 2 — Minimum income: 5000 (last 30 days earnings)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const earningsTx = await Transaction.find({ rider: userId, type: 'earning', date: { $gte: thirtyDaysAgo } });
  const monthlyIncome = earningsTx.reduce((s, t) => s + t.amount, 0);
  if (monthlyIncome < 5000) {
    return { eligible: false, reason: `Minimum monthly income of ₹5,000 required (current: ₹${monthlyIncome.toFixed(0)})` };
  }

  // Rule 3 — Maximum 1 active loan
  const activeLoans = await Loan.countDocuments({
    rider: userId,
    status: { $in: ['pending', 'approved', 'disbursed', 'repaying'] },
  });
  if (activeLoans >= 1) {
    return { eligible: false, reason: 'You already have an active loan. Please repay it before applying again.' };
  }

  // Rule 4 — Minimum credit score (derived from riskScore: lower risk = higher credit)
  const creditScore = user.riskScore != null ? Math.round(900 - user.riskScore * 3) : 650;
  if (creditScore < 600) {
    return { eligible: false, reason: `Credit score too low (${creditScore}). Minimum required: 600` };
  }

  return { eligible: true, reason: 'All eligibility criteria met', creditScore, monthlyIncome };
}

// ── STEP 2: Loan Risk Scoring ─────────────────────────────────────────────────

/**
 * calculateLoanRisk
 * @param {string} userId
 * @returns {{ loanRiskScore, riskLevel, breakdown }}
 */
async function calculateLoanRisk(userId) {
  let score = 0;
  const breakdown = {};

  // Low income (+20): monthly earnings < 8000
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const earningsTx = await Transaction.find({ rider: userId, type: 'earning', date: { $gte: thirtyDaysAgo } });
  const monthlyIncome = earningsTx.reduce((s, t) => s + t.amount, 0);
  if (monthlyIncome < 8000) {
    score += 20;
    breakdown.lowIncome = 20;
  }

  // Irregular earnings (+25): high coefficient of variation in last 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
  const recentTx = await Transaction.find({ rider: userId, type: 'earning', date: { $gte: fourteenDaysAgo } });
  if (recentTx.length >= 3) {
    const amounts = recentTx.map((t) => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    if (cv > 0.5) {
      score += 25;
      breakdown.irregularEarnings = 25;
    }
  }

  // High claim frequency (+30): > 2 claims in last 30 days
  const recentClaims = await Claim.countDocuments({ rider: userId, createdAt: { $gte: thirtyDaysAgo } });
  if (recentClaims > 2) {
    score += 30;
    breakdown.highClaimFrequency = 30;
  }

  // Low account age (+15): account < 60 days old
  const user = await User.findById(userId);
  const accountAgeDays = user ? (Date.now() - new Date(user.createdAt)) / 86400000 : 999;
  if (accountAgeDays < 60) {
    score += 15;
    breakdown.lowAccountAge = 15;
  }

  const loanRiskScore = Math.min(100, score);
  const riskLevel = loanRiskScore <= 40 ? 'LOW' : loanRiskScore <= 70 ? 'MEDIUM' : 'HIGH';

  return { loanRiskScore, riskLevel, breakdown };
}

// ── STEP 3: Loan Decision Engine ──────────────────────────────────────────────

/**
 * makeLoanDecision
 * Maps loanRiskScore to applicationStatus and Loan.status
 */
function makeLoanDecision(loanRiskScore) {
  if (loanRiskScore <= 40) {
    return { applicationStatus: 'Approved',      loanStatus: 'approved',     decisionLabel: 'Auto-Approved' };
  }
  if (loanRiskScore <= 70) {
    return { applicationStatus: 'Under Review',  loanStatus: 'pending',      decisionLabel: 'Under Review'  };
  }
  return   { applicationStatus: 'Rejected',      loanStatus: 'rejected',     decisionLabel: 'Auto-Rejected' };
}

// ── STEP 4: Notification Triggers ────────────────────────────────────────────

/**
 * sendLoanNotification — logs notification to console (no external email service required)
 * In production, replace console.log with nodemailer / SMS / push service.
 */
function sendLoanNotification(event, { userId, userName, amount, status }) {
  const messages = {
    submitted: `📩 Loan application of ₹${amount} submitted by ${userName}`,
    approved:  `✅ Loan of ₹${amount} APPROVED for ${userName}`,
    rejected:  `❌ Loan application of ₹${amount} REJECTED for ${userName}`,
    disbursed: `💸 Loan of ₹${amount} DISBURSED to ${userName}`,
  };
  const msg = messages[event] || `Loan event: ${event}`;
  console.log(`\n🔔 [LoanNotification] ${msg}`);
  console.log(`   User ID : ${userId} | Status : ${status}\n`);
}

// ── STEP 5: Audit Logger ──────────────────────────────────────────────────────

/**
 * writeLoanAuditLog — non-blocking, never throws
 */
async function writeLoanAuditLog({ userId, action, status, meta = {} }) {
  try {
    await AuditLog.create({ userId, action, status, meta });
    console.log(`📋 [LoanAudit] ${action} | User: ${userId} | Status: ${status}`);
  } catch (err) {
    console.error('[LoanAudit] Failed to write audit log:', err.message);
  }
}

module.exports = {
  checkLoanEligibility,
  calculateLoanRisk,
  makeLoanDecision,
  sendLoanNotification,
  writeLoanAuditLog,
};
