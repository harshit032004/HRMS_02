import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { exportCSV, csvFilename } from '../utils/exportCSV';
import api from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const LEAVE_TYPES = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'other'];

// Leave balance types that have quotas
const BALANCE_TYPES = [
  { key: 'casual', label: 'Casual',  color: 'bg-blue-500',   track: 'bg-blue-100 dark:bg-blue-500/20'   },
  { key: 'sick',   label: 'Sick',    color: 'bg-rose-500',   track: 'bg-rose-100 dark:bg-rose-500/20'   },
  { key: 'earned', label: 'Earned',  color: 'bg-emerald-500',track: 'bg-emerald-100 dark:bg-emerald-500/20'},
  { key: 'other',  label: 'Other',   color: 'bg-purple-500', track: 'bg-purple-100 dark:bg-purple-500/20'},
];

// ── Balance Card ──────────────────────────────────────────────────────────────
function LeaveBalanceCard({ balance }) {
  if (!balance) return null;
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leave Balance — {balance.year}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Your remaining quota for this year</p>
      </div>
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BALANCE_TYPES.map(({ key, label, color, track }) => {
          const b = balance[key];
          if (!b) return null;
          const pct = b.allocated > 0 ? Math.round((b.remaining / b.allocated) * 100) : 0;
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{b.remaining}<span className="text-xs font-normal text-gray-400 dark:text-gray-500">/{b.allocated}</span></span>
              </div>
              <div className={`w-full h-1.5 rounded-full ${track}`}>
                <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{b.used} used</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CSV export config ─────────────────────────────────────────────────────────
const LEAVES_HEADERS = ['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Reviewed By'];

function leaveToRow(leave) {
  return [
    leave.employee?.name || '—',
    leave.leaveType ? leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) : 'Casual',
    leave.startDate || '—',
    leave.endDate   || '—',
    leave.totalDays != null ? String(leave.totalDays) : '—',
    leave.status    ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1) : '—',
    leave.reviewedBy?.name || '—',
  ];
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    pending:  'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
    approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg[status] || cfg.pending}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all";

// ── ExportButton ──────────────────────────────────────────────────────────────
function ExportButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10
        bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-semibold
        hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20
        transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export CSV
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Leaves() {
  const toast = useToast();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', leaveType: 'casual' });
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(null);

  useEffect(() => { fetchLeaves(); fetchBalance(); }, []);

  const fetchBalance = async () => {
    try {
      const res = await api.get('/leaves/balance');
      setBalance(res.data.balance);
    } catch { /* non-critical */ }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves/my');
      setLeaves(res.data.leaves);
    } catch {
      toast('Failed to fetch leave history', 'error');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast('End date cannot be before start date', 'error');
      return;
    }
    // Check balance for tracked leave types
    const trackedTypes = ['casual', 'sick', 'earned', 'other'];
    if (balance && trackedTypes.includes(form.leaveType)) {
      const remaining = balance[form.leaveType]?.remaining ?? 999;
      if (remaining <= 0) {
        toast(`You have no remaining ${form.leaveType} leave days for this year.`, 'error');
        return;
      }
    }
    setSubmitting(true);
    try {
      await api.post('/leaves/apply', form);
      toast('Leave request submitted successfully!', 'success');
      setForm({ startDate: '', endDate: '', reason: '', leaveType: 'casual' });
      fetchLeaves();
      fetchBalance();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit leave request', 'error');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      toast('Leave request cancelled', 'success');
      fetchLeaves();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to cancel', 'error');
    }
  };

  // ── CSV export handler ──────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const rows = filtered.map(leaveToRow);
      const count = exportCSV({
        headers: LEAVES_HEADERS,
        rows,
        filename: csvFilename('leaves'),
      });
      toast(`Exported ${count} record${count !== 1 ? 's' : ''}`, 'success');
    } catch (err) {
      console.error('CSV export failed:', err);
      toast('Export failed. Please try again.', 'error');
    }
  };

  const dayCount = form.startDate && form.endDate
    ? Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1)
    : 0;

  const filtered = filterStatus === 'all' ? leaves : leaves.filter(l => l.status === filterStatus);
  const tabs = ['all', 'pending', 'approved', 'rejected'];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb crumbs={[{ label: 'Leave Management' }]} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Apply for time off and track your requests</p>
      </div>

      {/* Balance Card */}
      {balance && <LeaveBalanceCard balance={balance} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Apply Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Apply for Leave</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Submit a new time-off request</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <InputField label="Leave Type">
                <select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})} className={inputCls}>
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)} Leave</option>)}
                </select>
              </InputField>
              {/* Zero-balance warning */}
              {balance && ['casual','sick','earned','other'].includes(form.leaveType) && balance[form.leaveType]?.remaining === 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 5a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 9a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 16z" clipRule="evenodd"/></svg>
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">No {form.leaveType} leave days remaining this year</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <InputField label="Start Date">
                  <input type="date" value={form.startDate} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({...form, startDate: e.target.value})} required className={inputCls} />
                </InputField>
                <InputField label="End Date">
                  <input type="date" value={form.endDate} min={form.startDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({...form, endDate: e.target.value})} required className={inputCls} />
                </InputField>
              </div>

              {dayCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">{dayCount} day{dayCount !== 1 ? 's' : ''} requested</span>
                </div>
              )}

              <InputField label="Reason">
                <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                  placeholder="Briefly explain the reason for your leave…" rows={3} required
                  className={`${inputCls} resize-none`} />
              </InputField>

              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                {submitting
                  ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Submitting…</>
                  : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Leave History */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">My Leave History</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{leaves.length} total requests</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
                  {tabs.map(t => (
                    <button key={t} onClick={() => setFilterStatus(t)}
                      className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${filterStatus === t ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {/* Export button */}
                <ExportButton onClick={handleExport} disabled={filtered.length === 0} />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-white/[0.04]">
                      {['Type', 'Duration', 'Days', 'Reason', 'Status', 'Reviewed By', ''].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-16 text-center">
                        <div className="text-2xl mb-2">📋</div>
                        <p className="text-sm text-gray-400 dark:text-gray-500">No leave requests found.</p>
                      </td></tr>
                    ) : filtered.map(leave => (
                      <tr key={leave._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">{leave.leaveType || 'casual'}</td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{leave.startDate}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">→ {leave.endDate}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white">{leave.totalDays}d</td>
                        <td className="px-5 py-3.5 max-w-[120px]">
                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={leave.reason}>{leave.reason}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={leave.status} />
                          {leave.reviewNote && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic truncate max-w-[100px]">{leave.reviewNote}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{leave.reviewedBy?.name || '—'}</td>
                        <td className="px-5 py-3.5">
                          {leave.status === 'pending' && (
                            <button onClick={() => handleCancel(leave._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
