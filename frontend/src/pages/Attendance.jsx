import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportCSV, csvFilename } from '../utils/exportCSV';
import api from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';

const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const getName = (r, user) => r.employee?.name || user?.name || '—';
const getDept  = (r) => r.employee?.department || r.employee?.email || '—';

const statusCfg = {
  present:   { cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
  absent:    { cls: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20' },
  'half-day':{ cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' },
};

// ── CSV export headers & row-mapper for attendance records ──────────────────
const ATTENDANCE_HEADERS = ['Date', 'Employee', 'Department', 'Check In', 'Check Out', 'Work Hours', 'Status'];

function attendanceToRow(r, user) {
  return [
    fmtDate(r.date),
    r.employee?.name || getName(r, user),
    getDept(r),
    fmt(r.checkIn),
    fmt(r.checkOut),
    r.workHours ? `${r.workHours}h` : '—',
    r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—',
  ];
}

// ── ExportButton ─────────────────────────────────────────────────────────────
function ExportButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10
        bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-semibold
        hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20
        transition-all shadow-sm"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export CSV
    </button>
  );
}

// ── AttendanceTable ──────────────────────────────────────────────────────────
function AttendanceTable({ records, user, title, subtitle, onExport }) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {records.length > 0 && <ExportButton onClick={() => onExport(records)} />}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 dark:border-white/[0.04]">
              {['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Status'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No attendance records found.</td></tr>
            ) : records.map(r => (
              <tr key={r._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{r.employee?.name || getName(r, user)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{getDept(r)}</p>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300">{fmtDate(r.date)}</td>
                <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300 font-mono">{fmt(r.checkIn)}</td>
                <td className="px-6 py-3.5 text-sm text-gray-600 dark:text-gray-300 font-mono">{fmt(r.checkOut)}</td>
                <td className="px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200">{r.workHours ? `${r.workHours}h` : '—'}</td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(statusCfg[r.status] || statusCfg.present).cls}`}>
                    {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Attendance() {
  const { user, isManager } = useAuth();
  const toast = useToast();

  const [todayRecord, setTodayRecord] = useState(null);
  const [status, setStatus] = useState('not-checked-in');
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const [todayRes, myRes] = await Promise.all([api.get('/attendance/today'), api.get('/attendance/my')]);
      setTodayRecord(todayRes.data.attendance);
      setStatus(todayRes.data.status);
      setRecords(myRes.data.records);
      if (isManager()) {
        const allRes = await api.get('/attendance/all');
        setAllRecords(allRes.data.records);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/checkin');
      toast('Checked in successfully!', 'success');
      fetchAttendance();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to clock in', 'error');
    } finally { setActionLoading(false); }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      await api.put('/attendance/checkout');
      toast('Checked out successfully!', 'success');
      fetchAttendance();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to clock out', 'error');
    } finally { setActionLoading(false); }
  };

  // ── CSV export handler ─────────────────────────────────────────────────────
  const handleExport = (data) => {
    try {
      const rows = data.map(r => attendanceToRow(r, user));
      const count = exportCSV({
        headers: ATTENDANCE_HEADERS,
        rows,
        filename: csvFilename('attendance'),
      });
      toast(`Exported ${count} record${count !== 1 ? 's' : ''}`, 'success');
    } catch (err) {
      console.error('CSV export failed:', err);
      toast('Export failed. Please try again.', 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb crumbs={[{ label: 'Attendance' }]} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {todayRecord?.checkIn && (
            <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                In: <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">{fmt(todayRecord.checkIn)}</span>
              </div>
              {todayRecord.checkOut && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Out: <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">{fmt(todayRecord.checkOut)}</span>
                </div>
              )}
            </div>
          )}

          {status === 'not-checked-in' && (
            <button onClick={handleClockIn} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-indigo-600/25">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {actionLoading ? 'Clocking In…' : 'Clock In'}
            </button>
          )}
          {status === 'checked-in' && (
            <button onClick={handleClockOut} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-red-600/25">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {actionLoading ? 'Clocking Out…' : 'Clock Out'}
            </button>
          )}
          {status === 'checked-out' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Done · {todayRecord?.workHours}h worked
            </div>
          )}
        </div>
      </div>

      <AttendanceTable
        records={records}
        user={user}
        title="My Attendance History"
        subtitle={`${records.length} records total`}
        onExport={handleExport}
      />

      {isManager() && allRecords.length > 0 && (
        <AttendanceTable
          records={allRecords}
          user={user}
          title="Team Attendance — Today"
          subtitle={`${allRecords.length} records`}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
