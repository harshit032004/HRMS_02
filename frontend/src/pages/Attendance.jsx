import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';

function formatTime(dt) { if(!dt) return '—'; return new Date(dt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }
function formatDate(d)   { if(!d) return '—';  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function getEmployeeName(r,fb) { if(r.employee&&typeof r.employee==='object'&&r.employee.name) return r.employee.name; return fb?.name||'—'; }
function getEmployeeDept(r)    { if(r.employee&&typeof r.employee==='object') return r.employee.department||r.employee.email||'—'; return '—'; }

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); },[]);
  return (
    <div style={{ fontFamily:'monospace',fontSize:13,color:'#6b7280',letterSpacing:1 }}>
      {time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
    </div>
  );
}

export default function Attendance() {
  const { user, isManager } = useAuth();
  const toast = useToast();
  const [todayRecord,  setTodayRecord]  = useState(null);
  const [status,       setStatus]       = useState('not-checked-in');
  const [records,      setRecords]      = useState([]);
  const [allRecords,   setAllRecords]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [actionLoading,setActionLoading]= useState(false);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const [todayRes, myRes] = await Promise.all([api.get('/attendance/today'), api.get('/attendance/my')]);
      setTodayRecord(todayRes.data.attendance);
      setStatus(todayRes.data.status);
      setRecords(myRes.data.records);
      if (isManager()) { const allRes = await api.get('/attendance/all'); setAllRecords(allRes.data.records); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try { await api.post('/attendance/checkin'); toast.success('Checked in successfully! Have a productive day 🚀'); fetchAttendance(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to clock in'); }
    finally { setActionLoading(false); }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try { await api.put('/attendance/checkout'); toast.success('Checked out successfully! Great work today 👏'); fetchAttendance(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to clock out'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading">Loading attendance...</div>;

  // Status pill colors
  const statusPill = {
    'not-checked-in': { bg:'#fee2e2', color:'#991b1b', text:'● Not Checked In' },
    'checked-in':     { bg:'#d1fae5', color:'#065f46', text:'● Checked In' },
    'checked-out':    { bg:'#ede9fe', color:'#4c1d95', text:'✓ Done for Today' },
  };
  const pill = statusPill[status] || statusPill['not-checked-in'];

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p style={{ color:'#6b7280',marginTop:4,fontSize:13 }}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>

        <div style={{ display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
          {/* Live clock */}
          <LiveClock/>

          {/* Status pill */}
          <span style={{ padding:'6px 14px',borderRadius:99,fontSize:12,fontWeight:600,background:pill.bg,color:pill.color }}>
            {pill.text}
            {status==='checked-out' && todayRecord?.workHours ? ` — ${todayRecord.workHours}h worked` : ''}
          </span>

          {/* Check-in/out times */}
          {todayRecord?.checkIn && (
            <span style={{ fontSize:13,color:'#6b7280' }}>
              In: <strong style={{ color:'#111' }}>{formatTime(todayRecord.checkIn)}</strong>
              {todayRecord?.checkOut && <>&nbsp;Out: <strong style={{ color:'#111' }}>{formatTime(todayRecord.checkOut)}</strong></>}
            </span>
          )}

          {/* Clock buttons */}
          {status==='not-checked-in' && (
            <button className="btn-clock" onClick={handleClockIn} disabled={actionLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {actionLoading ? 'Clocking In...' : 'Clock In'}
            </button>
          )}
          {status==='checked-in' && (
            <button className="btn-clock checkout" onClick={handleClockOut} disabled={actionLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {actionLoading ? 'Clocking Out...' : 'Clock Out'}
            </button>
          )}
        </div>
      </div>

      {/* My Attendance History */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Attendance History</h2>
          <p className="card-subtitle">{records.length} records</p>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Status</th></tr></thead>
            <tbody>
              {records.length===0 ? (
                <tr><td colSpan="6">
                  <div style={{ textAlign:'center',padding:'40px' }}>
                    <div style={{ fontSize:36,marginBottom:12 }}>📅</div>
                    <p style={{ fontWeight:600,color:'#374151' }}>No attendance records yet</p>
                    <p style={{ fontSize:13,color:'#9ca3af',marginTop:4 }}>Clock in to start tracking your attendance</p>
                  </div>
                </td></tr>
              ) : records.map((r) => (
                <tr key={r._id}>
                  <td><div style={{ fontWeight:600,fontSize:14 }}>{getEmployeeName(r,user)}</div><div style={{ fontSize:11,color:'#9ca3af' }}>{getEmployeeDept(r)}</div></td>
                  <td>{formatDate(r.date)}</td>
                  <td>{formatTime(r.checkIn)}</td>
                  <td>{formatTime(r.checkOut)}</td>
                  <td>{r.workHours?`${r.workHours}h`:'—'}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Employees (Manager) */}
      {isManager() && allRecords.length>0 && (
        <div className="card" style={{ marginTop:24 }}>
          <div className="card-header">
            <h2 className="card-title">All Employees — Today's Attendance</h2>
            <p className="card-subtitle">{allRecords.length} records</p>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {allRecords.map((r)=>(
                  <tr key={r._id}>
                    <td><div style={{ fontWeight:600,fontSize:14 }}>{r.employee?.name||'—'}</div><div style={{ fontSize:11,color:'#9ca3af' }}>{r.employee?.department||r.employee?.email||'—'}</div></td>
                    <td>{formatDate(r.date)}</td>
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{formatTime(r.checkOut)}</td>
                    <td>{r.workHours?`${r.workHours}h`:'—'}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span></td>
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
