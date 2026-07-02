const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPayrolls,
  generatePayroll,
  markPaid,
  getSlip,
} = require('../controllers/payrollController');

// All payroll routes require authentication
router.use(protect);

// GET  /api/payroll        — list (admin/hr: all, employee: own)
router.get('/', getPayrolls);

// POST /api/payroll/generate  — admin/hr only
router.post('/generate', authorize('admin', 'hr'), generatePayroll);

// PATCH /api/payroll/:id/mark-paid  — admin/hr only
router.patch('/:id/mark-paid', authorize('admin', 'hr'), markPaid);

// GET /api/payroll/:id/slip  — authenticated; own record for employees
router.get('/:id/slip', getSlip);

module.exports = router;
