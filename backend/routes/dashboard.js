const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAdminDashboard, getEmployeeDashboard } = require('../controllers/dashboardController');

// GET /api/dashboard  — HR/Admin sees full stats
router.get('/', protect, authorize('admin', 'hr', 'manager'), getAdminDashboard);

// GET /api/dashboard/admin  — alias
router.get('/admin', protect, authorize('admin', 'hr', 'manager'), getAdminDashboard);

// GET /api/dashboard/employee  — employee personal stats
router.get('/employee', protect, getEmployeeDashboard);

module.exports = router;
