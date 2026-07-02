const User         = require('../models/User');
const Leave        = require('../models/Leave');
const Attendance   = require('../models/Attendance');
const Job          = require('../models/Job');
const Candidate    = require('../models/Candidate');
const Goal         = require('../models/Goal');
const Feedback     = require('../models/Feedback');
const Review       = require('../models/Review');
const Chat         = require('../models/Chat');
const Announcement = require('../models/Announcement');

// ── helpers ──────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function buildActivityFeed(leaves, candidates, goals, feedbacks) {
  const items = [];
  leaves.slice(0, 5).forEach(l => {
    const name = l.employee?.name || 'An employee';
    if (l.status === 'pending')
      items.push({ type: 'leave_request',  message: `${name} applied for ${l.leaveType} leave`,              time: l.createdAt,            icon: 'leave'    });
    else if (l.status === 'approved')
      items.push({ type: 'leave_approved', message: `Leave approved for ${name}`,                             time: l.reviewedAt||l.updatedAt, icon: 'check' });
    else if (l.status === 'rejected')
      items.push({ type: 'leave_rejected', message: `Leave rejected for ${name}`,                             time: l.reviewedAt||l.updatedAt, icon: 'x'     });
  });
  candidates.slice(0, 4).forEach(c => {
    items.push({ type: 'candidate',          message: `${c.name} applied for ${c.appliedJob?.title || 'a position'}`, time: c.createdAt, icon: 'candidate' });
    if (c.status === 'Selected')
      items.push({ type: 'candidate_selected', message: `${c.name} was selected`,                             time: c.updatedAt, icon: 'star' });
  });
  goals.slice(0, 4).forEach(g => {
    if (g.status === 'completed')
      items.push({ type: 'goal_completed', message: `${g.assignedTo?.name || 'Employee'} completed: "${g.title}"`, time: g.updatedAt, icon: 'goal' });
    else
      items.push({ type: 'goal_assigned',  message: `Goal "${g.title}" assigned to ${g.assignedTo?.name || 'employee'}`, time: g.createdAt, icon: 'goal' });
  });
  feedbacks.slice(0, 3).forEach(f => {
    items.push({ type: 'feedback', message: `${f.givenBy?.name || 'Manager'} gave feedback to ${f.employee?.name || 'employee'}`, time: f.createdAt, icon: 'feedback' });
  });
  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12);
}

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/stats
// ─────────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const todayStr = today();
    const totalEmpFilter = { role: { $in: ['employee', 'manager'] }, isActive: true };

    const [
      totalEmployees,
      presentToday,
      absentToday,
      pendingLeaves,
      approvedLeaves,
      activeJobs,
      totalCandidates,
      goalsAssigned,
      completedGoals,
      announcements,
    ] = await Promise.all([
      User.countDocuments(totalEmpFilter),
      Attendance.countDocuments({ date: todayStr, status: { $in: ['present', 'half-day'] } }),
      Attendance.countDocuments({ date: todayStr, status: 'absent' }),
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Job.countDocuments({ status: 'open' }),
      Candidate.countDocuments(),
      Goal.countDocuments(),
      Goal.countDocuments({ status: 'completed' }),
      Announcement.find({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
        .populate('postedBy', 'name')
        .sort({ priority: -1, createdAt: -1 }) // urgent first, then newest
        .limit(3),
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        absentToday,
        pendingLeaves,
        approvedLeaves,
        activeJobs,
        totalCandidates,
        goalsAssigned,
        completedGoals,
        announcements,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/attendance
// ─────────────────────────────────────────────────────────────────
const getAttendanceInsights = async (req, res) => {
  try {
    const todayStr = today();
    const days = last7Days();
    const totalEmployees = await User.countDocuments({ role: { $in: ['employee', 'manager'] }, isActive: true });

    // Today summary
    const [presentToday, absentToday, halfDayToday] = await Promise.all([
      Attendance.countDocuments({ date: todayStr, status: 'present' }),
      Attendance.countDocuments({ date: todayStr, status: 'absent' }),
      Attendance.countDocuments({ date: todayStr, status: 'half-day' }),
    ]);

    const checkedIn = presentToday + halfDayToday;
    const attendancePct = totalEmployees > 0 ? Math.round((checkedIn / totalEmployees) * 100) : 0;

    // Weekly trend  ── aggregate by date, status
    const weeklyRaw = await Attendance.aggregate([
      { $match: { date: { $in: days } } },
      { $group: { _id: { date: '$date', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const weeklyMap = {};
    days.forEach(d => { weeklyMap[d] = { date: d, present: 0, absent: 0, halfDay: 0 }; });
    weeklyRaw.forEach(({ _id, count }) => {
      if (!weeklyMap[_id.date]) return;
      if (_id.status === 'present')   weeklyMap[_id.date].present  = count;
      if (_id.status === 'absent')    weeklyMap[_id.date].absent   = count;
      if (_id.status === 'half-day')  weeklyMap[_id.date].halfDay  = count;
    });
    const weeklyTrend = Object.values(weeklyMap);

    // Recent check-ins
    const recentCheckIns = await Attendance.find({ date: todayStr })
      .populate('employee', 'name department jobTitle')
      .sort({ checkIn: -1 })
      .limit(8);

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday: checkedIn,
        absentToday,
        halfDayToday,
        attendancePct,
        weeklyTrend,
        recentCheckIns,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/leaves
// ─────────────────────────────────────────────────────────────────
const getLeaveAnalytics = async (req, res) => {
  try {
    const [pending, approved, rejected, recentLeaves] = await Promise.all([
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Leave.countDocuments({ status: 'rejected' }),
      Leave.find({})
        .populate('employee', 'name department employeeId')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const distribution = [
      { status: 'Pending',  count: pending,  fill: '#f59e0b' },
      { status: 'Approved', count: approved, fill: '#10b981' },
      { status: 'Rejected', count: rejected, fill: '#ef4444' },
    ];

    res.json({
      success: true,
      data: { pending, approved, rejected, total: pending + approved + rejected, distribution, recentLeaves },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/recruitment
// ─────────────────────────────────────────────────────────────────
const getRecruitmentInsights = async (req, res) => {
  try {
    const [totalJobs, activeJobs, totalCandidates, pipelineRaw, recentCandidates] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Candidate.countDocuments(),
      Candidate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Candidate.find({})
        .populate('appliedJob', 'title department')
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    const STAGES = ['Applied', 'Screening', 'Interview', 'Selected', 'Rejected'];
    const pipelineMap = {};
    STAGES.forEach(s => { pipelineMap[s] = 0; });
    pipelineRaw.forEach(({ _id, count }) => { if (_id in pipelineMap) pipelineMap[_id] = count; });

    const pipeline = STAGES.map(stage => ({ stage, count: pipelineMap[stage] }));

    res.json({
      success: true,
      data: { totalJobs, activeJobs, totalCandidates, pipeline, recentCandidates },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/performance
// ─────────────────────────────────────────────────────────────────
const getPerformanceInsights = async (req, res) => {
  try {
    const [
      totalGoals,
      completedGoals,
      inProgressGoals,
      pendingReviews,
      ratingAgg,
      recentGoals,
      recentFeedbacks,
    ] = await Promise.all([
      Goal.countDocuments(),
      Goal.countDocuments({ status: 'completed' }),
      Goal.countDocuments({ status: 'in_progress' }),
      Review.countDocuments({ status: 'pending' }).catch(() => 0),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Goal.find({})
        .populate('assignedTo', 'name department')
        .populate('assignedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(6),
      Feedback.find({})
        .populate('employee', 'name department')
        .populate('givenBy', 'name')
        .sort({ createdAt: -1 })
        .limit(4),
    ]);

    const avgRating = ratingAgg[0]?.avg ? Math.round(ratingAgg[0].avg * 10) / 10 : 0;
    const completionPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalGoals,
        completedGoals,
        inProgressGoals,
        pendingReviews,
        avgRating,
        completionPct,
        recentGoals,
        recentFeedbacks,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/activity
// ─────────────────────────────────────────────────────────────────
const getActivityFeed = async (req, res) => {
  try {
    const isPrivileged = ['admin', 'hr', 'manager'].includes(req.user.role);
    const empFilter    = isPrivileged ? {} : { employee: req.user.id };
    const goalFilter   = isPrivileged ? {} : { assignedTo: req.user.id };

    const [leaves, candidates, goals, feedbacks] = await Promise.all([
      Leave.find(empFilter).populate('employee', 'name').sort({ updatedAt: -1 }).limit(6),
      isPrivileged
        ? Candidate.find({}).populate('appliedJob', 'title').sort({ createdAt: -1 }).limit(6)
        : Promise.resolve([]),
      Goal.find(goalFilter).populate('assignedTo', 'name').sort({ updatedAt: -1 }).limit(6),
      Feedback.find(isPrivileged ? {} : { $or: [{ employee: req.user.id }, { givenBy: req.user.id }] })
        .populate('givenBy', 'name').populate('employee', 'name').sort({ createdAt: -1 }).limit(4),
    ]);
    res.json({ success: true, data: buildActivityFeed(leaves, candidates, goals, feedbacks) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/admin  (full combined — legacy + new)
// ─────────────────────────────────────────────────────────────────
const getAdminDashboard = async (req, res) => {
  try {
    const todayStr = today();
    const totalEmpFilter = { role: { $in: ['employee', 'manager'] }, isActive: true };

    const [
      totalEmployees, presentToday, absentToday,
      pendingLeaves, approvedLeaves, rejectedLeaves,
      activeJobs, totalCandidates,
      totalGoals, completedGoals, inProgressGoals,
      pipelineRaw,
      recentLeaves, recentGoals, recentCandidates, recentFeedbacks,
      employees,
    ] = await Promise.all([
      User.countDocuments(totalEmpFilter),
      Attendance.countDocuments({ date: todayStr, status: { $in: ['present', 'half-day'] } }),
      Attendance.countDocuments({ date: todayStr, status: 'absent' }),
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Leave.countDocuments({ status: 'rejected' }),
      Job.countDocuments({ status: 'open' }),
      Candidate.countDocuments(),
      Goal.countDocuments(),
      Goal.countDocuments({ status: 'completed' }),
      Goal.countDocuments({ status: 'in_progress' }),
      Candidate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Leave.find({}).populate('employee', 'name department employeeId').populate('reviewedBy', 'name').sort({ status: 1, createdAt: -1 }).limit(10),
      Goal.find({}).populate('assignedTo', 'name department').populate('assignedBy', 'name').sort({ createdAt: -1 }).limit(6),
      Candidate.find({}).populate('appliedJob', 'title department').sort({ createdAt: -1 }).limit(6),
      Feedback.find({}).populate('givenBy', 'name').populate('employee', 'name').sort({ createdAt: -1 }).limit(5),
      User.find({ isActive: true }).select('name email jobTitle department role employeeId isActive createdAt').sort({ createdAt: -1 }),
    ]);

    const pipelineMap = { Applied: 0, Screening: 0, Interview: 0, Selected: 0, Rejected: 0 };
    pipelineRaw.forEach(({ _id, count }) => { if (_id in pipelineMap) pipelineMap[_id] = count; });
    const attendancePct = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalEmployees, presentToday, absentToday, attendancePct,
        pendingLeaves, approvedLeaves, rejectedLeaves,
        totalLeaves: pendingLeaves + approvedLeaves + rejectedLeaves,
        activeJobs, totalCandidates,
        totalGoals, completedGoals, inProgressGoals,
      },
      recentLeaves,
      candidatePipeline: pipelineMap,
      recentCandidates,
      recentGoals,
      recentFeedbacks,
      activityFeed: buildActivityFeed(recentLeaves, recentCandidates, recentGoals, recentFeedbacks),
      employees,
    });
  } catch (err) {
    console.error('[Dashboard] admin error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard/employee
// ─────────────────────────────────────────────────────────────────
const getEmployeeDashboard = async (req, res) => {
  try {
    const todayStr = today();
    const [
      todayAttendance,
      totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves,
      recentLeaves,
      totalGoals, completedGoals, inProgressGoals,
      myGoals,
    ] = await Promise.all([
      Attendance.findOne({ employee: req.user.id, date: todayStr }),
      Leave.countDocuments({ employee: req.user.id }),
      Leave.countDocuments({ employee: req.user.id, status: 'pending' }),
      Leave.countDocuments({ employee: req.user.id, status: 'approved' }),
      Leave.countDocuments({ employee: req.user.id, status: 'rejected' }),
      Leave.find({ employee: req.user.id }).populate('reviewedBy', 'name').sort({ createdAt: -1 }).limit(5),
      Goal.countDocuments({ assignedTo: req.user.id }),
      Goal.countDocuments({ assignedTo: req.user.id, status: 'completed' }),
      Goal.countDocuments({ assignedTo: req.user.id, status: 'in_progress' }),
      Goal.find({ assignedTo: req.user.id }).populate('assignedBy', 'name').sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      stats: {
        todayStatus: todayAttendance
          ? (todayAttendance.checkOut ? 'checked-out' : 'checked-in')
          : 'not-checked-in',
        checkInTime:  todayAttendance?.checkIn  || null,
        checkOutTime: todayAttendance?.checkOut || null,
        workHours:    todayAttendance?.workHours || 0,
        totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves,
        totalGoals, completedGoals, inProgressGoals,
      },
      recentLeaves,
      myGoals,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats,
  getAttendanceInsights,
  getLeaveAnalytics,
  getRecruitmentInsights,
  getPerformanceInsights,
  getActivityFeed,
  getAdminDashboard,
  getEmployeeDashboard,
};
