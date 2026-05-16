import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const priorityColors = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  high: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const statusColors = {
  pending: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const statusLabel = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };

function GoalModal({ goal, employees, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    assignedTo: goal?.assignedTo?._id || '',
    deadline: goal?.deadline ? goal.deadline.split('T')[0] : '',
    priority: goal?.priority || 'medium',
    status: goal?.status || 'pending',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.title || !form.assignedTo || !form.deadline) {
      setError('Title, employee, and deadline are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (goal) {
        await api.put(`/goals/${goal._id}`, form);
      } else {
        await api.post('/goals', form);
      }
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-white font-semibold text-lg">{goal ? 'Edit Goal' : 'Create Goal'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-2">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Goal Title *</label>
            <input name="title" value={form.title} onChange={handle} placeholder="e.g. Complete Q2 sales target"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={2} placeholder="Brief description of the goal"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Assign To *</label>
              <select name="assignedTo" value={form.assignedTo} onChange={handle}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors">
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Deadline *</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handle}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handle}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            {goal && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <select name="status" value={form.status} onChange={handle}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors">
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : goal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressModal({ goal, onClose, onSaved }) {
  const [form, setForm] = useState({ status: goal.status, progress: goal.progress });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.put(`/goals/${goal._id}`, form);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-white font-semibold">Update Progress</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60">
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Progress: {form.progress}%</label>
            <input type="range" min={0} max={100} value={form.progress}
              onChange={e => setForm({...form, progress: Number(e.target.value)})}
              className="w-full accent-indigo-500" />
            <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${form.progress}%` }}></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Goals() {
  const { user, isManager } = useAuth();
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [progressGoal, setProgressGoal] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [gRes, eRes] = await Promise.all([
        api.get('/goals'),
        isManager() ? api.get('/employees') : Promise.resolve({ data: { employees: [] } }),
      ]);
      setGoals(gRes.data.goals || []);
      setEmployees(eRes.data.employees || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteGoal = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await api.delete(`/goals/${id}`);
    load();
  };

  const onSaved = () => { setShowModal(false); setEditGoal(null); setProgressGoal(null); load(); };

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter);

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed').length,
    inProgress: goals.filter(g => g.status === 'in_progress').length,
    pending: goals.filter(g => g.status === 'pending').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals & Objectives</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track and manage performance goals</p>
        </div>
        {isManager() && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            New Goal
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Goals', value: stats.total, color: 'text-indigo-400' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1117] border border-white/5 rounded-2xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 w-fit">
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex gap-2">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}></div>)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No goals found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(goal => (
            <div key={goal._id} className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-semibold truncate">{goal.title}</h3>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${priorityColors[goal.priority]}`}>{goal.priority}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColors[goal.status]}`}>{statusLabel[goal.status]}</span>
                  </div>
                  {goal.description && <p className="text-gray-500 text-xs mb-2 line-clamp-2">{goal.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>👤 {goal.assignedTo?.name || 'Unknown'}</span>
                    <span>🏢 {goal.assignedTo?.department || '—'}</span>
                    <span>📅 {new Date(goal.deadline).toLocaleDateString()}</span>
                    {isManager() && <span>Assigned by {goal.assignedBy?.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isManager() && (
                    <button onClick={() => setProgressGoal(goal)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors border border-indigo-500/20">
                      Update
                    </button>
                  )}
                  {isManager() && (
                    <>
                      <button onClick={() => { setEditGoal(goal); setShowModal(true); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={() => deleteGoal(goal._id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <GoalModal
          goal={editGoal}
          employees={employees}
          onClose={() => { setShowModal(false); setEditGoal(null); }}
          onSaved={onSaved}
        />
      )}
      {progressGoal && (
        <ProgressModal goal={progressGoal} onClose={() => setProgressGoal(null)} onSaved={onSaved} />
      )}
    </div>
  );
}
