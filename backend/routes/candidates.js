const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  addCandidate,
  getCandidates,
  updateCandidateStatus,
  updateCandidate,
  deleteCandidate,
  getRecruitmentStats,
} = require('../controllers/candidateController');

// All routes require authentication + hr/admin role
router.use(protect);
router.use(authorize('hr', 'admin'));

// Recruitment stats
router.get('/stats', getRecruitmentStats);

// GET all candidates (with optional ?job=&status= filters)
// POST add candidate
router.route('/')
  .get(getCandidates)
  .post(addCandidate);

// PUT update candidate details
// DELETE candidate
router.route('/:id')
  .put(updateCandidate)
  .delete(deleteCandidate);

// PATCH update candidate status only
router.patch('/:id/status', updateCandidateStatus);

module.exports = router;
