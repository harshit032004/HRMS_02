const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

// @desc  HR/Admin dashboard stats
// @route GET /api/dashboard
// @access Private (hr, admin, manager)
const getAdminDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalEmployees,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      todayAttendance,
      recentLeaves,
      employees,
    ] = await Promise.all([
      User.countDocuments({ isActive: true, role: { $in: ['employee', 'manager'] } }),
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Leave.countDocuments({ status: 'rejected' }),
      Attendance.countDocuments({ date: today }),
      Leave.find({ status: 'pending' })
        .populate('employee', 'name department employeeId')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find({ isActive: true })
        .select('name email jobTitle department role employeeId isActive createdAt')
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      stats: {
        totalEmployees,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        todayAttendance,
        totalLeaves: pendingLeaves + approvedLeaves + rejectedLeaves,
      },
      recentLeaves,
      employees,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Employee dashboard stats
// @route GET /api/dashboard/employee
// @access Private
const getEmployeeDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      todayAttendance,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      recentLeaves,
    ] = await Promise.all([
      Attendance.findOne({ employee: req.user.id, date: today }),
      Leave.countDocuments({ employee: req.user.id }),
      Leave.countDocuments({ employee: req.user.id, status: 'pending' }),
      Leave.countDocuments({ employee: req.user.id, status: 'approved' }),
      Leave.countDocuments({ employee: req.user.id, status: 'rejected' }),
      Leave.find({ employee: req.user.id })
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

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
        rejectedLeaves,
      },
      recentLeaves,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAdminDashboard, getEmployeeDashboard };
