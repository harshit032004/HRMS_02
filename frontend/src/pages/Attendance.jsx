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

export default function Attendance() {
  const { user, isManager } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [status, setStatus] = useState('not-checked-in');
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const todayRes = await api.get('/attendance/today');
      setTodayRecord(todayRes.data.attendance);
      setStatus(todayRes.data.status);

      const myRes = await api.get('/attendance/my');
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

  const handleClockIn = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/attendance/checkin');
      setMessage('Checked in successfully!');
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await api.put('/attendance/checkout');
      setMessage('Checked out successfully!');
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading attendance...</div>;

  const viewingName = isManager() ? 'All Employees' : user?.name;

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <h1 className="page-title">Attendance Management</h1>
        <div className="status-badge-bar">
          <span className="status-text">
            Status: <strong>{status === 'checked-in' ? 'Checked In' : status === 'checked-out' ? 'Checked Out' : 'Checked Out'}</strong>
          </span>
          {status === 'not-checked-in' || status === 'checked-out' ? (
            !todayRecord?.checkOut && (
              <button
                className="btn-clock"
                onClick={handleClockIn}
                disabled={actionLoading || status === 'checked-out'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                Clock In
              </button>
            )
          ) : (
            <button
              className="btn-clock checkout"
              onClick={handleClockOut}
              disabled={actionLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Clock Out
            </button>
          )}
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Attendance History</h2>
          <p className="card-subtitle">Viewing records for {user?.name}</p>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">No attendance records found.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id}>
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

      {isManager() && allRecords.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h2 className="card-title">All Employees Attendance</h2>
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
                {allRecords.map((r) => (
                  <tr key={r._id}>
                    <td className="td-name">{r.employee?.name}</td>
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
