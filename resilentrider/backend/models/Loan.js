const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [100, 'Minimum loan amount is $100'],
      max: [5000, 'Maximum loan amount is $5000'],
    },
    interestRate: {
      type: Number,
      default: 2.5, // 2.5% per month
    },
    repaymentPeriodDays: {
      type: Number,
      default: 30,
    },
    totalRepayable: {
      type: Number,
    },
    amountRepaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'disbursed', 'repaying', 'repaid', 'defaulted', 'rejected'],
      default: 'pending',
    },
    purpose: {
      type: String,
      trim: true,
    },
    disbursedAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // ── Loan Intelligence fields ──────────────────────────────────
    applicationStatus: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Disbursed'],
      default: 'Submitted',
    },
    loanRiskScore: {
      type: Number,
      default: null,
    },
    decisionTimestamp: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Calculate total repayable before saving
loanSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isModified('interestRate')) {
    this.totalRepayable = this.amount + (this.amount * this.interestRate) / 100;
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
