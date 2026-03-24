import { useState, useEffect } from 'react';
import api from '../utils/api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const LEAVE_TYPES = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'other'];

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', leaveType: 'casual' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves/my');
      setLeaves(res.data.leaves);
    } catch (err) {
      setError('Failed to fetch leave history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date cannot be before start date');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/leaves/apply', form);
      setSuccess('Leave request submitted successfully!');
      setForm({ startDate: '', endDate: '', reason: '', leaveType: 'casual' });
      fetchLeaves();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      setSuccess('Leave request cancelled');
      fetchLeaves();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const filtered = filterStatus === 'all'
    ? leaves
    : leaves.filter((l) => l.status === filterStatus);

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

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select
                className="form-input"
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t} style={{ textTransform: 'capitalize' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)} Leave
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                className="form-input"
                type="date"
                value={form.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                className="form-input"
                type="date"
                value={form.endDate}
                min={form.startDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>

            {form.startDate && form.endDate && (
              <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f0f9ff', borderRadius: 6, fontSize: 13, color: '#0369a1' }}>
                Duration: {Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1} day(s)
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea
                className="form-input"
                placeholder="Briefly explain the reason for leave..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>

        {/* ── Leave History ── */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="card-title">My Leave History</h2>
              <p className="card-subtitle">{leaves.length} total requests</p>
            </div>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'pending', 'approved', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 6, border: '1px solid',
                    borderColor: filterStatus === s ? '#4f46e5' : '#e5e7eb',
                    background: filterStatus === s ? '#4f46e5' : 'white',
                    color: filterStatus === s ? 'white' : '#374151',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading" style={{ padding: 40 }}>Loading...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Reviewed By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="7" className="empty-state">No leave requests found.</td></tr>
                  ) : (
                    filtered.map((leave) => (
                      <tr key={leave._id}>
                        <td style={{ textTransform: 'capitalize', fontSize: 13 }}>{leave.leaveType || 'casual'}</td>
                        <td style={{ fontSize: 12 }}>
                          {leave.startDate}<br />
                          <span style={{ color: '#9ca3af' }}>to</span> {leave.endDate}
                        </td>
                        <td style={{ fontWeight: 600 }}>{leave.totalDays}d</td>
                        <td style={{ fontSize: 13, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leave.reason}</td>
                        <td>
                          <span className={`badge badge-${leave.status}`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                          {leave.reviewNote && (
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{leave.reviewNote}</div>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>
                          {leave.reviewedBy?.name || '—'}
                        </td>
                        <td>
                          {leave.status === 'pending' && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleCancel(leave._id)}
                              style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: 11 }}
                            >
                              Cancel
                            </button>
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
    </div>
  );
}
