const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  getAttendanceInsights,
  getLeaveAnalytics,
  getRecruitmentInsights,
  getPerformanceInsights,
  getActivityFeed,
  getAdminDashboard,
  getEmployeeDashboard,
} = require('../controllers/dashboardController');

const hrOnly  = authorize('admin', 'hr', 'manager');

// Dedicated modular endpoints (MODULE 1–6)
router.get('/stats',       protect, hrOnly, getStats);
router.get('/attendance',  protect, hrOnly, getAttendanceInsights);
router.get('/leaves',      protect, hrOnly, getLeaveAnalytics);
router.get('/recruitment', protect, hrOnly, getRecruitmentInsights);
router.get('/performance', protect, hrOnly, getPerformanceInsights);
router.get('/activity',    protect,         getActivityFeed);

// Combined views
router.get('/admin',    protect, hrOnly, getAdminDashboard);
router.get('/employee', protect,         getEmployeeDashboard);
router.get('/',         protect, hrOnly, getAdminDashboard);

module.exports = router;
