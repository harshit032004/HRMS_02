const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

const hrAdmin = authorize('admin', 'hr');

// Helper: filter out expired announcements
function activeFilter() {
  return {
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };
}

// @route   GET /api/announcements
// @desc    All active announcements, newest first
// @access  Private (all authenticated)
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find(activeFilter())
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/announcements/all
// @desc    All announcements including inactive (admin/hr management view)
// @access  Private (admin, hr)
router.get('/all', protect, hrAdmin, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private (admin, hr)
router.post('/', protect, hrAdmin, async (req, res) => {
  try {
    const { title, body, priority, expiresAt } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }
    const announcement = await Announcement.create({
      title,
      body,
      priority: priority || 'normal',
      expiresAt: expiresAt || null,
      postedBy: req.user.id,
    });
    await announcement.populate('postedBy', 'name role');
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/announcements/:id
// @desc    Update or deactivate an announcement
// @access  Private (admin, hr)
router.patch('/:id', protect, hrAdmin, async (req, res) => {
  try {
    const { title, body, priority, expiresAt, isActive } = req.body;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    if (title     !== undefined) announcement.title     = title;
    if (body      !== undefined) announcement.body      = body;
    if (priority  !== undefined) announcement.priority  = priority;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt || null;
    if (isActive  !== undefined) announcement.isActive  = isActive;
    await announcement.save();
    await announcement.populate('postedBy', 'name role');
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Hard-delete an announcement
// @access  Private (admin, hr)
router.delete('/:id', protect, hrAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    await announcement.deleteOne();
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
