const express = require('express');
const router = express.Router();
const { addFeedback, getFeedback } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getFeedback);
router.post('/', protect, authorize('admin', 'hr', 'manager'), addFeedback);

module.exports = router;
