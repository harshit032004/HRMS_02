const Review = require('../models/Review');

// @desc  Create a performance review
// @route POST /api/reviews
// @access Private (hr, admin, manager)
const createReview = async (req, res) => {
  try {
    const { employee, period, overallRating, strengths, areasOfImprovement, comments } = req.body;

    if (!employee || !period || !overallRating) {
      return res.status(400).json({ success: false, message: 'Employee, period, and overallRating are required' });
    }

    const review = await Review.create({
      employee,
      reviewedBy: req.user.id,
      period,
      overallRating,
      strengths,
      areasOfImprovement,
      comments,
    });

    const populated = await review.populate([
      { path: 'employee', select: 'name email department employeeId' },
      { path: 'reviewedBy', select: 'name' },
    ]);

    res.status(201).json({ success: true, review: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get reviews (manager: all; employee: their own)
// @route GET /api/reviews
// @access Private
const getReviews = async (req, res) => {
  try {
    const isManagerOrHR = ['admin', 'hr', 'manager'].includes(req.user.role);
    const filter = isManagerOrHR ? {} : { employee: req.user.id };

    const reviews = await Review.find(filter)
      .populate('employee', 'name email department employeeId')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createReview, getReviews };
