import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StatCard = ({ label, value, color = 'default', icon, trend }) => {
  const colors = {
    default: 'text-gray-900 dark:text-white',
    yellow: 'text-amber-500',
    green: 'text-emerald-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
  };
  const bgColors = {
    default: 'bg-gray-100 dark:bg-white/10',
    yellow: 'bg-amber-50 dark:bg-amber-500/10',
    green: 'bg-emerald-50 dark:bg-emerald-500/10',
    red: 'bg-red-50 dark:bg-red-500/10',
    blue: 'bg-blue-50 dark:bg-blue-500/10',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10',
  };
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-gray-100 dark:border-white/5 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${colors[color]}`}>{value ?? '—'}</p>
          {trend && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{trend}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl ${bgColors[color]} flex items-center justify-center flex-shrink-0`}>
            <span className={colors[color]}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    pending:  { cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20', label: 'Pending' },
    approved: { cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20', label: 'Approved' },
    rejected: { cls: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20', label: 'Rejected' },
    active:   { cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20', label: 'Active' },
    inactive: { cls: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 border border-gray-200 dark:border-white/10', label: 'Inactive' },
  };
  const cfg = configs[status] || configs.pending;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
};

function EmployeeTable({ employees }) {
  const [showAdmins, setShowAdmins] = useState(false);
  const regular = employees.filter(e => e.role === 'employee' || e.role === 'manager');
  const admins  = employees.filter(e => e.role === 'admin' || e.role === 'hr');
  const visible = showAdmins ? admins : regular.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team Directory</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {showAdmins ? `${admins.length} admin/HR staff` : `${regular.length} team members`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
          <button onClick={() => setShowAdmins(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!showAdmins ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            Employees
          </button>
          <button onClick={() => setShowAdmins(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showAdmins ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            Admin / HR
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 dark:border-white/[0.04]">
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Employee</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Department</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Role</th>
              <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No records found.</td></tr>
            ) : visible.map((emp, i) => (
              <tr key={emp._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">{(emp.name || emp.email)?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name || emp.email?.split('@')[0] || '—'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{emp.department || '—'}</td>
                <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300 capitalize">{emp.role}</td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={emp.isActive ? 'active' : 'inactive'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!showAdmins && regular.length > 5 && (
        <div className="px-6 py-3 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Showing 5 of {regular.length} — <a href="/employees" className="text-indigo-500 hover:text-indigo-600 font-medium">View all employees →</a>
          </p>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const endpoint = isManager() ? '/dashboard/admin' : '/dashboard/employee';
      const res = await api.get(endpoint);
      setStats(res.data.stats);
      setRecentLeaves(res.data.recentLeaves || []);
      setEmployees(res.data.employees || []);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}
      </div>
    </div>
  );

  // ── Manager Dashboard ──
  if (isManager()) return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500">Today</p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees ?? 0} color="indigo"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>}
          trend="Active workforce" />
        <StatCard label="Pending Leaves" value={stats?.pendingLeaves ?? 0} color="yellow"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z"/><polyline points="12 6 12 12 16 14"/></svg>}
          trend="Awaiting approval" />
        <StatCard label="Approved Leaves" value={stats?.approvedLeaves ?? 0} color="green"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>}
          trend="This month" />
        <StatCard label="Rejected Leaves" value={stats?.rejectedLeaves ?? 0} color="red"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          trend="This month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending requests */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pending Requests</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Requires your action</p>
            </div>
            {recentLeaves.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{recentLeaves.length}</span>
            )}
          </div>
          <div className="p-4 space-y-3">
            {recentLeaves.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-sm text-gray-400 dark:text-gray-500">No pending requests</p>
              </div>
            ) : recentLeaves.map(leave => (
              <div key={leave._id} className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {leave.employee?.name || leave.employee?.email?.split('@')[0] || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {leave.startDate} → {leave.endDate} · {leave.totalDays}d
                    </p>
                    {leave.reason && <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{leave.reason}</p>}
                  </div>
                  <StatusBadge status="pending" />
                </div>
              </div>
            ))}
          </div>
          {recentLeaves.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5">
              <a href="/leave-approvals" className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">View all approvals →</a>
            </div>
          )}
        </div>

        {/* Employee table */}
        <div className="lg:col-span-2">
          <EmployeeTable employees={employees} />
        </div>
      </div>
    </div>
  );

  // ── Employee Dashboard ──
  const statusMap = {
    'checked-in':     { label: 'Checked In',     cls: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20', dot: 'bg-emerald-500' },
    'checked-out':    { label: 'Checked Out',    cls: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20',    dot: 'bg-blue-500' },
    'not-checked-in': { label: 'Not Checked In', cls: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20',     dot: 'bg-red-500' },
  };
  const todayStatus = statusMap[stats?.todayStatus] || statusMap['not-checked-in'];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.jobTitle} · {user?.department}</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's status */}
        <div className={`${todayStatus.bg} rounded-2xl p-5 animate-slide-up`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${todayStatus.dot} ${stats?.todayStatus === 'checked-in' ? 'animate-pulse' : ''}`}/>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Today's Status</span>
          </div>
          <p className={`text-xl font-bold ${todayStatus.cls}`}>{todayStatus.label}</p>
        </div>
        <StatCard label="Pending Leaves" value={stats?.pendingLeaves ?? 0} color="yellow"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <StatCard label="Approved Leaves" value={stats?.approvedLeaves ?? 0} color="green"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>} />
      </div>

      {/* Recent leaves */}
      {recentLeaves.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Leave Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-white/[0.04]">
                  {['Duration', 'Type', 'Reason', 'Status'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeaves.map(leave => (
                  <tr key={leave._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{leave.startDate} → {leave.endDate}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300 capitalize">{leave.leaveType || 'casual'}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={leave.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
