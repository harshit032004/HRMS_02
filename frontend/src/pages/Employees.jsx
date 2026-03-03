import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '', jobTitle: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.employees);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/employees', form);
      setSuccessMsg('Employee created successfully!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'employee', department: '', jobTitle: '' });
      fetchEmployees();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading employees...</div>;

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <h1 className="page-title">Employees</h1>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
          + Add Employee
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">Employee List</h2>
            <p className="card-subtitle">{employees.length} total employees</p>
          </div>
          <input
            className="form-input"
            style={{ width: 240 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">No employees found.</td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp._id}>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{emp.employeeId}</td>
                    <td className="td-name">{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.jobTitle || '—'}</td>
                    <td>{emp.department || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{emp.role}</td>
                    <td>
                      <span className={`badge ${emp.isActive ? 'badge-active' : 'badge-rejected'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {emp.isActive && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeactivate(emp._id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add New Employee</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="John Doe" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="john@company.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password (default: password123)</label>
                <input className="form-input" type="password" placeholder="Leave blank for default"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" placeholder="e.g. Engineering" value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" placeholder="e.g. Software Engineer" value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
