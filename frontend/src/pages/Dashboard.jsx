import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ChatWidget from '../components/ChatWidget';
import SkeletonLoader from '../components/SkeletonLoader';
import Breadcrumb from '../components/Breadcrumb';

// ══════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════

const cx = (...cls) => cls.filter(Boolean).join(' ');

const COLORS = {
  indigo:  { text: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-500/10',   bar: '#6366f1' },
  blue:    { text: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10',        bar: '#3b82f6' },
  emerald: { text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', bar: '#10b981' },
  amber:   { text: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',     bar: '#f59e0b' },
  red:     { text: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10',         bar: '#ef4444' },
  purple:  { text: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-500/10',   bar: '#a855f7' },
  teal:    { text: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-500/10',       bar: '#14b8a6' },
  sky:     { text: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-500/10',         bar: '#0ea5e9' },
};

// ── StatCard ──────────────────────────────────────────────────────
function StatCard({ label, value, color = 'indigo', icon, sub, trend }) {
  const c = COLORS[color] || COLORS.indigo;
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">{label}</p>
          <p className={cx('text-3xl font-bold mt-1.5', c.text)}>{value ?? '—'}</p>
          {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">{sub}</p>}
          {trend != null && (
            <p className={cx('text-[11px] font-medium mt-1', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
            </p>
          )}
        </div>
        {icon && (
          <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200', c.bg)}>
            <span className={c.text}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────
function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={cx('bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden', className)}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    pending:    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    approved:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    rejected:   'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    completed:  'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
    in_progress:'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    present:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    absent:     'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    'half-day': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    Applied:    'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    Screening:  'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    Interview:  'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    Selected:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    Rejected:   'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    active:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    inactive:   'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 border-gray-200 dark:border-white/10',
  };
  const label = { in_progress: 'In Progress', 'half-day': 'Half Day' }[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');
  return (
    <span className={cx('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border', map[status] || map.inactive)}>{label}</span>
  );
}

// ── Empty state ───────────────────────────────────────────────────
const Empty = ({ emoji = '📭', msg = 'No data yet' }) => (
  <div className="py-10 text-center"><div className="text-2xl mb-2">{emoji}</div><p className="text-sm text-gray-400 dark:text-gray-500">{msg}</p></div>
);

// ── Skeleton (full-page) ──────────────────────────────────────────
// Uses SkeletonLoader for the stat-card row; keeps simple pulse bars
// for chart sections below (no dedicated chart skeleton variant).
const Sk = ({ className = '' }) => <div className={cx('animate-pulse bg-gray-100 dark:bg-white/[0.06] rounded-xl', className)} />;
function DashSkeleton() {
  return (
    <div className="p-8 space-y-6">
      {/* Page header */}
      <div className="space-y-2"><Sk className="h-8 w-56" /><Sk className="h-4 w-72" /></div>
      {/* 8 stat cards — uses the reusable SkeletonLoader */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(8)].map((_, i) => (
          <SkeletonLoader key={i} variant="card" />
        ))}
      </div>
      {/* Chart rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <Sk key={i} className="h-80" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <Sk key={i} className="h-64" />)}</div>
    </div>
  );
}

// ── Recharts shared tooltip style ─────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a2035] border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2.5 shadow-xl text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

// ── timeAgo ───────────────────────────────────────────────────────
const timeAgo = (d) => {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ══════════════════════════════════════════════════════════════════
// MODULE 2: Attendance Insights
// ══════════════════════════════════════════════════════════════════
function AttendanceSection({ data }) {
  if (!data) return <Sk className="h-80" />;
  const { totalEmployees, presentToday, absentToday, attendancePct, weeklyTrend, recentCheckIns } = data;

  // Short day labels
  const chartData = (weeklyTrend || []).map(d => ({
    ...d,
    day: new Date(d.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
  }));

  return (
    <Card title="Attendance Insights" subtitle={`${attendancePct}% present today`}
      action={<a href="/attendance" className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium">View all →</a>}>

      {/* Mini summary row */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4 pb-2">
        {[
          { label: 'Present', val: presentToday, cls: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Absent',  val: absentToday,  cls: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10'         },
          { label: 'Total',   val: totalEmployees, cls: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10'  },
        ].map(({ label, val, cls, bg }) => (
          <div key={label} className={cx('rounded-xl p-2.5 text-center', bg)}>
            <p className={cx('text-xl font-bold', cls)}>{val}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Attendance % bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">Attendance rate</span>
          <span className="text-[11px] font-bold text-emerald-500">{attendancePct}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5">
          <div className="h-2 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${attendancePct}%` }} />
        </div>
      </div>

      {/* Weekly trend chart */}
      {chartData.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">7-Day Trend</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} barSize={8} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="absent"  name="Absent"  fill="#f87171" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent check-ins */}
      {recentCheckIns?.length > 0 && (
        <div className="border-t border-gray-50 dark:border-white/[0.04]">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Today's Check-ins</p>
          {recentCheckIns.slice(0, 4).map(a => (
            <div key={a._id} className="flex items-center justify-between px-4 py-2 border-b border-gray-50 dark:border-white/[0.03] last:border-0">
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{a.employee?.name || '—'}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{a.employee?.department || ''}</p>
              </div>
              <div className="text-right">
                <Badge status={a.status} />
                {a.checkIn && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{new Date(a.checkIn).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 3: Leave Analytics
// ══════════════════════════════════════════════════════════════════
const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444'];

function LeaveAnalyticsSection({ data }) {
  if (!data) return <Sk className="h-80" />;
  const { pending, approved, rejected, total, distribution, recentLeaves } = data;
  const [tab, setTab] = useState('pending');
  const filtered = (recentLeaves || []).filter(l => tab === 'pending' ? l.status === 'pending' : l.status !== 'pending');

  return (
    <Card title="Leave Analytics" subtitle={`${total} total requests`}
      action={<a href="/leave-approvals" className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium">Manage →</a>}>

      {/* Pie chart */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <ResponsiveContainer width={90} height={90}>
          <PieChart>
            <Pie data={distribution} dataKey="count" cx="50%" cy="50%" innerRadius={25} outerRadius={42} paddingAngle={3}>
              {distribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2">
          {[{ label: 'Pending', val: pending, cls: 'text-amber-500',   dot: 'bg-amber-400'   },
            { label: 'Approved',val: approved,cls: 'text-emerald-500', dot: 'bg-emerald-400' },
            { label: 'Rejected',val: rejected,cls: 'text-red-500',     dot: 'bg-red-400'     }].map(({ label, val, cls, dot }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cx('w-2 h-2 rounded-full flex-shrink-0', dot)} />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16">{label}</span>
              <span className={cx('text-sm font-bold', cls)}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-2 pb-1">
        {[{ id: 'pending', label: 'Pending' }, { id: 'recent', label: 'Recent' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', tab === t.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Leave list */}
      <div className="px-4 pb-4 space-y-2">
        {filtered.length === 0
          ? <Empty emoji="🎉" msg={tab === 'pending' ? 'No pending requests' : 'No recent leaves'} />
          : filtered.slice(0, 4).map(l => (
            <div key={l._id} className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{l.employee?.name || '—'}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {l.startDate} → {l.endDate} · <span className="capitalize">{l.leaveType}</span> · {l.totalDays}d
                  </p>
                </div>
                <Badge status={l.status} />
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 4: Recruitment Insights
// ══════════════════════════════════════════════════════════════════
const STAGE_COLORS = { Applied: '#6366f1', Screening: '#f59e0b', Interview: '#a855f7', Selected: '#10b981', Rejected: '#ef4444' };

function RecruitmentSection({ data }) {
  if (!data) return <Sk className="h-80" />;
  const { totalJobs, activeJobs, totalCandidates, pipeline, recentCandidates } = data;

  return (
    <Card title="Recruitment Pipeline" subtitle={`${activeJobs} open roles · ${totalCandidates} candidates`}
      action={<a href="/candidates" className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium">View all →</a>}>

      {/* Pipeline bar chart */}
      <div className="px-4 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={pipeline} barSize={22} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="count" name="Candidates" radius={[4,4,0,0]}>
              {(pipeline || []).map((entry, i) => (
                <Cell key={i} fill={STAGE_COLORS[entry.stage] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Count tiles */}
      <div className="grid grid-cols-5 gap-1.5 px-4 pb-4">
        {(pipeline || []).map(({ stage, count }) => {
          const fill = STAGE_COLORS[stage] || '#6366f1';
          return (
            <div key={stage} style={{ background: fill + '15', border: `1px solid ${fill}30` }} className="rounded-xl p-2 text-center">
              <p className="text-base font-bold" style={{ color: fill }}>{count}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{stage}</p>
            </div>
          );
        })}
      </div>

      {/* Recent candidates */}
      {recentCandidates?.length > 0 && (
        <div className="border-t border-gray-50 dark:border-white/[0.04] pb-2">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Recent</p>
          {recentCandidates.slice(0, 3).map(c => (
            <div key={c._id} className="flex items-center justify-between px-4 py-2 border-b border-gray-50 dark:border-white/[0.03] last:border-0">
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{c.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{c.appliedJob?.title || '—'}</p>
              </div>
              <Badge status={c.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 5: Performance Insights
// ══════════════════════════════════════════════════════════════════
function PerformanceSection({ data }) {
  if (!data) return <Sk className="h-64" />;
  const { totalGoals, completedGoals, inProgressGoals, pendingReviews, avgRating, completionPct, recentGoals, recentFeedbacks } = data;

  const goalChartData = [
    { name: 'Completed',   value: completedGoals,  fill: '#10b981' },
    { name: 'In Progress', value: inProgressGoals,  fill: '#3b82f6' },
    { name: 'Pending',     value: Math.max(0, totalGoals - completedGoals - inProgressGoals), fill: '#e5e7eb' },
  ];

  return (
    <Card title="Performance Insights" subtitle="Goals & feedback overview"
      action={<a href="/goals" className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium">Manage →</a>}>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 pt-4 pb-3">
        {[
          { label: 'Total Goals', val: totalGoals,      cls: 'text-gray-900 dark:text-white' },
          { label: 'Completed',   val: completedGoals,  cls: 'text-teal-500' },
          { label: 'In Progress', val: inProgressGoals, cls: 'text-blue-500' },
          { label: 'Avg Rating',  val: avgRating ? `${avgRating}★` : '—', cls: 'text-amber-500' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-2.5 text-center border border-gray-100 dark:border-white/5">
            <p className={cx('text-lg font-bold', cls)}>{val}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Donut + completion % */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <ResponsiveContainer width={70} height={70}>
          <PieChart>
            <Pie data={goalChartData} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={33} paddingAngle={2}>
              {goalChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Completion</span>
            <span className="text-xs font-bold text-teal-500">{completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5">
            <div className="h-2 rounded-full bg-teal-500 transition-all duration-700" style={{ width: `${completionPct}%` }} />
          </div>
          {pendingReviews > 0 && (
            <p className="text-[11px] text-amber-500 mt-1.5">{pendingReviews} review{pendingReviews > 1 ? 's' : ''} pending</p>
          )}
        </div>
      </div>

      {/* Recent goals */}
      {recentGoals?.length > 0 && (
        <div className="border-t border-gray-50 dark:border-white/[0.04]">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Recent Goals</p>
          {recentGoals.slice(0, 3).map(g => (
            <div key={g._id} className="flex items-center justify-between px-4 py-2 border-b border-gray-50 dark:border-white/[0.03] last:border-0">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{g.title}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{g.assignedTo?.name || '—'}</p>
              </div>
              <Badge status={g.status} />
            </div>
          ))}
        </div>
      )}

      {/* Feedback ratings */}
      {recentFeedbacks?.length > 0 && (
        <div className="border-t border-gray-50 dark:border-white/[0.04] px-4 pt-3 pb-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Recent Feedback</p>
          {recentFeedbacks.slice(0, 2).map(f => (
            <div key={f._id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{f.employee?.name}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => <span key={n} className={cx('text-xs', n <= f.rating ? 'text-amber-400' : 'text-gray-200 dark:text-white/10')}>★</span>)}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{f.feedbackText}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 6: Activity Feed
// ══════════════════════════════════════════════════════════════════
const ACT_CFG = {
  leave_request:     { icon: '📝', dot: 'bg-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10'     },
  leave_approved:    { icon: '✅', dot: 'bg-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  leave_rejected:    { icon: '❌', dot: 'bg-red-400',     bg: 'bg-red-50 dark:bg-red-500/10'         },
  candidate:         { icon: '👤', dot: 'bg-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-500/10'   },
  candidate_selected:{ icon: '⭐', dot: 'bg-purple-400',  bg: 'bg-purple-50 dark:bg-purple-500/10'   },
  goal_completed:    { icon: '🎯', dot: 'bg-teal-400',    bg: 'bg-teal-50 dark:bg-teal-500/10'       },
  goal_assigned:     { icon: '📌', dot: 'bg-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10'       },
  feedback:          { icon: '💬', dot: 'bg-gray-400',    bg: 'bg-gray-50 dark:bg-white/[0.03]'      },
};

function ActivitySection({ activities }) {
  return (
    <Card title="Recent Activity" subtitle="Latest system events">
      <div className="p-4 space-y-2">
        {!activities?.length
          ? <Empty emoji="⚡" msg="No recent activity" />
          : activities.map((act, i) => {
              const cfg = ACT_CFG[act.type] || ACT_CFG.feedback;
              return (
                <div key={i} className={cx('rounded-xl px-3.5 py-2.5 flex items-start gap-3', cfg.bg)}>
                  <div className={cx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', cfg.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{act.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(act.time)}</p>
                  </div>
                  <span className="text-sm flex-shrink-0">{cfg.icon}</span>
                </div>
              );
            })}
      </div>
    </Card>
  );
}

// ── AnnouncementsCard ─────────────────────────────────────────────
const ANN_BORDER = { urgent: 'border-l-red-500', normal: 'border-l-blue-500', low: 'border-l-gray-300 dark:border-l-gray-600' };
const ANN_BADGE  = { urgent: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400', normal: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', low: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400' };

function AnnouncementsCard({ announcements, onViewAll }) {
  if (!announcements) return null;
  return (
    <Card
      title="Announcements"
      subtitle="Company-wide updates"
      action={
        announcements.length > 0 && (
          <button onClick={onViewAll} className="text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            View all →
          </button>
        )
      }
    >
      <div className="p-4 space-y-3">
        {announcements.length === 0
          ? <Empty emoji="📢" msg="No announcements right now" />
          : announcements.slice(0, 3).map(ann => (
              <div key={ann._id} className={cx('border-l-4 pl-3.5 py-1', ANN_BORDER[ann.priority] || ANN_BORDER.normal)}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cx('text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full', ANN_BADGE[ann.priority] || ANN_BADGE.normal)}>
                    {ann.priority}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(ann.createdAt)}</span>
                  {ann.postedBy?.name && <span className="text-[10px] text-gray-400 dark:text-gray-500">· {ann.postedBy.name}</span>}
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{ann.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {ann.body.length > 100 ? ann.body.slice(0, 100) + '…' : ann.body}
                </p>
              </div>
            ))
        }
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 1 STAT CARDS (9 cards)
// ══════════════════════════════════════════════════════════════════
function StatCards({ stats }) {
  // ── Loading state: 8 shimmer stat-card skeletons ──────────────
  if (!stats) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {[...Array(8)].map((_, i) => (
        <SkeletonLoader key={i} variant="card" />
      ))}
    </div>
  );

  const cards = [
    { label: 'Total Employees',  value: stats.totalEmployees,  color: 'indigo',  icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></svg> },
    { label: 'Present Today',    value: stats.presentToday,    color: 'emerald', sub: `${stats.attendancePct ?? 0}% rate`, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg> },
    { label: 'Absent Today',     value: stats.absentToday,     color: 'red',     icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
    { label: 'Pending Leaves',   value: stats.pendingLeaves,   color: 'amber',   sub: 'Need action', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Approved Leaves',  value: stats.approvedLeaves,  color: 'emerald', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Active Job Openings', value: stats.activeJobs,   color: 'blue',    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg> },
    { label: 'Total Candidates', value: stats.totalCandidates, color: 'purple',  icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { label: 'Goals Assigned',   value: stats.goalsAssigned,   color: 'teal',    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
    { label: 'Completed Goals',  value: stats.completedGoals,  color: 'emerald', sub: stats.goalsAssigned > 0 ? `${Math.round((stats.completedGoals/stats.goalsAssigned)*100)}% done` : null, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => <StatCard key={i} {...c} />)}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 8: EMPLOYEE DASHBOARD
// ══════════════════════════════════════════════════════════════════
function EmployeeDashboard({ user, stats, recentLeaves, myGoals }) {
  const STATUS_MAP = {
    'checked-in':     { label: 'Checked In',     cls: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse' },
    'checked-out':    { label: 'Checked Out',    cls: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',             dot: 'bg-blue-500' },
    'not-checked-in': { label: 'Not Checked In', cls: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',                 dot: 'bg-red-500' },
  };
  const ts = STATUS_MAP[stats?.todayStatus] || STATUS_MAP['not-checked-in'];
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const goalPct = stats?.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0;
  const fmt12 = d => d ? new Date(d).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

  // Goal data for line chart
  const goalData = [
    { name: 'Total',    value: stats?.totalGoals || 0 },
    { name: 'Done',     value: stats?.completedGoals || 0 },
    { name: 'Active',   value: stats?.inProgressGoals || 0 },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Greeting */}
      <div>
        <Breadcrumb crumbs={[{ label: 'Dashboard' }]} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.jobTitle}{user?.department ? ` · ${user.department}` : ''} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Attendance status */}
        <div className={cx('rounded-2xl p-5 border col-span-2 sm:col-span-1', ts.bg)}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cx('w-2 h-2 rounded-full', ts.dot)} />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Today</span>
          </div>
          <p className={cx('text-xl font-bold', ts.cls)}>{ts.label}</p>
          {stats?.checkInTime && (
            <div className="mt-2 space-y-0.5">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">In: <span className="font-semibold">{fmt12(stats.checkInTime)}</span></p>
              {stats.checkOutTime && <p className="text-[11px] text-gray-500 dark:text-gray-400">Out: <span className="font-semibold">{fmt12(stats.checkOutTime)}</span></p>}
              {stats.workHours > 0 && <p className="text-[11px] text-gray-500 dark:text-gray-400">{stats.workHours}h worked</p>}
            </div>
          )}
        </div>
        <StatCard label="Pending Leaves"  value={stats?.pendingLeaves ?? 0}  color="amber"   sub="Awaiting approval" />
        <StatCard label="Approved Leaves" value={stats?.approvedLeaves ?? 0} color="emerald" sub="Total approved" />
        <StatCard label="Goals Progress"  value={`${goalPct}%`}              color="teal"    sub={`${stats?.completedGoals ?? 0} of ${stats?.totalGoals ?? 0} done`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My leave history */}
        <div className="lg:col-span-2">
          <Card title="My Leave History" action={<a href="/leaves" className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium">Apply →</a>}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-white/[0.04]">
                    {['Duration', 'Type', 'Days', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeaves.length === 0
                    ? <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-gray-400">No leave requests yet.</td></tr>
                    : recentLeaves.map(l => (
                      <tr key={l._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300">{l.startDate} → {l.endDate}</td>
                        <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300 capitalize">{l.leaveType}</td>
                        <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300">{l.totalDays}d</td>
                        <td className="px-5 py-3"><Badge status={l.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* My goals */}
        <Card title="My Goals" action={<a href="/goals" className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium">View all →</a>}>
          {/* Mini bar chart */}
          {stats?.totalGoals > 0 && (
            <div className="px-4 pt-4">
              <ResponsiveContainer width="100%" height={70}>
                <BarChart data={goalData} barSize={20} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                    {goalData.map((_, i) => <Cell key={i} fill={['#6366f1','#10b981','#3b82f6'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="p-4 space-y-2.5">
            {myGoals.length === 0
              ? <Empty emoji="🎯" msg="No goals assigned yet" />
              : myGoals.map(g => (
                <div key={g._id} className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{g.title}</p>
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-gray-400">Progress</span>
                          <span className="text-[10px] font-bold text-indigo-500">{g.progress ?? 0}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10">
                          <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${g.progress ?? 0}%` }} />
                        </div>
                      </div>
                    </div>
                    <Badge status={g.status} />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 8: HR / ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════
function HRDashboard({ user }) {
  const [stats, setStats]           = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves]         = useState(null);
  const [recruitment, setRecruitment] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [activity, setActivity]     = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [showAllAnn, setShowAllAnn] = useState(false);
  const [error, setError]           = useState('');

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [s, a, l, r, p, act] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/attendance'),
        api.get('/dashboard/leaves'),
        api.get('/dashboard/recruitment'),
        api.get('/dashboard/performance'),
        api.get('/dashboard/activity'),
      ]);
      setStats(s.data.data);
      setAttendance(a.data.data);
      setLeaves(l.data.data);
      setRecruitment(r.data.data);
      setPerformance(p.data.data);
      setActivity(act.data.data);
      // announcements come embedded in the stats response
      setAnnouncements(s.data.data?.announcements || []);
    } catch (err) {
      setError('Failed to load dashboard. ' + (err.response?.data?.message || ''));
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Breadcrumb crumbs={[{ label: 'Dashboard' }]} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, <span className="font-semibold text-gray-700 dark:text-gray-200">{user?.name}</span>. Here's your workforce overview.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Today</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{dateStr}</p>
          <button onClick={loadAll} className="mt-1 text-[11px] text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 ml-auto">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          {error}
          <button onClick={loadAll} className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-500/20 text-xs font-medium ml-4">Retry</button>
        </div>
      )}

      {/* MODULE 1: 9 Stat Cards */}
      <StatCards stats={stats} />

      {/* Announcements module hidden
      {announcements.length > 0 && (
        <AnnouncementsCard announcements={announcements} onViewAll={() => setShowAllAnn(true)} />
      )}
      */}

      {/* Row 2: Attendance | Leaves | Recruitment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AttendanceSection data={attendance} />
        <LeaveAnalyticsSection data={leaves} />
        <RecruitmentSection data={recruitment} />
      </div>

      {/* Row 3: Performance | Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceSection data={performance} />
        </div>
        <ActivitySection activities={activity} />
      </div>

      {/* View-all announcements modal hidden
      {showAllAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">All Announcements</h2>
              <button onClick={() => setShowAllAnn(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {announcements.map(ann => (
                <div key={ann._id} className={cx('border-l-4 pl-4 py-1', ANN_BORDER[ann.priority] || ANN_BORDER.normal)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', ANN_BADGE[ann.priority] || ANN_BADGE.normal)}>{ann.priority}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(ann.createdAt)}</span>
                    {ann.postedBy?.name && <span className="text-xs text-gray-400 dark:text-gray-500">· {ann.postedBy.name}</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{ann.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{ann.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ══════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [empData, setEmpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Employees only need the /employee endpoint; managers load their own in HRDashboard
  useEffect(() => {
    if (isManager()) { setLoading(false); return; }
    api.get('/dashboard/employee')
      .then(r => setEmpData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isManager]);

  if (loading) return <DashSkeleton />;
  if (error)   return <div className="p-8 text-red-500">{error}</div>;

  return (
    <>
      {isManager()
        ? <HRDashboard user={user} />
        : <EmployeeDashboard
            user={user}
            stats={empData?.stats || {}}
            recentLeaves={empData?.recentLeaves || []}
            myGoals={empData?.myGoals || []}
          />
      }
      {/* MODULE 7: Chat widget — visible to all roles */}
      <ChatWidget />
    </>
  );
}
