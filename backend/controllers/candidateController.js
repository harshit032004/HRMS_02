const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

// @desc    Add a new candidate
// @route   POST /api/candidates
// @access  Private (hr, admin)
const addCandidate = async (req, res) => {
  try {
    const { name, email, phone, appliedJob, resumeLink, notes } = req.body;

    if (!name || !email || !phone || !appliedJob) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    // Check if job exists
    const job = await Job.findById(appliedJob);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Check for duplicate candidate for the same job
    const existing = await Candidate.findOne({ email, appliedJob });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This candidate already applied for this job' });
    }

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      appliedJob,
      resumeLink: resumeLink || '',
      notes: notes || '',
      addedBy: req.user._id,
    });

    await candidate.populate('appliedJob', 'title department');
    res.status(201).json({ success: true, data: candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all candidates with optional filters
// @route   GET /api/candidates
// @access  Private (hr, admin)
const getCandidates = async (req, res) => {
  try {
    const { job, status } = req.query;
    const filter = {};

    if (job) filter.appliedJob = job;
    if (status) filter.status = status;

    const candidates = await Candidate.find(filter)
      .populate('appliedJob', 'title department')
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: candidates.length, data: candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update candidate status (move through pipeline)
// @route   PATCH /api/candidates/:id/status
// @access  Private (hr, admin)
const updateCandidateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const VALID_STATUSES = ['Applied', 'Screening', 'Interview', 'Selected', 'Rejected'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    candidate.status = status;
    if (notes !== undefined) candidate.notes = notes;
    await candidate.save();

    await candidate.populate('appliedJob', 'title department');
    res.json({ success: true, data: candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update candidate details
// @route   PUT /api/candidates/:id
// @access  Private (hr, admin)
const updateCandidate = async (req, res) => {
  try {
    const { name, email, phone, resumeLink, notes } = req.body;

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    candidate.name = name ?? candidate.name;
    candidate.email = email ?? candidate.email;
    candidate.phone = phone ?? candidate.phone;
    candidate.resumeLink = resumeLink ?? candidate.resumeLink;
    candidate.notes = notes ?? candidate.notes;

    await candidate.save();
    await candidate.populate('appliedJob', 'title department');
    res.json({ success: true, data: candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a candidate
// @route   DELETE /api/candidates/:id
// @access  Private (hr, admin)
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    await candidate.deleteOne();
    res.json({ success: true, message: 'Candidate removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recruitment dashboard stats
// @route   GET /api/candidates/stats
// @access  Private (hr, admin)
const getRecruitmentStats = async (req, res) => {
  try {
    const [totalJobs, openJobs, totalCandidates, byStatus] = await Promise.all([
      require('../models/Job').countDocuments(),
      require('../models/Job').countDocuments({ status: 'open' }),
      Candidate.countDocuments(),
      Candidate.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
    ]);

    const statusMap = {};
    byStatus.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      stats: {
        totalJobs,
        openJobs,
        totalCandidates,
        applied:    statusMap['Applied']   || 0,
        screening:  statusMap['Screening'] || 0,
        interview:  statusMap['Interview'] || 0,
        selected:   statusMap['Selected']  || 0,
        rejected:   statusMap['Rejected']  || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addCandidate, getCandidates, updateCandidateStatus, updateCandidate, deleteCandidate, getRecruitmentStats };
