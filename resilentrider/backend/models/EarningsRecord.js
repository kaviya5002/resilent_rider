const mongoose = require('mongoose');

const earningsRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    earningsAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    keyword: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// One record per user per date
earningsRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('EarningsRecord', earningsRecordSchema);
