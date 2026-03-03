const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/dashboard/admin
// @desc    Admin/HR dashboard stats
// @access  Private (admin, hr, manager)
router.get('/admin', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalEmployees, activeEmployees, departments, todayAttendance, pendingLeaves, employees] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.distinct('department', { isActive: true }),
        Attendance.countDocuments({ date: today }),
        Leave.countDocuments({ status: 'pending' }),
        User.find({ isActive: true }).select('name email jobTitle department isActive').sort({ createdAt: -1 }),
      ]);

    res.json({
      success: true,
      stats: {
        totalEmployees,
        activeStatus: activeEmployees,
        departments: departments.length,
        todayAttendance,
        pendingLeaves,
      },
      employees,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/dashboard/employee
// @desc    Employee dashboard stats
// @access  Private
router.get('/employee', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [todayAttendance, totalLeaves, pendingLeaves, approvedLeaves] = await Promise.all([
      Attendance.findOne({ employee: req.user.id, date: today }),
      Leave.countDocuments({ employee: req.user.id }),
      Leave.countDocuments({ employee: req.user.id, status: 'pending' }),
      Leave.countDocuments({ employee: req.user.id, status: 'approved' }),
    ]);

    const recentAttendance = await Attendance.find({ employee: req.user.id })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        todayStatus: todayAttendance
          ? todayAttendance.checkOut
            ? 'checked-out'
            : 'checked-in'
          : 'not-checked-in',
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
      },
      recentAttendance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
