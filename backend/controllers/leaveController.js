const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc  Apply for leave
// @route POST /api/leaves/apply
// @access Private (any logged-in user)
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
// @access Private (employee sees only their own)
const getMyLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { employee: req.user.id };
    if (status && status !== 'all') query.status = status;

    const leaves = await Leave.find(query)
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

    const leaves = await Leave.find(query)
      .populate('employee', 'name email department jobTitle employeeId')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

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

    res.json({ success: true, message: 'Leave rejected successfully', leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Cancel own pending leave
// @route DELETE /api/leaves/:id
// @access Private (own leave only)
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

module.exports = { applyLeave, getMyLeaves, getAllLeaves, approveLeave, rejectLeave, cancelLeave };
