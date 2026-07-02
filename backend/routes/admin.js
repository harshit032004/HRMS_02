const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { setLeaveBalance, getAllBalances } = require('../controllers/leaveController');
const AuditLog = require('../models/AuditLog');

const hrAdmin = authorize('admin', 'hr');
const adminOnly = authorize('admin');

router.get('/leave-balance',  protect, hrAdmin, getAllBalances);
router.post('/leave-balance', protect, hrAdmin, setLeaveBalance);

// @route   GET /api/admin/audit-logs
// @desc    Paginated audit log with optional filters
// @access  Admin only
router.get('/audit-logs', protect, adminOnly, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.actor)  filter.actor  = req.query.actor;
    if (req.query.action) filter.action = new RegExp(req.query.action, 'i');

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
