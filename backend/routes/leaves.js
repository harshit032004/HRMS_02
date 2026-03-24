const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
} = require('../controllers/leaveController');

// Employee routes
router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.delete('/:id', protect, cancelLeave);

// HR/Admin/Manager routes
router.get('/all', protect, authorize('admin', 'hr', 'manager'), getAllLeaves);
router.patch('/:id/approve', protect, authorize('admin', 'hr', 'manager'), approveLeave);
router.patch('/:id/reject', protect, authorize('admin', 'hr', 'manager'), rejectLeave);

// Legacy PUT support (keeps backward compatibility)
router.put('/:id/review', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  const { status, reviewNote } = req.body;
  req.body.reviewNote = reviewNote;
  if (status === 'approved') return approveLeave(req, res);
  if (status === 'rejected') return rejectLeave(req, res);
  return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
});

module.exports = router;
