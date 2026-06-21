const Loan        = require('../models/Loan');
const Transaction = require('../models/Transaction');
const User        = require('../models/User');
const {
  checkLoanEligibility,
  calculateLoanRisk,
  makeLoanDecision,
  writeLoanAuditLog,
} = require('../modules/loan-intelligence/loanIntelligence');
const { createAndEmit } = require('../modules/notifications/notificationController');

async function notifyLoan(req, userId, event, amount) {
  const io  = req?.app?.get('io') || null;
  const map = {
    submitted: { title: 'Loan Application Submitted',  message: `Your loan application of ₹${Number(amount).toLocaleString()} is under review.`,           type: 'loan'    },
    approved:  { title: 'Loan Approved ✅',              message: `Your loan of ₹${Number(amount).toLocaleString()} has been approved and will be disbursed.`,  type: 'loan'    },
    rejected:  { title: 'Loan Application Rejected',   message: `Your loan application of ₹${Number(amount).toLocaleString()} was not approved.`,             type: 'warning' },
    disbursed: { title: 'Loan Disbursed 💸',            message: `₹${Number(amount).toLocaleString()} has been disbursed to your account.`,                   type: 'payout'  },
  };
  const n = map[event];
  if (n) await createAndEmit(io, { userId, ...n }).catch(() => {});
}

// @desc    Apply for a micro loan
// @route   POST /api/loans/apply
// @access  Private (user)
const applyLoan = async (req, res) => {
  try {
    const { amount, purpose } = req.body;
    const userId = req.user.id;

    // ── Step 1: Eligibility check ─────────────────────────────────────────
    const eligibility = await checkLoanEligibility(userId);
    if (!eligibility.eligible) {
      console.log(`\n❌ [LoanIntelligence] Eligibility failed — ${eligibility.reason}\n`);
      return res.status(400).json({ success: false, message: eligibility.reason });
    }

    // ── Step 2: Loan risk scoring ─────────────────────────────────────────
    const { loanRiskScore, riskLevel, breakdown } = await calculateLoanRisk(userId);
    console.log(`\n📊 [LoanIntelligence] Risk Score: ${loanRiskScore} (${riskLevel})`);
    console.log(`   Breakdown: ${JSON.stringify(breakdown)}\n`);

    // ── Step 3: Automatic decision ────────────────────────────────────────
    const decision = makeLoanDecision(loanRiskScore);
    console.log(`\n⚖️  [LoanIntelligence] Decision: ${decision.decisionLabel} | Status: ${decision.applicationStatus}\n`);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const loan = await Loan.create({
      rider:             userId,
      amount,
      purpose,
      dueDate,
      status:            decision.loanStatus,
      applicationStatus: decision.applicationStatus,
      loanRiskScore,
      decisionTimestamp: new Date(),
    });

    // ── Step 4: Notification ──────────────────────────────────────────────
    await notifyLoan(req, userId, 'submitted', amount);
    if (decision.loanStatus === 'approved') await notifyLoan(req, userId, 'approved', amount);
    if (decision.loanStatus === 'rejected') await notifyLoan(req, userId, 'rejected', amount);

    // ── Step 5: Audit log ─────────────────────────────────────────────────
    await writeLoanAuditLog({
      userId,
      action:    'Loan application submitted',
      status:    decision.applicationStatus,
      meta:      { loanId: loan._id, amount, loanRiskScore, riskLevel },
    });
    await writeLoanAuditLog({
      userId,
      action:    'Loan decision made',
      status:    decision.applicationStatus,
      meta:      { loanId: loan._id, decisionLabel: decision.decisionLabel, loanRiskScore },
    });

    res.status(201).json({
      success: true,
      data: loan,
      intelligence: { loanRiskScore, riskLevel, decision: decision.applicationStatus, breakdown },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get rider's loan history
// @route   GET /api/loans/my-loans
// @access  Private (user)
const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ rider: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all loans (admin)
// @route   GET /api/loans/all
// @access  Private (admin)
const getAllLoans = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const loans = await Loan.find(query)
      .populate('rider', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or reject a loan (admin)
// @route   PUT /api/loans/:id/review
// @access  Private (admin)
const reviewLoan = async (req, res) => {
  try {
    const { status } = req.body;

    const applicationStatus =
      status === 'approved' ? 'Approved' :
      status === 'rejected' ? 'Rejected' :
      status === 'disbursed' ? 'Disbursed' : 'Under Review';

    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        status,
        applicationStatus,
        approvedBy:        req.user.id,
        decisionTimestamp: new Date(),
        ...(status === 'approved'  && { disbursedAt: new Date() }),
        ...(status === 'disbursed' && { disbursedAt: new Date() }),
      },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Record disbursement transaction
    if (status === 'approved' || status === 'disbursed') {
      await Transaction.create({
        rider:       loan.rider,
        type:        'loan_disbursement',
        amount:      loan.amount,
        description: 'Micro loan disbursed',
        status:      'completed',
      });
    }

    // Notification
    const event = status === 'approved' || status === 'disbursed' ? 'disbursed' : status;
    await notifyLoan(req, loan.rider, event, loan.amount);

    // Audit log
    await writeLoanAuditLog({
      userId: loan.rider,
      action: status === 'disbursed' ? 'Loan disbursed' : 'Loan decision made',
      status: applicationStatus,
      meta:   { loanId: loan._id, reviewedBy: req.user.id },
    });

    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { applyLoan, getMyLoans, getAllLoans, reviewLoan };
