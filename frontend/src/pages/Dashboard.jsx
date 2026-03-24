import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setError('');
      const endpoint = isManager() ? '/dashboard/admin' : '/dashboard/employee';
      const res = await api.get(endpoint);
      setStats(res.data.stats);
      setRecentLeaves(res.data.recentLeaves || []);
      setEmployees(res.data.employees || []);
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  // ── HR / Admin / Manager Dashboard ──
  if (isManager()) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">HR Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>Welcome back, {user?.name}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-label">Total Employees</div>
            <div className="stat-value">{stats?.totalEmployees ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Leaves</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats?.pendingLeaves ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved Leaves</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{stats?.approvedLeaves ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rejected Leaves</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{stats?.rejectedLeaves ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
          {/* Pending Leave Requests */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Pending Requests</h2>
              <p className="card-subtitle">Requires your action</p>
            </div>
            {recentLeaves.length === 0 ? (
              <p className="empty-state">No pending leave requests 🎉</p>
            ) : (
              recentLeaves.map((leave) => (
                <div key={leave._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{leave.employee?.name}</p>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>
                      {leave.startDate} → {leave.endDate} ({leave.totalDays}d)
                    </p>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>{leave.reason}</p>
                  </div>
                  <span className="badge badge-pending">Pending</span>
                </div>
              ))
            )}
          </div>

          {/* Employee List */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Employee List</h2>
              <p className="card-subtitle">{employees.length} total</p>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 8).map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{emp.email}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{emp.department || '—'}</td>
                      <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{emp.role}</td>
                      <td>
                        <span className={`badge ${emp.isActive ? 'badge-active' : 'badge-rejected'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Employee Dashboard ──
  const statusColor = {
    'checked-in': '#10b981',
    'checked-out': '#6366f1',
    'not-checked-in': '#ef4444',
  };
  const statusLabel = {
    'checked-in': 'Checked In',
    'checked-out': 'Checked Out',
    'not-checked-in': 'Not Checked In',
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name} 👋</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>{user?.jobTitle} · {user?.department}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Status</div>
          <div style={{
            marginTop: 12, fontSize: 18, fontWeight: 700,
            color: statusColor[stats?.todayStatus] || '#374151'
          }}>
            {statusLabel[stats?.todayStatus] || 'Unknown'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Leaves</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stats?.pendingLeaves ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved Leaves</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{stats?.approvedLeaves ?? 0}</div>
        </div>
      </div>

      {/* Recent Leave History */}
      {recentLeaves.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Leave Requests</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Duration</th><th>Type</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td style={{ fontSize: 13 }}>{leave.startDate} → {leave.endDate}</td>
                    <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{leave.leaveType || 'casual'}</td>
                    <td style={{ fontSize: 13 }}>{leave.reason}</td>
                    <td>
                      <span className={`badge badge-${leave.status}`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
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
