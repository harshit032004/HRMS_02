const Feedback = require('../models/Feedback');

// @desc  Add feedback
// @route POST /api/feedback
// @access Private (hr, admin, manager)
const addFeedback = async (req, res) => {
  try {
    const { employee, goal, feedbackText, rating } = req.body;

    if (!employee || !feedbackText || !rating) {
      return res.status(400).json({ success: false, message: 'Employee, feedbackText, and rating are required' });
    }

    const feedback = await Feedback.create({
      employee,
      givenBy: req.user.id,
      goal: goal || null,
      feedbackText,
      rating,
    });

    const populated = await feedback.populate([
      { path: 'employee', select: 'name email department employeeId' },
      { path: 'givenBy', select: 'name' },
      { path: 'goal', select: 'title' },
    ]);

    res.status(201).json({ success: true, feedback: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get feedback (manager: all; employee: their own)
// @route GET /api/feedback
// @access Private
const getFeedback = async (req, res) => {
  try {
    const isManagerOrHR = ['admin', 'hr', 'manager'].includes(req.user.role);
    const filter = isManagerOrHR ? {} : { employee: req.user.id };

    const feedbacks = await Feedback.find(filter)
      .populate('employee', 'name email department employeeId')
      .populate('givenBy', 'name')
      .populate('goal', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addFeedback, getFeedback };
