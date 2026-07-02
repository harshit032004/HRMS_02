const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// ─────────────────────────────────────────────────────────
// GET /api/payroll
// Admin/HR: all records   |   Employee: own records
// ─────────────────────────────────────────────────────────
const getPayrolls = async (req, res) => {
  try {
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);
    const filter = isAdminOrHR ? {} : { employee: req.user.id };

    const { month } = req.query;
    if (month) filter.month = month;

    const payrolls = await Payroll.find(filter)
      .populate('employee', 'name email employeeId department jobTitle')
      .populate('generatedBy', 'name')
      .sort({ month: -1, createdAt: -1 });

    res.json({ success: true, data: payrolls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/payroll/generate
// Generate payroll for ALL active employees for a given month
// Body: { month: 'YYYY-MM', allowances?: Number }
// ─────────────────────────────────────────────────────────
const generatePayroll = async (req, res) => {
  try {
    const { month, allowances = 0 } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'month is required in YYYY-MM format' });
    }

    const employees = await User.find({ isActive: true, role: { $ne: 'admin' } });
    if (employees.length === 0) {
      return res.status(400).json({ success: false, message: 'No active employees found' });
    }

    // Determine absent days for each employee in this month
    const [year, mon] = month.split('-').map(Number);
    // Attendance.date is stored as a 'YYYY-MM-DD' string, so the range bounds
    // must also be strings — ISO-format strings compare lexicographically in
    // the same order as the dates they represent, so this is safe.
    const lastDayOfMonth = new Date(year, mon, 0).getDate();
    const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(mon).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    // Fetch all attendance records for the month in one query
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Map: employeeId -> set of dates they attended
    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      const empId = rec.employee.toString();
      if (!attendanceMap[empId]) attendanceMap[empId] = new Set();
      if (['present', 'half-day'].includes(rec.status)) {
        attendanceMap[empId].add(rec.date); // already a 'YYYY-MM-DD' string
      }
    });

    const workingDays = 22; // standard working days per month
    const results = [];
    const errors = [];

    for (const emp of employees) {
      try {
        const basicSalary = emp.salary || 30000;
        const hra = Math.round(basicSalary * 0.4);
        const presentDays = attendanceMap[emp._id.toString()]?.size || 0;
        const absentDays = Math.max(0, workingDays - presentDays);
        const deductions = Math.round(absentDays * (basicSalary / workingDays));
        const netSalary = basicSalary + hra + Number(allowances) - deductions;

        const payroll = await Payroll.findOneAndUpdate(
          { employee: emp._id, month },
          {
            employee: emp._id,
            month,
            basicSalary,
            hra,
            allowances: Number(allowances),
            deductions,
            netSalary,
            status: 'draft',
            generatedBy: req.user.id,
          },
          { upsert: true, new: true }
        );

        results.push(payroll);
      } catch (empErr) {
        errors.push({ employee: emp.name, error: empErr.message });
      }
    }

    res.json({
      success: true,
      message: `Payroll generated for ${results.length} employees`,
      data: results,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/payroll/:id/mark-paid
// ─────────────────────────────────────────────────────────
const markPaid = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidOn: new Date() },
      { new: true }
    ).populate('employee', 'name email employeeId department jobTitle');

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    res.json({ success: true, data: payroll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/payroll/:id/slip
// Returns slip JSON; employees can only view their own
// ─────────────────────────────────────────────────────────
const getSlip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'name email employeeId department jobTitle')
      .populate('generatedBy', 'name');

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    // Employees can only access their own slip
    if (
      req.user.role === 'employee' &&
      payroll.employee._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: payroll });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPayrolls, generatePayroll, markPaid, getSlip };
