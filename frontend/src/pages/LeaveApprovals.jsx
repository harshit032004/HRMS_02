import { useState, useEffect } from 'react';
import api from '../utils/api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN');
}

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaves/all${filter !== 'all' ? `?status=${filter}` : ''}`);
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    setActionLoading(id + status);
    setMessage('');
    try {
      await api.put(`/leaves/${id}/review`, { status });
      setMessage(`Leave ${status} successfully!`);
      fetchLeaves();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Approvals</h1>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: filter === f ? '#4f46e5' : '#e5e7eb',
              background: filter === f ? '#4f46e5' : 'white',
              color: filter === f ? 'white' : '#374151',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} Leave Requests
          </h2>
          <p className="card-subtitle">{leaves.length} requests</p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state">No leave requests found.</td></tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>
                        <div className="td-name">{leave.employee?.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{leave.employee?.email}</div>
                      </td>
                      <td>{leave.employee?.department || '—'}</td>
                      <td style={{ fontSize: 13 }}>
                        {leave.startDate}<br />
                        <span style={{ color: '#9ca3af' }}>to</span> {leave.endDate}
                      </td>
                      <td>{leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}</td>
                      <td>{leave.reason}</td>
                      <td>{formatDate(leave.createdAt)}</td>
                      <td>
                        <span className={`badge badge-${leave.status}`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                        {leave.reviewedBy && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                            by {leave.reviewedBy.name}
                          </div>
                        )}
                      </td>
                      <td>
                        {leave.status === 'pending' && (
                          <div className="action-btns">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleReview(leave._id, 'approved')}
                              disabled={actionLoading === leave._id + 'approved'}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReview(leave._id, 'rejected')}
                              disabled={actionLoading === leave._id + 'rejected'}
                            >
                              ✗ Reject
                            </button>
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
    </div>
  );
}
