const mongoose = require('mongoose');

const registrationLogSchema = new mongoose.Schema({
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp:          { type: Date, default: Date.now },
  ipAddress:          { type: String, default: 'unknown' },
  deviceType:         { type: String, default: 'unknown' },
  registrationStatus: { type: String, enum: ['success', 'failed'], default: 'success' },
  riskScore:          { type: Number, default: null },
  riskLevel:          { type: String, default: null },
  validationErrors:   { type: [String], default: [] },
});

module.exports = mongoose.model('RegistrationLog', registrationLogSchema);
