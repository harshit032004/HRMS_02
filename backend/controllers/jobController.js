const Job = require('../models/Job');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (hr, admin)
const createJob = async (req, res) => {
  try {
    const { title, department, description, requiredSkills, location, status } = req.body;

    if (!title || !department || !description || !location) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const job = await Job.create({
      title,
      department,
      description,
      requiredSkills: requiredSkills || [],
      location,
      status: status || 'open',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all job postings
// @route   GET /api/jobs
// @access  Private (all roles)
const getJobs = async (req, res) => {
  try {
    const filter = {};

    // Employees can only see open jobs
    if (req.user.role === 'employee') {
      filter.status = 'open';
    }

    const jobs = await Job.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single job posting
// @route   GET /api/jobs/:id
// @access  Private (all roles)
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update job posting
// @route   PUT /api/jobs/:id
// @access  Private (hr, admin)
const updateJob = async (req, res) => {
  try {
    const { title, department, description, requiredSkills, location, status } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    job.title = title ?? job.title;
    job.department = department ?? job.department;
    job.description = description ?? job.description;
    job.requiredSkills = requiredSkills ?? job.requiredSkills;
    job.location = location ?? job.location;
    job.status = status ?? job.status;

    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/jobs/:id
// @access  Private (hr, admin)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob };
