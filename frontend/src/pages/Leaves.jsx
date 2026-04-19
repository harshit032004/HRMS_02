import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

const LEAVE_TYPES = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'other'];

export default function Leaves() {
  const toast = useToast();
  const [leaves,       setLeaves]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ startDate:'', endDate:'', reason:'', leaveType:'casual' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves/my');
      setLeaves(res.data.leaves);
    } catch (err) {
      toast.error('Failed to fetch leave history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/leaves/apply', form);
      toast.success('Leave request submitted successfully! ✅');
      setForm({ startDate:'', endDate:'', reason:'', leaveType:'casual' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      toast.success('Leave request cancelled');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel leave');
    }
  };

  // Duration calculation
  const durationDays = form.startDate && form.endDate
    ? Math.max(0, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000*60*60*24)) + 1)
    : 0;

  const filtered = filterStatus === 'all' ? leaves : leaves.filter(l => l.status === filterStatus);

  // Count badges
  const counts = {
    all:      leaves.length,
    pending:  leaves.filter(l=>l.status==='pending').length,
    approved: leaves.filter(l=>l.status==='approved').length,
    rejected: leaves.filter(l=>l.status==='rejected').length,
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
      </div>

      <div className="split-layout">
        {/* ── Apply Form ── */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Apply for Leave</h2>
            <p className="card-subtitle">Submit a new time-off request</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select className="form-input" value={form.leaveType}
                onChange={e=>setForm({...form, leaveType:e.target.value})}>
                {LEAVE_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)} Leave</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e=>setForm({...form, startDate:e.target.value})} required/>
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.endDate}
                min={form.startDate || new Date().toISOString().split('T')[0]}
                onChange={e=>setForm({...form, endDate:e.target.value})} required/>
            </div>

            {/* Duration preview */}
            {durationDays > 0 && (
              <div style={{ marginBottom:16,padding:'10px 14px',background:'#f0f9ff',borderRadius:8,fontSize:13,color:'#0369a1',display:'flex',alignItems:'center',gap:8,border:'1px solid #bae6fd' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <strong>Duration: {durationDays} day{durationDays!==1?'s':''}</strong>
                <span style={{ color:'#64748b' }}>({formatDate(form.startDate)} – {formatDate(form.endDate)})</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display:'flex',justifyContent:'space-between' }}>
                <span>Reason</span>
                <span style={{ fontSize:11,color:form.reason.length>180?'#ef4444':'#9ca3af',fontWeight:400 }}>
                  {form.reason.length}/200
                </span>
              </label>
              <textarea className="form-input"
                placeholder="Briefly explain the reason for leave..."
                value={form.reason}
                onChange={e=>{ if(e.target.value.length<=200) setForm({...form,reason:e.target.value}); }}
                rows={3} required/>
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* ── Leave History ── */}
        <div className="card">
          <div className="card-header" style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
            <div>
              <h2 className="card-title">My Leave History</h2>
              <p className="card-subtitle">{leaves.length} total requests</p>
            </div>
            {/* Filter tabs with count badges */}
            <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
              {[
                { key:'all',      color:'#6366f1' },
                { key:'pending',  color:'#f59e0b' },
                { key:'approved', color:'#10b981' },
                { key:'rejected', color:'#ef4444' },
              ].map(({ key, color }) => (
                <button key={key} onClick={()=>setFilterStatus(key)}
                  style={{
                    padding:'5px 10px',borderRadius:6,border:'1px solid',
                    borderColor: filterStatus===key ? color : '#e5e7eb',
                    background:  filterStatus===key ? color : 'white',
                    color:       filterStatus===key ? 'white' : '#374151',
                    fontSize:12,fontWeight:500,cursor:'pointer',
                    display:'flex',alignItems:'center',gap:5,
                    textTransform:'capitalize',
                  }}>
                  {key}
                  {counts[key] > 0 && (
                    <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:18,height:18,borderRadius:99,background:filterStatus===key?'rgba(255,255,255,0.25)':color,color:'white',fontSize:10,fontWeight:700,padding:'0 4px' }}>
                      {counts[key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading" style={{ padding:40 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center',padding:'48px 20px' }}>
              <div style={{ fontSize:40,marginBottom:12 }}>📋</div>
              <p style={{ fontWeight:600,color:'#374151',marginBottom:4 }}>No leave requests</p>
              <p style={{ fontSize:13,color:'#9ca3af' }}>
                {filterStatus==='all' ? 'Apply for your first leave using the form.' : `No ${filterStatus} requests found.`}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th><th>Duration</th><th>Days</th>
                    <th>Reason</th><th>Status</th><th>Reviewed By</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((leave) => (
                    <tr key={leave._id}>
                      <td style={{ textTransform:'capitalize',fontSize:13 }}>{leave.leaveType||'casual'}</td>
                      <td style={{ fontSize:12 }}>
                        {leave.startDate}<br/>
                        <span style={{ color:'#9ca3af' }}>to</span> {leave.endDate}
                      </td>
                      <td style={{ fontWeight:600 }}>{leave.totalDays}d</td>
                      <td style={{ fontSize:13,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{leave.reason}</td>
                      <td>
                        <span className={`badge badge-${leave.status}`}>
                          {leave.status.charAt(0).toUpperCase()+leave.status.slice(1)}
                        </span>
                        {leave.reviewNote && (
                          <div style={{ fontSize:11,color:'#9ca3af',marginTop:2 }}>{leave.reviewNote}</div>
                        )}
                      </td>
                      <td style={{ fontSize:12,color:'#6b7280' }}>{leave.reviewedBy?.name||'—'}</td>
                      <td>
                        {leave.status==='pending' && (
                          <button className="btn btn-outline btn-sm"
                            onClick={()=>handleCancel(leave._id)}
                            style={{ color:'#dc2626',borderColor:'#fca5a5',fontSize:11 }}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
