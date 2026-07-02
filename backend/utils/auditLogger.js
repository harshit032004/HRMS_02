const AuditLog = require('../models/AuditLog');

/**
 * Log an auditable action.
 * @param {Object} req       - Express request (used for actor + IP)
 * @param {string} action    - Uppercase snake_case verb, e.g. 'LEAVE_APPLIED'
 * @param {string} entity    - Model name, e.g. 'Leave', 'Goal', 'User'
 * @param {*}      entityId  - MongoDB ObjectId of the affected document
 * @param {string} details   - Human-readable summary
 */
async function logAction(req, action, entity, entityId = null, details = '') {
  try {
    const actor = req?.user?._id || req?.user?.id || null;
    const ip =
      req?.ip ||
      req?.headers?.['x-forwarded-for']?.split(',')[0].trim() ||
      '';

    await AuditLog.create({ actor, action, entity, entityId, details, ip });
  } catch (err) {
    // Audit logging must never crash the main request
    console.error('[AuditLog] Failed to write log:', err.message);
  }
}

module.exports = { logAction };
