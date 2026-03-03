import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (isManager()) {
        const res = await api.get('/dashboard/admin');
        setStats(res.data.stats);
        setEmployees(res.data.employees);
      } else {
        const res = await api.get('/dashboard/employee');
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  if (isManager()) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Employee Dashboard</h1>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              Total Employees
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
              </svg>
            </div>
            <div className="stat-value">{stats?.totalEmployees ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              Active Status
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-value">{stats?.activeStatus ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              Departments
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
              </svg>
            </div>
            <div className="stat-value">{stats?.departments ?? 0}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Employee List</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">No employees found.</td></tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id}>
                      <td className="td-name">{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.jobTitle || emp.role}</td>
                      <td>{emp.department || '—'}</td>
                      <td>
                        <span className={`badge ${emp.isActive ? 'badge-active' : 'badge-rejected'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Employee dashboard
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name}</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Status</div>
          <div style={{ marginTop: 10 }}>
            <span className={`badge ${
              stats?.todayStatus === 'checked-in' ? 'badge-present' :
              stats?.todayStatus === 'checked-out' ? 'badge-active' : 'badge-rejected'
            }`} style={{ fontSize: 16, padding: '6px 16px' }}>
              {stats?.todayStatus === 'checked-in' ? 'Checked In' :
               stats?.todayStatus === 'checked-out' ? 'Checked Out' : 'Not Checked In'}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Leaves</div>
          <div className="stat-value">{stats?.pendingLeaves ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved Leaves</div>
          <div className="stat-value">{stats?.approvedLeaves ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
