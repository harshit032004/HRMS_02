import { useState, useEffect } from 'react';
import api from '../utils/api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/my');
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/leaves/apply', form);
      setSuccess('Leave request submitted successfully!');
      setForm({ startDate: '', endDate: '', reason: '' });
      fetchLeaves();
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
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
      </div>

      <div className="split-layout">
        {/* Apply for Leave */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Apply for Leave</h2>
            <p className="card-subtitle">Submit a new time-off request.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                className="form-input"
                type="date"
                value={form.startDate}
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
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <input
                className="form-input"
                placeholder="E.g., Vacation, Sick leave..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Leave History */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">My Leave History</h2>
            <p className="card-subtitle">View your past and pending applications.</p>
          </div>

          {loading ? (
            <div className="loading" style={{ padding: 40 }}>Loading...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Applied On</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr><td colSpan="5" className="empty-state">No leave requests found.</td></tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave._id}>
                        <td style={{ fontWeight: 500 }}>
                          {leave.startDate} to {leave.endDate}
                        </td>
                        <td>{leave.reason}</td>
                        <td>{formatDate(leave.createdAt)}</td>
                        <td>
                          <span className={`badge badge-${leave.status}`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          {leave.status === 'pending' && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleCancel(leave._id)}
                              style={{ color: '#dc2626', borderColor: '#dc2626' }}
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
