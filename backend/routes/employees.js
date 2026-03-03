const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

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
    // Employees can only view their own profile unless admin/hr/manager
    if (
      req.user.role === 'employee' &&
      req.user.id !== req.params.id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, employee });
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
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const employee = await User.create({
      name,
      email,
      password: password || 'password123',
      role: role || 'employee',
      department,
      jobTitle,
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        jobTitle: employee.jobTitle,
        employeeId: employee.employeeId,
        isActive: employee.isActive,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (admin, hr) or own profile
router.put('/:id', protect, async (req, res) => {
  try {
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);
    const isOwnProfile = req.user.id === req.params.id;

    if (!isAdminOrHR && !isOwnProfile) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Employees cannot change role or isActive
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

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee updated successfully', employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee (soft delete - deactivate)
// @access  Private (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deactivated successfully', employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/employees/stats/overview
// @desc    Get employee statistics
// @access  Private (admin, hr, manager)
router.get('/stats/overview', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ isActive: true });
    const activeStatus = await User.countDocuments({ isActive: true });
    const departments = await User.distinct('department', { isActive: true });

    res.json({
      success: true,
      stats: {
        totalEmployees,
        activeStatus,
        departments: departments.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
