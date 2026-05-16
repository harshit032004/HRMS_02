import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const starColor = (n, rating) => n <= rating ? 'text-amber-400' : 'text-gray-700';

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`w-4 h-4 ${starColor(n, rating)}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function FeedbackModal({ employees, goals, onClose, onSaved }) {
  const [form, setForm] = useState({ employee: '', goal: '', feedbackText: '', rating: 3 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.employee || !form.feedbackText) {
      setError('Employee and feedback text are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/feedback', { ...form, goal: form.goal || undefined });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-white font-semibold text-lg">Add Feedback</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-2">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Employee *</label>
              <select value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60">
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Linked Goal (optional)</label>
              <select value={form.goal} onChange={e => setForm({...form, goal: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60">
                <option value="">General review</option>
                {goals.filter(g => !form.employee || g.assignedTo?._id === form.employee).map(g =>
                  <option key={g._id} value={g._id}>{g.title}</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Feedback *</label>
            <textarea value={form.feedbackText} onChange={e => setForm({...form, feedbackText: e.target.value})}
              rows={3} placeholder="Write your feedback here..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Rating *</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm({...form, rating: n})}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${form.rating >= n ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}>
                  {n}
                </button>
              ))}
              <span className="ml-2 text-gray-400 text-sm self-center">{['','Poor','Below Avg','Average','Good','Excellent'][form.rating]}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Feedback() {
  const { isManager } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [fRes, eRes, gRes] = await Promise.all([
        api.get('/feedback'),
        isManager() ? api.get('/employees') : Promise.resolve({ data: { employees: [] } }),
        api.get('/goals'),
      ]);
      setFeedbacks(fRes.data.feedbacks || []);
      setEmployees(eRes.data.employees || []);
      setGoals(gRes.data.goals || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="text-gray-400 text-sm mt-0.5">Performance feedback and ratings</p>
        </div>
        {isManager() && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add Feedback
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-4">
          <div className="text-2xl font-bold text-indigo-400">{feedbacks.length}</div>
          <div className="text-gray-500 text-xs mt-1">Total Feedback</div>
        </div>
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-4">
          <div className="text-2xl font-bold text-amber-400">{avgRating}</div>
          <div className="text-gray-500 text-xs mt-1">Avg Rating</div>
        </div>
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-4">
          <div className="text-2xl font-bold text-emerald-400">{feedbacks.filter(f => f.rating >= 4).length}</div>
          <div className="text-gray-500 text-xs mt-1">High Ratings (4-5)</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}></div>)}</div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No feedback yet.</div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <div key={fb._id} className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{fb.employee?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{fb.employee?.name}</div>
                      <div className="text-gray-500 text-xs">{fb.employee?.department}</div>
                    </div>
                  </div>
                  {fb.goal && (
                    <div className="mb-2 text-xs text-indigo-400 bg-indigo-500/10 rounded-lg px-3 py-1 w-fit border border-indigo-500/20">
                      🎯 {fb.goal?.title}
                    </div>
                  )}
                  <p className="text-gray-300 text-sm leading-relaxed">{fb.feedbackText}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>By {fb.givenBy?.name}</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <StarDisplay rating={fb.rating} />
                  <div className="text-gray-500 text-xs mt-1">{fb.rating}/5</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <FeedbackModal employees={employees} goals={goals} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
