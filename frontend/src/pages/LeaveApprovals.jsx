import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const cfg = {
    pending:  'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
    approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg[status] || cfg.pending}`}>{status?.charAt(0).toUpperCase()+status?.slice(1)}</span>;
};

// Mini balance pill shown next to each pending leave
function BalancePill({ employeeId, leaveType, balanceCache, setBalanceCache }) {
  const [bal, setBal] = useState(null);
  const cacheKey = `${employeeId}-${leaveType}`;

  useEffect(() => {
    if (!employeeId) return;
    if (balanceCache[cacheKey] !== undefined) {
      setBal(balanceCache[cacheKey]);
      return;
    }
    api.get(`/leaves/balance/${employeeId}`)
      .then(res => {
        const b = res.data.balance;
        const remaining = b[leaveType]?.remaining ?? b.other?.remaining ?? 0;
        setBalanceCache(prev => ({ ...prev, [cacheKey]: remaining }));
        setBal(remaining);
      })
      .catch(() => {});
  }, [employeeId, leaveType, cacheKey, balanceCache, setBalanceCache]);

  if (bal === null) return null;
  const color = bal === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : bal <= 2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${color} ml-1`}>
      {bal}d left
    </span>
  );
}

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [modal, setModal] = useState({ open: false, id: null, action: '', note: '' });
  const [balanceCache, setBalanceCache] = useState({});

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/leaves/all' : `/leaves/all?status=${filter}`;
      const res = await api.get(url);
      setLeaves(res.data.leaves);
    } catch { showMsg('Failed to fetch leave requests', 'error'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const openModal = (id, action) => setModal({ open: true, id, action, note: '' });
  const closeModal = () => setModal({ open: false, id: null, action: '', note: '' });

  const doAction = async (id, action, note = '') => {
    setActionLoading(id + action);
    try {
      await api.patch(`/leaves/${id}/${action}`, { reviewNote: note });
      showMsg(`Leave ${action}d successfully!`);
      fetchLeaves();
    } catch (err) { showMsg(err.response?.data?.message || `Failed to ${action}`, 'error'); }
    finally { setActionLoading(''); }
  };

  const handleModalConfirm = async () => {
    closeModal();
    await doAction(modal.id, modal.action, modal.note);
  };

  const tabs = [
    { key: 'pending',  label: 'Pending',  dot: 'bg-amber-500' },
    { key: 'approved', label: 'Approved', dot: 'bg-emerald-500' },
    { key: 'rejected', label: 'Rejected', dot: 'bg-red-500' },
    { key: 'all',      label: 'All',      dot: 'bg-gray-400' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb crumbs={[{ label: 'Leave Approvals' }]} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Approvals</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and manage employee leave requests</p>
      </div>

      {/* Alert */}
      {msg.text && (
        <div className={`flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === t.key
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${filter === t.key ? 'bg-white/70' : t.dot}`}/>
            {t.label}
            {t.key !== 'all' && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === t.key ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                {leaves.filter(l => t.key === 'all' ? true : l.status === t.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{filter === 'all' ? 'All' : filter} Leave Requests</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{leaves.length} records</p>
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
                  {['Employee', 'Type', 'Duration', 'Days', 'Reason', 'Applied', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-16 text-center">
                    <div className="text-2xl mb-2">🎉</div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No leave requests found.</p>
                  </td></tr>
                ) : leaves.map(leave => (
                  <tr key={leave._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Employee */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                            {(leave.employee?.name || leave.employee?.email)?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {leave.employee?.name || leave.employee?.email?.split('@')[0] || 'Unknown'}
                            {leave.status === 'pending' && (
                              <BalancePill
                                employeeId={leave.employee?._id}
                                leaveType={leave.leaveType || 'casual'}
                                balanceCache={balanceCache}
                                setBalanceCache={setBalanceCache}
                              />
                            )}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{leave.employee?.department || leave.employee?.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 capitalize whitespace-nowrap">{leave.leaveType || 'casual'}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{leave.startDate}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">→ {leave.endDate}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white">{leave.totalDays}d</td>
                    <td className="px-5 py-3.5 max-w-[140px]">
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate" title={leave.reason}>{leave.reason}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(leave.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={leave.status} />
                      {leave.reviewedBy && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 whitespace-nowrap">by {leave.reviewedBy.name}</p>}
                      {leave.reviewNote && <p className="text-[10px] text-gray-400 dark:text-gray-500 italic truncate max-w-[100px]">"{leave.reviewNote}"</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      {leave.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          {/* Quick Approve */}
                          <button onClick={() => doAction(leave._id, 'approve')}
                            disabled={!!actionLoading}
                            title="Approve"
                            className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center transition-colors disabled:opacity-50">
                            {actionLoading === leave._id+'approve'
                              ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                          </button>
                          {/* Quick Reject */}
                          <button onClick={() => doAction(leave._id, 'reject')}
                            disabled={!!actionLoading}
                            title="Reject"
                            className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50">
                            {actionLoading === leave._id+'reject'
                              ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                          </button>
                          {/* With Note */}
                          <button onClick={() => openModal(leave._id, 'approve')}
                            title="Approve with note"
                            className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-[10px] font-medium transition-colors">
                            Note
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modal.action === 'approve' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                  {modal.action === 'approve'
                    ? <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white capitalize">{modal.action} Leave Request</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Add an optional note for the employee</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Review Note <span className="normal-case font-normal">(optional)</span></label>
                <textarea
                  value={modal.note}
                  onChange={e => setModal(m => ({...m, note: e.target.value}))}
                  placeholder="Add a message for the employee…"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={handleModalConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${modal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'}`}>
                  Confirm {modal.action === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
