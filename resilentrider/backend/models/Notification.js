const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title:    { type: String, required: true, trim: true },
    message:  { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['system', 'claim', 'loan', 'fraud', 'weather', 'payout', 'info', 'success', 'warning', 'error'],
      default: 'info',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    isRead:   { type: Boolean, default: false, index: true },
    // legacy field kept for backward compat with claimsController
    read:     { type: Boolean, default: false },
    claimId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Auto-assign priority based on type
notificationSchema.pre('save', function () {
  if (!this.isModified('type')) return;
  if (['fraud', 'error'].includes(this.type))                    this.priority = 'high';
  else if (['claim', 'loan', 'warning', 'payout'].includes(this.type)) this.priority = 'medium';
  else                                                            this.priority = 'low';
});

module.exports = mongoose.model('Notification', notificationSchema);
