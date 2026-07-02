import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';
import { useToast } from '../context/ToastContext';

// ── Reusable primitives ────────────────────────────────────────────
const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';

const TABS = ['Overview', 'Attendance Summary', 'Leave History', 'Goals', 'Documents'];

const ROLE_COLORS = {
  admin:    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  hr:       'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  manager:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  employee: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
};

const STATUS_COLOR = {
  present:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  absent:   'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  'half-day':'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  'on-leave':'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
};

const LEAVE_STATUS_COLOR = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

const GOAL_STATUS_COLOR = {
  pending:     'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  completed:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
};

const PRIORITY_COLOR = {
  low:    'text-gray-400',
  medium: 'text-amber-500',
  high:   'text-red-500',
};

function Spinner({ sm }) {
  return (
    <svg className={`animate-spin ${sm ? 'w-4 h-4' : 'w-5 h-5'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Avatar component ───────────────────────────────────────────────
function Avatar({ employee, size = 'lg', onUpload, canUpload }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const initials = (employee?.name || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const sizeClasses = {
    lg: 'w-24 h-24 text-2xl',
    sm: 'w-9 h-9 text-sm',
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    setUploading(true);
    try {
      const res = await api.post(`/employees/${employee._id}/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpload?.(res.data.avatarUrl);
      setImgError(false);
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const showReal = employee?.avatarUrl && !imgError;

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold overflow-hidden
          ${showReal ? '' : 'bg-gradient-to-br from-indigo-400 to-violet-500 text-white'}
          ${canUpload ? 'cursor-pointer group' : ''}`}
        onClick={() => canUpload && fileRef.current?.click()}
      >
        {showReal ? (
          <img
            src={employee.avatarUrl}
            alt={employee.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Upload overlay */}
        {canUpload && size === 'lg' && (
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {uploading ? (
              <Spinner sm />
            ) : (
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
        )}
      </div>

      {canUpload && size === 'lg' && (
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-colors"
          title="Upload photo"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────
function OverviewTab({ employee }) {
  const fields = [
    { label: 'Employee ID',  value: employee.employeeId || '—' },
    { label: 'Email',        value: employee.email },
    { label: 'Department',   value: employee.department || '—' },
    { label: 'Job Title',    value: employee.jobTitle || '—' },
    { label: 'Role',         value: <span className="capitalize">{employee.role}</span> },
    { label: 'Joined',       value: new Date(employee.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { label: 'Status',       value: (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
          ${employee.isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
            : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${employee.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {employee.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {fields.map(f => (
        <div key={f.label} className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{f.label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{f.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Attendance Summary Tab ─────────────────────────────────────────
function AttendanceSummaryTab({ employeeId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/employees/${employeeId}/attendance-summary`)
      .then(r => setData(r.data.summary))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <TabSkeleton />;
  if (!data) return <EmptyState icon="📋" label="No attendance data available" />;

  const stats = [
    { label: 'Total Days',   value: data.total,        color: 'indigo' },
    { label: 'Present',      value: data.present,      color: 'emerald' },
    { label: 'Absent',       value: data.absent,       color: 'red' },
    { label: 'Half Day',     value: data.halfDay,      color: 'amber' },
    { label: 'On Leave',     value: data.onLeave,      color: 'blue' },
    { label: 'Avg Hrs/Day',  value: `${data.avgWorkHours}h`, color: 'violet' },
  ];

  const colorMap = {
    indigo:  'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    red:     'text-red-600 dark:text-red-400',
    amber:   'text-amber-600 dark:text-amber-400',
    blue:    'text-blue-600 dark:text-blue-400',
    violet:  'text-violet-600 dark:text-violet-400',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-gray-100 dark:border-white/5 text-center">
            <p className={`text-2xl font-bold ${colorMap[s.color]}`}>{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {data.recent?.length > 0 && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-white/5">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Records</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-white/[0.04]">
                  {['Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent.map(r => (
                  <tr key={r._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">{r.date}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{r.workHours ? `${r.workHours}h` : '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[r.status] || ''}`}>
                        {r.status}
                      </span>
                    </td>
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

// ── Leave History Tab ──────────────────────────────────────────────
function LeaveHistoryTab({ employeeId }) {
  const [leaves, setLeaves] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/employees/${employeeId}/leaves`)
      .then(r => setLeaves(r.data.leaves))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <TabSkeleton />;
  if (!leaves?.length) return <EmptyState icon="🏖️" label="No leave records found" />;

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 dark:border-white/[0.04]">
              {['Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Reviewed By'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaves.map(l => (
              <tr key={l._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 text-sm font-medium capitalize text-gray-700 dark:text-gray-200">{l.leaveType}</td>
                <td className="px-5 py-3.5 text-sm font-mono text-gray-500 dark:text-gray-400">{l.startDate}</td>
                <td className="px-5 py-3.5 text-sm font-mono text-gray-500 dark:text-gray-400">{l.endDate}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{l.totalDays}d</td>
                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 max-w-[180px] truncate">{l.reason}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${LEAVE_STATUS_COLOR[l.status] || ''}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{l.reviewedBy?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Goals Tab ──────────────────────────────────────────────────────
function GoalsTab({ employeeId }) {
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/employees/${employeeId}/goals`)
      .then(r => setGoals(r.data.goals))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <TabSkeleton />;
  if (!goals?.length) return <EmptyState icon="🎯" label="No goals assigned yet" />;

  return (
    <div className="space-y-4">
      {goals.map(g => (
        <div key={g._id} className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{g.title}</h4>
                <span className={`text-xs font-medium capitalize ${PRIORITY_COLOR[g.priority]}`}>● {g.priority}</span>
              </div>
              {g.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{g.description}</p>
              )}
            </div>
            <span className={`flex-shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${GOAL_STATUS_COLOR[g.status] || ''}`}>
              {g.status.replace('_', ' ')}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Progress</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{g.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                style={{ width: `${g.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-gray-400 dark:text-gray-500">
            <span>By {g.assignedBy?.name || '—'}</span>
            <span>Due {new Date(g.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Documents Tab ──────────────────────────────────────────────────
const CATEGORY_LABELS = {
  offer_letter: 'Offer Letter',
  id_proof:     'ID Proof',
  contract:     'Contract',
  certificate:  'Certificate',
  other:        'Other',
};

const CATEGORY_COLORS = {
  offer_letter: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  id_proof:     'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  contract:     'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  certificate:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  other:        'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/10',
};

function FileIcon({ type }) {
  if (type === 'pdf') {
    return (
      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
          <line x1="9" y1="9" x2="11" y2="9" />
        </svg>
      </div>
    );
  }
  if (type === 'image') {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  );
}

function UploadModal({ employeeId, onClose, onUploaded }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleUpload = async () => {
    if (!file) { setError('Please select a file.'); return; }
    if (!name.trim()) { setError('Please enter a document name.'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', name.trim());
    fd.append('category', category);
    setUploading(true);
    setError('');
    try {
      const { default: api } = await import('../utils/api');
      const res = await api.post(`/employees/${employeeId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data.document);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Upload Document</h3>
            <p className="text-xs text-gray-400 mt-0.5">PDF, images, Word, Excel · Max 10 MB</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">File</label>
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-left group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className={`text-sm ${file ? 'text-gray-800 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                {file ? file.name : 'Choose a file…'}
              </span>
            </button>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^/.]+$/, '')); } }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Document Name</label>
            <input className={inputCls} placeholder="e.g. Offer Letter 2024" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Category</label>
            <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleUpload} disabled={uploading || !file} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
              {uploading ? <><Spinner sm />Uploading…</> : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ employeeId, canDelete }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    import('../utils/api').then(m => m.default.get(`/employees/${employeeId}/documents`))
      .then(r => setDocs(r.data.documents))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [employeeId]);

  const handleUploaded = (doc) => {
    setDocs(prev => [doc, ...prev]);
    showToast('Document uploaded successfully', 'success');
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setDeletingId(docId);
    try {
      const { default: api } = await import('../utils/api');
      await api.delete(`/documents/${docId}`);
      setDocs(prev => prev.filter(d => d._id !== docId));
      showToast('Document deleted', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const { default: api } = await import('../utils/api');
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('Download failed', 'error');
    }
  };

  if (loading) return <TabSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowUpload(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Upload Document
        </button>
      </div>
      {docs.length === 0 ? (
        <EmptyState icon="📄" label="No documents uploaded yet" />
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc._id} className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-gray-100 dark:border-white/5 flex items-center gap-4">
              <FileIcon type={doc.fileType} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}`}>
                    {CATEGORY_LABELS[doc.category] || 'Other'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>}
                  {doc.uploadedBy?.name && <span>by {doc.uploadedBy.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleDownload(doc._id, doc.originalName || doc.name)} title="Download" className="w-8 h-8 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                {canDelete && (
                  <button onClick={() => handleDelete(doc._id)} disabled={deletingId === doc._id} title="Delete" className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400 transition-colors disabled:opacity-50">
                    {deletingId === doc._id ? <Spinner sm /> : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showUpload && <UploadModal employeeId={employeeId} onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
    </div>
  );
}


// ── Shared helpers ─────────────────────────────────────────────────
function TabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => (
        <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5" />
      ))}
    </div>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}

// ── Edit Form ──────────────────────────────────────────────────────
function EditEmployeeForm({ employee, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: employee.name || '',
    department: employee.department || '',
    jobTitle: employee.jobTitle || '',
    role: employee.role || 'employee',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.patch(`/employees/${employee._id}`, form);
      onSave(res.data.employee);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div
        className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit Employee</h3>
            <p className="text-xs text-gray-400 mt-0.5">Update profile details</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Full Name</label>
            <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Role</label>
              <select className={inputCls} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Department</label>
              <input className={inputCls} placeholder="Engineering" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Job Title</label>
            <input className={inputCls} placeholder="Software Engineer" value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {saving ? <><Spinner sm />Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [loadedTabs, setLoadedTabs] = useState(new Set(['Overview']));
  const [showEdit, setShowEdit] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = isAdmin();
  const canUploadAvatar = isAdmin() || user?.id === id;

  useEffect(() => {
    setLoading(true);
    api.get(`/employees/${id}`)
      .then(r => setEmployee(r.data.employee))
      .catch(err => setError(err.response?.data?.message || 'Employee not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setLoadedTabs(prev => new Set([...prev, tab]));
  };

  const handleAvatarUpload = useCallback((url) => {
    setEmployee(prev => ({ ...prev, avatarUrl: url }));
  }, []);

  const handleEditSave = useCallback((updated) => {
    setEmployee(updated);
    setShowEdit(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Employees
        </button>
        <div className="animate-pulse space-y-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-gray-100 dark:border-white/5 flex items-center gap-5">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
              <div className="h-4 w-32 bg-gray-100 dark:bg-white/5 rounded-lg" />
              <div className="h-4 w-40 bg-gray-100 dark:bg-white/5 rounded-lg" />
            </div>
          </div>
          <div className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !employee) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Employees
        </button>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-gray-500 dark:text-gray-400">{error || 'Employee not found'}</p>
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <Breadcrumb crumbs={[{ label: 'Employees', path: '/employees' }, { label: employee?.name || 'Profile' }]} />

      {/* Success toast */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          Employee profile updated successfully.
        </div>
      )}

      {/* Profile header card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-gray-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <Avatar
            employee={employee}
            size="lg"
            onUpload={handleAvatarUpload}
            canUpload={canUploadAvatar}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{employee.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {employee.jobTitle || 'No title'} {employee.department ? `· ${employee.department}` : ''}
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${ROLE_COLORS[employee.role] || ROLE_COLORS.employee}`}>
                    {employee.role}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${employee.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${employee.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{employee.employeeId}</span>
                </div>
              </div>

              {/* Edit button (admin/hr only) */}
              {canEdit && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 self-start"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Employee
                </button>
              )}
            </div>

            {/* Quick info row */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {employee.email}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Joined {new Date(employee.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${activeTab === tab
                  ? 'bg-white dark:bg-[#111827] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {activeTab === 'Overview' && <OverviewTab employee={employee} />}
          {activeTab === 'Attendance Summary' && loadedTabs.has('Attendance Summary') && (
            <AttendanceSummaryTab employeeId={id} />
          )}
          {activeTab === 'Leave History' && loadedTabs.has('Leave History') && (
            <LeaveHistoryTab employeeId={id} />
          )}
          {activeTab === 'Goals' && loadedTabs.has('Goals') && (
            <GoalsTab employeeId={id} />
          )}
          {activeTab === 'Documents' && loadedTabs.has('Documents') && (
            <DocumentsTab employeeId={id} canDelete={isAdmin()} />
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditEmployeeForm
          employee={employee}
          onSave={handleEditSave}
          onCancel={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
