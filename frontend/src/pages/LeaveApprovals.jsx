import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit',month:'short',year:'numeric' });
}

export default function LeaveApprovals() {
  const toast = useToast();
  const [leaves,        setLeaves]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('pending');
  const [actionLoading, setActionLoading] = useState('');
  const [reviewNote,    setReviewNote]    = useState('');
  const [selectedId,    setSelectedId]    = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState('');
  // counts from ALL leaves regardless of filter for badge numbers
  const [allLeaves,     setAllLeaves]     = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get('/leaves/all');
      setAllLeaves(res.data.leaves || []);
    } catch (_) {}
  }, []);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/leaves/all' : `/leaves/all?status=${filter}`;
      const res = await api.get(url);
      setLeaves(res.data.leaves || []);
    } catch (err) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchLeaves(); fetchAll(); }, [fetchLeaves, fetchAll]);

  const openReviewModal = (id, action) => {
    setSelectedId(id); setPendingAction(action); setReviewNote(''); setShowNoteModal(true);
  };

  const handleReview = async () => {
    setShowNoteModal(false);
    setActionLoading(selectedId + pendingAction);
    try {
      await api.patch(`/leaves/${selectedId}/${pendingAction}`, { reviewNote });
      toast.success(`Leave ${pendingAction}d successfully!`);
      fetchLeaves(); fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${pendingAction} leave`);
    } finally {
      setActionLoading(''); setSelectedId(null);
    }
  };

  const quickAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      await api.patch(`/leaves/${id}/${action}`, { reviewNote:'' });
      toast.success(`Leave ${action}d successfully!`);
      fetchLeaves(); fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} leave`);
    } finally {
      setActionLoading('');
    }
  };

  // Counts from allLeaves for badges
  const counts = {
    pending:  allLeaves.filter(l=>l.status==='pending').length,
    approved: allLeaves.filter(l=>l.status==='approved').length,
    rejected: allLeaves.filter(l=>l.status==='rejected').length,
    all:      allLeaves.length,
  };

  const tabs = [
    { key:'pending',  label:'Pending',  color:'#f59e0b', activeColor:'#f59e0b' },
    { key:'approved', label:'Approved', color:'#10b981', activeColor:'#10b981' },
    { key:'rejected', label:'Rejected', color:'#ef4444', activeColor:'#ef4444' },
    { key:'all',      label:'All',      color:'#6366f1', activeColor:'#6366f1' },
  ];

  const rowStripe = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Approvals</h1>
        <p style={{ color:'#6b7280',marginTop:4 }}>Review and manage employee leave requests</p>
      </div>

      {/* Filter Tabs with count badges */}
      <div style={{ display:'flex',gap:8,marginBottom:20,flexWrap:'wrap' }}>
        {tabs.map(({ key, label, color }) => (
          <button key={key} onClick={()=>setFilter(key)}
            style={{ padding:'8px 18px',borderRadius:8,border:'1px solid',borderColor:filter===key?color:'#e5e7eb',background:filter===key?color:'white',color:filter===key?'white':'#374151',fontWeight:500,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:7,transition:'all 0.2s' }}>
            {label}
            {counts[key] > 0 && (
              <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:20,height:20,borderRadius:99,background:filter===key?'rgba(255,255,255,0.25)':color,color:filter===key?'white':'white',fontSize:11,fontWeight:700,padding:'0 5px' }}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{filter==='all'?'All':filter.charAt(0).toUpperCase()+filter.slice(1)} Leave Requests</h2>
          <p className="card-subtitle">{leaves.length} requests</p>
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Leave Type</th><th>Duration</th><th>Days</th>
                  <th>Reason</th><th>Applied On</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div style={{ textAlign:'center',padding:'48px 20px' }}>
                        <div style={{ fontSize:36,marginBottom:12 }}>📋</div>
                        <p style={{ fontWeight:600,color:'#374151',marginBottom:4 }}>No requests found</p>
                        <p style={{ fontSize:13,color:'#9ca3af' }}>No {filter==='all'?'':filter} leave requests at this time.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id} style={{ position:'relative' }}>
                      <td>
                        {/* Left color stripe by status */}
                        <div style={{ position:'absolute',left:0,top:0,bottom:0,width:3,background:rowStripe[leave.status]||'#e5e7eb',borderRadius:'2px 0 0 2px' }}/>
                        <div style={{ fontWeight:600,fontSize:14 }}>{leave.employee?.name||leave.employee?.email?.split('@')[0]||'Unknown'}</div>
                        <div style={{ fontSize:11,color:'#9ca3af' }}>{leave.employee?.email||'—'}</div>
                        <div style={{ fontSize:11,color:'#6b7280' }}>{leave.employee?.department||''}{leave.employee?.employeeId?` · ${leave.employee.employeeId}`:''}</div>
                      </td>
                      <td style={{ textTransform:'capitalize',fontSize:13 }}>{leave.leaveType||'casual'}</td>
                      <td style={{ fontSize:12 }}>{leave.startDate}<br/><span style={{ color:'#9ca3af' }}>to</span> {leave.endDate}</td>
                      <td style={{ fontWeight:600,textAlign:'center' }}>{leave.totalDays}</td>
                      <td style={{ fontSize:13,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{leave.reason}</td>
                      <td style={{ fontSize:13 }}>{formatDate(leave.createdAt)}</td>
                      <td>
                        <span className={`badge badge-${leave.status}`}>{leave.status.charAt(0).toUpperCase()+leave.status.slice(1)}</span>
                        {leave.reviewedBy && <div style={{ fontSize:11,color:'#9ca3af',marginTop:2 }}>by {leave.reviewedBy.name}</div>}
                        {leave.reviewNote && <div style={{ fontSize:11,color:'#6b7280',fontStyle:'italic',marginTop:2 }}>"{leave.reviewNote}"</div>}
                      </td>
                      <td>
                        {leave.status === 'pending' && (
                          <div className="action-btns">
                            <button className="btn btn-success btn-sm" onClick={()=>quickAction(leave._id,'approve')} disabled={actionLoading===leave._id+'approve'}>
                              {actionLoading===leave._id+'approve'?'...':'✓'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={()=>quickAction(leave._id,'reject')} disabled={actionLoading===leave._id+'reject'}>
                              {actionLoading===leave._id+'reject'?'...':'✗'}
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={()=>openReviewModal(leave._id,'approve')} style={{ fontSize:11 }}>+ Note</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={()=>setShowNoteModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 className="modal-title">{pendingAction==='approve'?'✓ Approve':'✗ Reject'} Leave</h3>
            <div className="form-group">
              <label className="form-label">Review Note (optional)</label>
              <textarea className="form-input" placeholder="Add a note for the employee..." value={reviewNote} onChange={e=>setReviewNote(e.target.value)} rows={3}/>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowNoteModal(false)}>Cancel</button>
              <button className={`btn ${pendingAction==='approve'?'btn-success':'btn-danger'}`} onClick={handleReview}>
                Confirm {pendingAction==='approve'?'Approval':'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
