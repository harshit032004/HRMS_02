const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Goal = require('../models/Goal');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

// ── Multer config ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/avatars')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private (admin, hr, manager)
router.get('/', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { department, role, isActive, search } = req.query;
    const query = {};

    if (department) query.department = department;
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/employees/:id
// @desc    Get single employee
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    if (req.user.role === 'employee' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/employees/:id/avatar
// @desc    Upload employee avatar
// @access  Private (admin, hr, or own profile)
router.post('/:id/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);
    const isOwnProfile = req.user.id === req.params.id;
    if (!isAdminOrHR && !isOwnProfile) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { avatarUrl },
      { new: true }
    ).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Avatar uploaded successfully', avatarUrl: employee.avatarUrl, employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/employees/:id
// @desc    Partial update employee (name, department, jobTitle, role)
// @access  Private (admin, hr) or own profile (limited fields)
router.patch('/:id', protect, async (req, res) => {
  try {
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);
    const isOwnProfile = req.user.id === req.params.id;
    if (!isAdminOrHR && !isOwnProfile) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const allowedFields = isAdminOrHR
      ? ['name', 'email', 'role', 'department', 'jobTitle', 'isActive']
      : ['name', 'department', 'jobTitle'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const employee = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee updated successfully', employee });

    // Log role changes specifically
    if (updates.role) {
      logAction(req, 'EMPLOYEE_ROLE_CHANGED', 'User', employee._id,
        `${req.user.name} changed ${employee.name}'s role to ${updates.role}`);
    } else if (Object.keys(updates).length) {
      logAction(req, 'EMPLOYEE_UPDATED', 'User', employee._id,
        `${req.user.name} updated ${employee.name}: ${Object.keys(updates).join(', ')}`);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/employees/:id/attendance-summary
// @desc    Attendance summary for an employee
// @access  Private (admin, hr, manager, or self)
router.get('/:id/attendance-summary', protect, async (req, res) => {
  try {
    const isAdminOrHROrManager = ['admin', 'hr', 'manager'].includes(req.user.role);
    const isOwnProfile = req.user.id === req.params.id;
    if (!isAdminOrHROrManager && !isOwnProfile) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const records = await Attendance.find({ employee: req.params.id }).sort({ date: -1 }).limit(60);
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      onLeave: records.filter(r => r.status === 'on-leave').length,
      avgWorkHours: records.length
        ? Math.round((records.reduce((s, r) => s + (r.workHours || 0), 0) / records.length) * 10) / 10
        : 0,
      recent: records.slice(0, 15),
    };
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/employees/:id/leaves
// @desc    Leave history for an employee
// @access  Private (admin, hr, manager, or self)
router.get('/:id/leaves', protect, async (req, res) => {
  try {
    const isAdminOrHROrManager = ['admin', 'hr', 'manager'].includes(req.user.role);
    const isOwnProfile = req.user.id === req.params.id;
    if (!isAdminOrHROrManager && !isOwnProfile) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const leaves = await Leave.find({ employee: req.params.id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/employees/:id/goals
// @desc    Goals for an employee
// @access  Private (admin, hr, manager, or self)
router.get('/:id/goals', protect, async (req, res) => {
  try {
    const isAdminOrHROrManager = ['admin', 'hr', 'manager'].includes(req.user.role);
    const isOwnProfile = req.user.id === req.params.id;
    if (!isAdminOrHROrManager && !isOwnProfile) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const goals = await Goal.find({ assignedTo: req.params.id })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (admin, hr)
router.post('/', protect, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { name, email, password, role, department, jobTitle } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });
    const employee = await User.create({
      name, email,
      password: password || 'password123',
      role: role || 'employee',
      department, jobTitle,
    });
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: employee._id, name: employee.name, email: employee.email,
        role: employee.role, department: employee.department,
        jobTitle: employee.jobTitle, employeeId: employee.employeeId,
        isActive: employee.isActive,
      },
    });

    logAction(req, 'EMPLOYEE_CREATED', 'User', employee._id,
      `${req.user.name} created employee ${employee.name} (${employee.role})`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Full update employee
// @access  Private (admin, hr) or own profile
router.put('/:id', protect, async (req, res) => {
  try {
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);
    const isOwnProfile = req.user.id === req.params.id;
    if (!isAdminOrHR && !isOwnProfile) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const allowedFields = isAdminOrHR
      ? ['name', 'email', 'role', 'department', 'jobTitle', 'isActive']
      : ['name', 'department', 'jobTitle'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const employee = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    }).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee updated successfully', employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Deactivate employee
// @access  Private (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const employee = await User.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    ).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deactivated successfully', employee });

    logAction(req, 'EMPLOYEE_DEACTIVATED', 'User', employee._id,
      `${req.user.name} deactivated ${employee.name}`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/employees/stats/overview
router.get('/stats/overview', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ isActive: true });
    const departments = await User.distinct('department', { isActive: true });
    res.json({ success: true, stats: { totalEmployees, activeStatus: totalEmployees, departments: departments.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
