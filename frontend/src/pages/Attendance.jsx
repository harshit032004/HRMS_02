import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function formatTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Safely get employee name from a record
// employee field can be: populated object { name, email } OR just an ObjectId string
function getEmployeeName(record, fallbackUser) {
  if (record.employee && typeof record.employee === 'object' && record.employee.name) {
    return record.employee.name;
  }
  // fallback to the logged-in user's name for own records
  if (fallbackUser?.name) return fallbackUser.name;
  return '—';
}

function getEmployeeDept(record) {
  if (record.employee && typeof record.employee === 'object') {
    return record.employee.department || record.employee.email || '—';
  }
  return '—';
}

export default function Attendance() {
  const { user, isManager } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [status, setStatus] = useState('not-checked-in');
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const [todayRes, myRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/my'),
      ]);
      setTodayRecord(todayRes.data.attendance);
      setStatus(todayRes.data.status);
      setRecords(myRes.data.records);

      if (isManager()) {
        const allRes = await api.get('/attendance/all');
        setAllRecords(allRes.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/checkin');
      showMsg('Checked in successfully!');
      fetchAttendance();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to clock in', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      await api.put('/attendance/checkout');
      showMsg('Checked out successfully!');
      fetchAttendance();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to clock out', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading attendance...</div>;

  return (
    <div className="page-container">
      {/* Top bar */}
      <div className="page-top-bar">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 13 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="status-badge-bar">
          {todayRecord?.checkIn && (
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              In: <strong style={{ color: '#111' }}>{formatTime(todayRecord.checkIn)}</strong>
              {todayRecord?.checkOut && (
                <> &nbsp;Out: <strong style={{ color: '#111' }}>{formatTime(todayRecord.checkOut)}</strong></>
              )}
            </span>
          )}
          {status === 'not-checked-in' && (
            <button className="btn-clock" onClick={handleClockIn} disabled={actionLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {actionLoading ? 'Clocking In...' : 'Clock In'}
            </button>
          )}
          {status === 'checked-in' && (
            <button className="btn-clock checkout" onClick={handleClockOut} disabled={actionLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {actionLoading ? 'Clocking Out...' : 'Clock Out'}
            </button>
          )}
          {status === 'checked-out' && (
            <span className="badge badge-active" style={{ padding: '8px 16px', fontSize: 13 }}>
              ✓ Done for today — {todayRecord?.workHours}h worked
            </span>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      {/* My Attendance History */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Attendance History</h2>
          <p className="card-subtitle">{records.length} records</p>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">No attendance records yet.</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{getEmployeeName(r, user)}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{getEmployeeDept(r)}</div>
                    </td>
                    <td>{formatDate(r.date)}</td>
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{formatTime(r.checkOut)}</td>
                    <td>{r.workHours ? `${r.workHours}h` : '—'}</td>
                    <td>
                      <span className={`badge badge-${r.status}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Employees (Manager view) */}
      {isManager() && allRecords.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h2 className="card-title">All Employees — Today's Attendance</h2>
            <p className="card-subtitle">{allRecords.length} records</p>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allRecords.map((r) => (
                  <tr key={r._id}>
                    <td>
                      {/* Populated object from backend */}
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {r.employee?.name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {r.employee?.department || r.employee?.email || '—'}
                      </div>
                    </td>
                    <td>{formatDate(r.date)}</td>
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{formatTime(r.checkOut)}</td>
                    <td>{r.workHours ? `${r.workHours}h` : '—'}</td>
                    <td>
                      <span className={`badge badge-${r.status}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
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
