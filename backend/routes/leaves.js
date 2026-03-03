const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/leaves/apply
// @desc    Apply for leave
// @access  Private
router.post('/apply', protect, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Start date, end date, and reason are required' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
    }

    const leave = await Leave.create({
      employee: req.user.id,
      startDate,
      endDate,
      reason,
    });

    await leave.populate('employee', 'name email department');

    res.status(201).json({ success: true, message: 'Leave application submitted successfully', leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/leaves/my
// @desc    Get own leave history
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/leaves/all
// @desc    Get all leave requests (admin, hr, manager)
// @access  Private
router.get('/all', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('employee', 'name email department jobTitle employeeId')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/leaves/:id/review
// @desc    Approve or reject a leave (admin, hr, manager)
// @access  Private
router.put('/:id/review', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave has already been reviewed' });
    }

    leave.status = status;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote || '';
    await leave.save();

    await leave.populate('employee', 'name email department');
    await leave.populate('reviewedBy', 'name');

    res.json({ success: true, message: `Leave ${status} successfully`, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/leaves/:id
// @desc    Cancel leave application (own pending only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
    }

    await leave.deleteOne();
    res.json({ success: true, message: 'Leave application cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
