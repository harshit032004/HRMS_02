const express = require('express');
const router = express.Router();
const { createGoal, getGoals, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getGoals);
router.post('/', protect, authorize('admin', 'hr', 'manager'), createGoal);
router.put('/:id', protect, updateGoal);
router.delete('/:id', protect, authorize('admin', 'hr', 'manager'), deleteGoal);

module.exports = router;
