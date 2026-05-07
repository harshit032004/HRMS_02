const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');

// All routes require authentication
router.use(protect);

// GET all jobs - all authenticated users (employees see only open jobs)
// POST create job - hr/admin only
router.route('/')
  .get(getJobs)
  .post(authorize('hr', 'admin'), createJob);

// GET single job - all authenticated users
// PUT update job - hr/admin only
// DELETE job - hr/admin only
router.route('/:id')
  .get(getJobById)
  .put(authorize('hr', 'admin'), updateJob)
  .delete(authorize('hr', 'admin'), deleteJob);

module.exports = router;
