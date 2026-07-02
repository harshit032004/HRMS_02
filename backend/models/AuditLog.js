const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:   { type: String, required: true },           // e.g. 'LEAVE_APPLIED'
  entity:   { type: String, required: true },           // e.g. 'Leave', 'Goal'
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  details:  { type: String, default: '' },
  ip:       { type: String, default: '' },
  timestamp:{ type: Date, default: Date.now },
});

// Compound index for the most common admin queries
auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ entity: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
