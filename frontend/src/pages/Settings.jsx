import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all";

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);

const Alert = ({ text, type }) => (
  <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium ${type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
    {type === 'error'
      ? <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 5a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 9a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 16z" clipRule="evenodd"/></svg>
      : <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
    {text}
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', department: user?.department || '', jobTitle: user?.jobTitle || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Leave balance management (admin/hr only)
  const [allBalances, setAllBalances] = useState([]);
  const [balLoading, setBalLoading]   = useState(false);
  const [balMsg, setBalMsg]           = useState(null);
  const [editingEmp, setEditingEmp]   = useState(null); // { employeeId, casual, sick, earned, other }

  // Audit log (admin only)
  const isAdmin = user?.role === 'admin';
  const [auditLogs, setAuditLogs]       = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage]       = useState(1);
  const [auditTotal, setAuditTotal]     = useState(0);
  const [auditFilter, setAuditFilter]   = useState({ entity: '', action: '' });
  const AUDIT_LIMIT = 20;

  const fetchAuditLogs = async (page = 1, filter = auditFilter) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: AUDIT_LIMIT });
      if (filter.entity) params.set('entity', filter.entity);
      if (filter.action) params.set('action', filter.action);
      const res = await api.get(`/admin/audit-logs?${params}`);
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.pagination?.total || 0);
      setAuditPage(page);
    } catch { /* silent */ }
    finally { setAuditLoading(false); }
  };

  useEffect(() => { if (isAdmin) fetchAuditLogs(1); }, [isAdmin]);

  const fetchAllBalances = async () => {
    setBalLoading(true);
    try {
      const res = await api.get('/admin/leave-balance');
      setAllBalances(res.data.balances || []);
    } catch { setBalMsg({ text: 'Failed to load balances', type: 'error' }); }
    finally { setBalLoading(false); }
  };

  useEffect(() => { if (isAdminOrHr) fetchAllBalances(); }, [isAdminOrHr]);

  const handleSaveBalance = async () => {
    if (!editingEmp) return;
    try {
      await api.post('/admin/leave-balance', {
        employeeId: editingEmp.employeeId,
        year: new Date().getFullYear(),
        casual: Number(editingEmp.casual),
        sick:   Number(editingEmp.sick),
        earned: Number(editingEmp.earned),
        other:  Number(editingEmp.other),
      });
      setBalMsg({ text: 'Balance updated successfully!', type: 'success' });
      setEditingEmp(null);
      fetchAllBalances();
    } catch (err) {
      setBalMsg({ text: err.response?.data?.message || 'Update failed', type: 'error' });
    }
    setTimeout(() => setBalMsg(null), 4000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      await api.put(`/employees/${user?.id}`, profileForm);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) { setProfileMsg({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' }); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ text: 'New passwords do not match', type: 'error' }); return; }
    if (pwForm.newPassword.length < 6) { setPwMsg({ text: 'Password must be at least 6 characters', type: 'error' }); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg({ text: 'Password changed successfully!', type: 'success' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPwMsg({ text: err.response?.data?.message || 'Failed to change password', type: 'error' }); }
    finally { setPwLoading(false); }
  };

  const infoItems = [
    { label: 'Employee ID', value: user?.employeeId || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb crumbs={[{ label: 'Settings' }]} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your profile and account preferences</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Your Profile'}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role} · {user?.department || 'No department set'}</p>
            </div>
          </div>

          {/* Readonly info */}
          <div className="px-6 py-4 border-b border-gray-50 dark:border-white/[0.04]">
            <div className="grid grid-cols-3 gap-4">
              {infoItems.map(item => (
                <div key={item.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5 truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="p-6 space-y-4">
            {profileMsg && <Alert {...profileMsg} />}

            <InputField label="Full Name">
              <input className={inputCls} value={profileForm.name}
                onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
            </InputField>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Department">
                <input className={inputCls} placeholder="e.g. Engineering" value={profileForm.department}
                  onChange={e => setProfileForm({...profileForm, department: e.target.value})} />
              </InputField>
              <InputField label="Job Title">
                <input className={inputCls} placeholder="e.g. Engineer" value={profileForm.jobTitle}
                  onChange={e => setProfileForm({...profileForm, jobTitle: e.target.value})} />
              </InputField>
            </div>

            <div className="pt-1">
              <button type="submit" disabled={profileLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-md shadow-indigo-600/20">
                {profileLoading
                  ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
                  : <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Save Changes
                  </>}
              </button>
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Keep your account secure</p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            {pwMsg && <Alert {...pwMsg} />}

            <InputField label="Current Password">
              <input type="password" className={inputCls} value={pwForm.currentPassword}
                onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} required />
            </InputField>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="New Password">
                <input type="password" className={inputCls} placeholder="Min. 6 characters" value={pwForm.newPassword}
                  onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} required />
              </InputField>
              <InputField label="Confirm Password">
                <input type="password" className={inputCls} placeholder="Repeat new password" value={pwForm.confirmPassword}
                  onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} required />
              </InputField>
            </div>

            <div className="pt-1">
              <button type="submit" disabled={pwLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white dark:hover:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-sm font-semibold transition-all disabled:opacity-60">
                {pwLoading
                  ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Updating…</>
                  : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
        {/* Leave Balance Management — Admin/HR only */}
        {isAdminOrHr && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manage Leave Balances — {new Date().getFullYear()}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Set custom annual leave allocations per employee</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {balMsg && <Alert {...balMsg} />}
              {balLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {allBalances.map(({ employee, casual, sick, earned, other }) => {
                    const isEditing = editingEmp?.employeeId === employee._id;
                    return (
                      <div key={employee._id} className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-white/[0.02]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">{employee.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">{employee.department || employee.jobTitle || '—'}</p>
                            </div>
                          </div>
                          {!isEditing ? (
                            <div className="flex items-center gap-4">
                              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>C:<b className="text-gray-800 dark:text-gray-200 ml-0.5">{casual.remaining}/{casual.allocated}</b></span>
                                <span>S:<b className="text-gray-800 dark:text-gray-200 ml-0.5">{sick.remaining}/{sick.allocated}</b></span>
                                <span>E:<b className="text-gray-800 dark:text-gray-200 ml-0.5">{earned.remaining}/{earned.allocated}</b></span>
                                <span>O:<b className="text-gray-800 dark:text-gray-200 ml-0.5">{other.remaining}/{other.allocated}</b></span>
                              </div>
                              <button
                                onClick={() => setEditingEmp({ employeeId: employee._id, casual: casual.allocated, sick: sick.allocated, earned: earned.allocated, other: other.allocated })}
                                className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                              >Edit</button>
                            </div>
                          ) : null}
                        </div>

                        {isEditing && (
                          <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { key: 'casual',  label: 'Casual'  },
                                { key: 'sick',    label: 'Sick'    },
                                { key: 'earned',  label: 'Earned'  },
                                { key: 'other',   label: 'Other'   },
                              ].map(({ key, label }) => (
                                <div key={key}>
                                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={editingEmp[key]}
                                    onChange={e => setEditingEmp(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={handleSaveBalance}
                                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors">
                                Save
                              </button>
                              <button onClick={() => setEditingEmp(null)}
                                className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Audit Log — Admin only ─────────────────────────────────── */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-rose-500 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Audit Log</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">{auditTotal} total entries</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <select
                  value={auditFilter.entity}
                  onChange={e => {
                    const f = { ...auditFilter, entity: e.target.value };
                    setAuditFilter(f);
                    fetchAuditLogs(1, f);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">All entities</option>
                  {['User', 'Leave', 'Goal', 'Feedback', 'Review'].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <select
                  value={auditFilter.action}
                  onChange={e => {
                    const f = { ...auditFilter, action: e.target.value };
                    setAuditFilter(f);
                    fetchAuditLogs(1, f);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">All actions</option>
                  {['LOGIN_SUCCESS','LOGIN_FAILED','LEAVE_APPLIED','LEAVE_APPROVED','LEAVE_REJECTED',
                    'GOAL_CREATED','GOAL_UPDATED','GOAL_DELETED',
                    'EMPLOYEE_CREATED','EMPLOYEE_UPDATED','EMPLOYEE_DEACTIVATED','EMPLOYEE_ROLE_CHANGED'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setAuditFilter({ entity: '', action: '' }); fetchAuditLogs(1, { entity: '', action: '' }); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >Reset</button>
              </div>

              {/* Table */}
              {auditLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">No audit entries found</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02]">
                        {['Time', 'Actor', 'Action', 'Entity', 'Details', 'IP'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                      {auditLogs.map((log, i) => {
                        const actionColor = log.action?.includes('FAILED') || log.action?.includes('REJECTED') || log.action?.includes('DEACTIVATED')
                          ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                          : log.action?.includes('APPROVED') || log.action?.includes('SUCCESS') || log.action?.includes('CREATED')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10';
                        return (
                          <tr key={log._id || i} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {log.actor?.name || <span className="text-gray-400 dark:text-gray-600 italic">system</span>}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${actionColor}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.entity}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 max-w-xs truncate">{log.details || '—'}</td>
                            <td className="px-4 py-2.5 text-gray-400 dark:text-gray-600 font-mono whitespace-nowrap">{log.ip || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {auditTotal > AUDIT_LIMIT && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Page {auditPage} of {Math.ceil(auditTotal / AUDIT_LIMIT)} · {auditTotal} entries
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={auditPage <= 1}
                      onClick={() => fetchAuditLogs(auditPage - 1)}
                      className="px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >← Prev</button>
                    <button
                      disabled={auditPage >= Math.ceil(auditTotal / AUDIT_LIMIT)}
                      onClick={() => fetchAuditLogs(auditPage + 1)}
                      className="px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >Next →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
