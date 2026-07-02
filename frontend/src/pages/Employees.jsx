import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';
import api from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all";

const InputField = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
      {label}{hint && <span className="normal-case font-normal ml-1 text-gray-400">({hint})</span>}
    </label>
    {children}
  </div>
);

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '', jobTitle: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try { const res = await api.get('/employees'); setEmployees(res.data.employees); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
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
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to create employee'); }
    finally { setFormLoading(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this employee? They will lose access to the system.')) return;
    try { await api.delete(`/employees/${id}`); fetchEmployees(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to deactivate'); }
  };

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const active   = employees.filter(e => e.isActive).length;
  const inactive = employees.length - active;

  if (loading) return (
    <div className="p-8 space-y-6">
      {/* Keep the header visible while data loads */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your workforce and team members</p>
        </div>
      </div>
      {/* 5-row × 6-col skeleton table */}
      <SkeletonLoader variant="table" rows={5} cols={6} />
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb crumbs={[{ label: 'Employees' }]} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your workforce and team members</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 self-start sm:self-auto">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: employees.length, color: 'indigo' },
          { label: 'Active',   value: active,           color: 'emerald' },
          { label: 'Inactive', value: inactive,         color: 'gray' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : s.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          {successMsg}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Employee Directory</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{filtered.length} of {employees.length} records</p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, department…"
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/[0.04]">
                {['ID', 'Employee', 'Job Title', 'Department', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-16 text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">No employees found.</p>
                </td></tr>
              ) : filtered.map(emp => (
                <tr key={emp._id} className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/employees/${emp._id}`)}>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-400 dark:text-gray-500">{emp.employeeId}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        {emp.avatarUrl
                          ? <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                          : <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">{emp.name?.[0]?.toUpperCase() || '?'}</span>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{emp.jobTitle || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{emp.department || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">{emp.role}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 border border-gray-200 dark:border-white/10'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {emp.isActive && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeactivate(emp._id); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add New Employee</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Fill in the details below to create an account</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm mb-5">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Full Name">
                  <input className={inputCls} placeholder="Jane Doe" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})} required />
                </InputField>
                <InputField label="Email Address">
                  <input className={inputCls} type="email" placeholder="jane@company.com" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} required />
                </InputField>
                <InputField label="Password" hint="leave blank for default: password123">
                  <input className={inputCls} type="password" placeholder="••••••••" value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} />
                </InputField>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Role">
                    <select className={inputCls} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </InputField>
                  <InputField label="Department">
                    <input className={inputCls} placeholder="e.g. Engineering" value={form.department}
                      onChange={e => setForm({...form, department: e.target.value})} />
                  </InputField>
                </div>
                <InputField label="Job Title">
                  <input className={inputCls} placeholder="e.g. Software Engineer" value={form.jobTitle}
                    onChange={e => setForm({...form, jobTitle: e.target.value})} />
                </InputField>

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                    {formLoading
                      ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating…</>
                      : 'Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
