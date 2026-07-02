const Leave = require('../models/Leave');
const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');

// Helper: after populate, fix any leaves where employee is still null
// This happens when old leave records reference deleted/re-seeded user IDs
const fixOrphanedEmployees = async (leaves) => {
  // Get all unique employee IDs that failed to populate (employee is null or not an object)
  const orphanedLeaves = leaves.filter(
    (l) => !l.employee || typeof l.employee !== 'object' || !l.employee.name
  );

  if (orphanedLeaves.length === 0) return leaves;

  // Try to find users by matching all users and map by _id
  const allUsers = await User.find({}).select('name email department jobTitle employeeId');
  const userMap = {};
  allUsers.forEach((u) => { userMap[u._id.toString()] = u; });

  // Patch each orphaned leave with the found user
  leaves.forEach((leave) => {
    const empId = leave.employee?._id
      ? leave.employee._id.toString()
      : leave.employee?.toString?.() || '';

    if (!leave.employee || typeof leave.employee !== 'object' || !leave.employee.name) {
      const foundUser = userMap[empId];
      if (foundUser) {
        leave.employee = foundUser;
      }
      // If still not found, leave it — frontend will show "Unknown Employee"
    }
  });

  return leaves;
};

// @desc  Apply for leave
// @route POST /api/leaves/apply
// @access Private
const applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Start date, end date, and reason are required',
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date',
      });
    }

    const leave = await Leave.create({
      employee: req.user.id,
      startDate,
      endDate,
      reason,
      leaveType: leaveType || 'casual',
      status: 'pending',
    });

    await leave.populate('employee', 'name email department employeeId');

    logAction(req, 'LEAVE_APPLIED', 'Leave', leave._id,
      `${req.user.name} applied for ${leave.leaveType} leave (${leave.startDate?.toISOString?.().slice(0,10)} → ${leave.endDate?.toISOString?.().slice(0,10)})`);

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get own leave history
// @route GET /api/leaves/my
// @access Private
const getMyLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { employee: req.user.id };
    if (status && status !== 'all') query.status = status;

    const leaves = await Leave.find(query)
      .populate('employee', 'name email department employeeId')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all leave requests (HR/Admin/Manager only)
// @route GET /api/leaves/all
// @access Private (hr, admin, manager)
const getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    let leaves = await Leave.find(query)
      .populate('employee', 'name email department jobTitle employeeId')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    // Fix any old/orphaned records where populate returned null
    leaves = await fixOrphanedEmployees(leaves);

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve a leave request
// @route PATCH /api/leaves/:id/approve
// @access Private (hr, admin, manager)
const approveLeave = async (req, res) => {
  try {
    const { reviewNote } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave is already ${leave.status}. Cannot approve again.`,
      });
    }

    leave.status = 'approved';
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote || '';
    await leave.save();

    await leave.populate('employee', 'name email department employeeId');
    await leave.populate('reviewedBy', 'name');

    logAction(req, 'LEAVE_APPROVED', 'Leave', leave._id,
      `${req.user.name} approved ${leave.employee?.name}'s ${leave.leaveType} leave`);

    res.json({ success: true, message: 'Leave approved successfully', leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reject a leave request
// @route PATCH /api/leaves/:id/reject
// @access Private (hr, admin, manager)
const rejectLeave = async (req, res) => {
  try {
    const { reviewNote } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave is already ${leave.status}. Cannot reject again.`,
      });
    }

    leave.status = 'rejected';
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote || '';
    await leave.save();

    await leave.populate('employee', 'name email department employeeId');
    await leave.populate('reviewedBy', 'name');

    logAction(req, 'LEAVE_REJECTED', 'Leave', leave._id,
      `${req.user.name} rejected ${leave.employee?.name}'s ${leave.leaveType} leave`);

    res.json({ success: true, message: 'Leave rejected successfully', leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Cancel own pending leave
// @route DELETE /api/leaves/:id
// @access Private
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this leave' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leaves can be cancelled',
      });
    }

    await leave.deleteOne();
    res.json({ success: true, message: 'Leave application cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// ─── Leave Balance ────────────────────────────────────────────────────────────
const LeaveBalance = require('../models/LeaveBalance');

// Helper: compute used days for a specific leave type this year (approved leaves only)
const computeUsed = async (employeeId, year, leaveType) => {
  const startOfYear = `${year}-01-01`;
  const endOfYear   = `${year}-12-31`;
  const leaves = await Leave.find({
    employee: employeeId,
    status: 'approved',
    leaveType,
    startDate: { $gte: startOfYear, $lte: endOfYear },
  });
  return leaves.reduce((sum, l) => sum + (l.totalDays || 1), 0);
};

// @desc  Get current user's leave balance for this year
// @route GET /api/leaves/balance
// @access Private
const getMyBalance = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ employee: req.user.id, year });

    if (!balance) {
      // Auto-create default balance on first access
      balance = await LeaveBalance.create({ employee: req.user.id, year });
    }

    // Compute used days per type
    const [usedCasual, usedSick, usedEarned, usedOther] = await Promise.all([
      computeUsed(req.user.id, year, 'casual'),
      computeUsed(req.user.id, year, 'sick'),
      computeUsed(req.user.id, year, 'earned'),
      computeUsed(req.user.id, year, 'other'),
    ]);

    res.json({
      success: true,
      balance: {
        year,
        casual:  { allocated: balance.casual,  used: usedCasual,  remaining: Math.max(0, balance.casual  - usedCasual)  },
        sick:    { allocated: balance.sick,     used: usedSick,    remaining: Math.max(0, balance.sick    - usedSick)    },
        earned:  { allocated: balance.earned,   used: usedEarned,  remaining: Math.max(0, balance.earned  - usedEarned)  },
        other:   { allocated: balance.other,    used: usedOther,   remaining: Math.max(0, balance.other   - usedOther)   },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get any employee's leave balance (admin/hr)
// @route GET /api/leaves/balance/:employeeId
// @access Private (admin, hr, manager)
const getEmployeeBalance = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const empId = req.params.employeeId;

    let balance = await LeaveBalance.findOne({ employee: empId, year });
    if (!balance) {
      balance = await LeaveBalance.create({ employee: empId, year });
    }

    const [usedCasual, usedSick, usedEarned, usedOther] = await Promise.all([
      computeUsed(empId, year, 'casual'),
      computeUsed(empId, year, 'sick'),
      computeUsed(empId, year, 'earned'),
      computeUsed(empId, year, 'other'),
    ]);

    res.json({
      success: true,
      balance: {
        year,
        casual:  { allocated: balance.casual,  used: usedCasual,  remaining: Math.max(0, balance.casual  - usedCasual)  },
        sick:    { allocated: balance.sick,     used: usedSick,    remaining: Math.max(0, balance.sick    - usedSick)    },
        earned:  { allocated: balance.earned,   used: usedEarned,  remaining: Math.max(0, balance.earned  - usedEarned)  },
        other:   { allocated: balance.other,    used: usedOther,   remaining: Math.max(0, balance.other   - usedOther)   },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Set/reset leave balance for an employee (admin/hr only)
// @route POST /api/admin/leave-balance
// @access Private (admin, hr)
const setLeaveBalance = async (req, res) => {
  try {
    const { employeeId, year, casual, sick, earned, other } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId is required' });

    const targetYear = year || new Date().getFullYear();

    const balance = await LeaveBalance.findOneAndUpdate(
      { employee: employeeId, year: targetYear },
      {
        $set: {
          ...(casual  !== undefined && { casual:  Number(casual)  }),
          ...(sick    !== undefined && { sick:    Number(sick)    }),
          ...(earned  !== undefined && { earned:  Number(earned)  }),
          ...(other   !== undefined && { other:   Number(other)   }),
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Leave balance updated', balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all employees' balances (admin/hr)
// @route GET /api/admin/leave-balance
// @access Private (admin, hr)
const getAllBalances = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const User = require('../models/User');

    const employees = await User.find({ role: { $in: ['employee', 'manager', 'hr'] }, isActive: true })
      .select('name email department jobTitle employeeId');

    const results = await Promise.all(employees.map(async (emp) => {
      let bal = await LeaveBalance.findOne({ employee: emp._id, year });
      if (!bal) bal = { casual: 12, sick: 10, earned: 15, other: 5 };

      const [usedCasual, usedSick, usedEarned, usedOther] = await Promise.all([
        computeUsed(emp._id, year, 'casual'),
        computeUsed(emp._id, year, 'sick'),
        computeUsed(emp._id, year, 'earned'),
        computeUsed(emp._id, year, 'other'),
      ]);

      return {
        employee: emp,
        year,
        casual: { allocated: bal.casual, used: usedCasual, remaining: Math.max(0, bal.casual - usedCasual) },
        sick:   { allocated: bal.sick,   used: usedSick,   remaining: Math.max(0, bal.sick   - usedSick)   },
        earned: { allocated: bal.earned, used: usedEarned, remaining: Math.max(0, bal.earned - usedEarned) },
        other:  { allocated: bal.other,  used: usedOther,  remaining: Math.max(0, bal.other  - usedOther)  },
      };
    }));

    res.json({ success: true, balances: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  applyLeave, getMyLeaves, getAllLeaves, approveLeave, rejectLeave, cancelLeave,
  getMyBalance, getEmployeeBalance, setLeaveBalance, getAllBalances,
};
