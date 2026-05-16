const express = require('express');
const router = express.Router();
const { createReview, getReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getReviews);
router.post('/', protect, authorize('admin', 'hr', 'manager'), createReview);

module.exports = router;
