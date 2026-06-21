const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status:    { type: String, default: null },
  meta:      { type: mongoose.Schema.Types.Mixed, default: {} },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
