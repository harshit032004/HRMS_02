const Goal = require('../models/Goal');

// @desc  Create a new goal
// @route POST /api/goals
// @access Private (hr, admin, manager)
const createGoal = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority } = req.body;

    if (!title || !assignedTo || !deadline) {
      return res.status(400).json({ success: false, message: 'Title, assignedTo, and deadline are required' });
    }

    const goal = await Goal.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      deadline,
      priority: priority || 'medium',
    });

    const populated = await goal.populate([
      { path: 'assignedTo', select: 'name email department employeeId' },
      { path: 'assignedBy', select: 'name' },
    ]);

    res.status(201).json({ success: true, goal: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all goals (manager: all; employee: their own)
// @route GET /api/goals
// @access Private
const getGoals = async (req, res) => {
  try {
    const isManagerOrHR = ['admin', 'hr', 'manager'].includes(req.user.role);
    const filter = isManagerOrHR ? {} : { assignedTo: req.user.id };

    const goals = await Goal.find(filter)
      .populate('assignedTo', 'name email department employeeId')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update a goal
// @route PUT /api/goals/:id
// @access Private
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const isManagerOrHR = ['admin', 'hr', 'manager'].includes(req.user.role);
    const isAssignedEmployee = goal.assignedTo.toString() === req.user.id;

    if (!isManagerOrHR && !isAssignedEmployee) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Employees can only update status and progress
    if (!isManagerOrHR) {
      const { status, progress } = req.body;
      if (status) goal.status = status;
      if (progress !== undefined) goal.progress = progress;
    } else {
      const { title, description, assignedTo, deadline, priority, status, progress } = req.body;
      if (title) goal.title = title;
      if (description !== undefined) goal.description = description;
      if (assignedTo) goal.assignedTo = assignedTo;
      if (deadline) goal.deadline = deadline;
      if (priority) goal.priority = priority;
      if (status) goal.status = status;
      if (progress !== undefined) goal.progress = progress;
    }

    await goal.save();
    const updated = await goal.populate([
      { path: 'assignedTo', select: 'name email department employeeId' },
      { path: 'assignedBy', select: 'name' },
    ]);

    res.json({ success: true, goal: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete a goal
// @route DELETE /api/goals/:id
// @access Private (hr, admin, manager)
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    await goal.deleteOne();
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createGoal, getGoals, updateGoal, deleteGoal };
