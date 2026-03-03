const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

const getTodayDate = () => new Date().toISOString().split('T')[0];

// @route   POST /api/attendance/checkin
// @desc    Clock In
// @access  Private
router.post('/checkin', protect, async (req, res) => {
  try {
    const today = getTodayDate();

    const existing = await Attendance.findOne({ employee: req.user.id, date: today });
    if (existing && existing.checkIn) {
      return res.status(400).json({ success: false, message: 'Already checked in today' });
    }

    let attendance;
    if (existing) {
      existing.checkIn = new Date();
      await existing.save();
      attendance = existing;
    } else {
      attendance = await Attendance.create({
        employee: req.user.id,
        date: today,
        checkIn: new Date(),
        status: 'present',
      });
    }

    res.status(201).json({ success: true, message: 'Checked in successfully', attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/attendance/checkout
// @desc    Clock Out
// @access  Private
router.put('/checkout', protect, async (req, res) => {
  try {
    const today = getTodayDate();

    const attendance = await Attendance.findOne({ employee: req.user.id, date: today });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'No check-in found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save(); // workHours calculated in pre-save hook

    res.json({ success: true, message: 'Checked out successfully', attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance status for logged-in user
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = getTodayDate();
    const attendance = await Attendance.findOne({ employee: req.user.id, date: today });

    res.json({
      success: true,
      attendance: attendance || null,
      status: attendance
        ? attendance.checkOut
          ? 'checked-out'
          : 'checked-in'
        : 'not-checked-in',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/attendance/my
// @desc    Get own attendance history
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { employee: req.user.id };

    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/attendance/all
// @desc    Get all employees attendance (admin/hr/manager)
// @access  Private
router.get('/all', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { date, employeeId } = req.query;
    const query = {};

    if (date) query.date = date;
    if (employeeId) query.employee = employeeId;

    const records = await Attendance.find(query)
      .populate('employee', 'name email department jobTitle employeeId')
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/attendance/employee/:id
// @desc    Get specific employee attendance (admin/hr/manager)
// @access  Private
router.get('/employee/:id', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const records = await Attendance.find({ employee: req.params.id })
      .populate('employee', 'name email employeeId')
      .sort({ date: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
