import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumb';

const ratingLabel = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
const ratingColor = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-blue-400', 'text-emerald-400'];

function ReviewModal({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee: '', period: 'monthly', overallRating: 3,
    strengths: '', areasOfImprovement: '', comments: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.employee) { setError('Please select an employee.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/reviews', form);
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#0d1117]">
          <h2 className="text-gray-900 dark:text-white font-semibold text-lg">New Performance Review</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-2">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Employee *</label>
              <select value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500/60">
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Review Period</label>
              <select value={form.period} onChange={e => setForm({...form, period: e.target.value})}
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500/60">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Overall Rating *</label>
            <div className="flex gap-2 items-center">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm({...form, overallRating: n})}
                  className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${form.overallRating === n ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-500 hover:border-white/20'}`}>
                  {n}
                </button>
              ))}
              <span className={`ml-2 text-sm font-medium ${ratingColor[form.overallRating]}`}>{ratingLabel[form.overallRating]}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Strengths</label>
            <textarea value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})}
              rows={2} placeholder="What does this employee do well?"
              className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Areas of Improvement</label>
            <textarea value={form.areasOfImprovement} onChange={e => setForm({...form, areasOfImprovement: e.target.value})}
              rows={2} placeholder="What can be improved?"
              className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Comments</label>
            <textarea value={form.comments} onChange={e => setForm({...form, comments: e.target.value})}
              rows={2} placeholder="Additional comments..."
              className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { isManager } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, eRes] = await Promise.all([
        api.get('/reviews'),
        isManager() ? api.get('/employees') : Promise.resolve({ data: { employees: [] } }),
      ]);
      setReviews(rRes.data.reviews || []);
      setEmployees(eRes.data.employees || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumb crumbs={[{ label: 'Performance Reviews' }]} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Reviews</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Periodic performance evaluations</p>
        </div>
        {isManager() && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            New Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl p-4">
          <div className="text-2xl font-bold text-indigo-400">{reviews.length}</div>
          <div className="text-gray-500 text-xs mt-1">Total Reviews</div>
        </div>
        <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl p-4">
          <div className="text-2xl font-bold text-amber-400">{avgRating}</div>
          <div className="text-gray-500 text-xs mt-1">Avg Rating</div>
        </div>
        <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl p-4">
          <div className="text-2xl font-bold text-purple-400">{reviews.filter(r => r.period === 'quarterly').length}</div>
          <div className="text-gray-500 text-xs mt-1">Quarterly Reviews</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}></div>)}</div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No reviews yet.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map(rv => (
            <div key={rv._id} className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden hover:border-gray-200 dark:border-white/10 transition-all">
              <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(expanded === rv._id ? null : rv._id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-900 dark:text-white text-sm font-bold">{rv.employee?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-semibold text-sm">{rv.employee?.name}</div>
                      <div className="text-gray-500 text-xs">{rv.employee?.department} · {rv.period} review</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${ratingColor[rv.overallRating]}`}>{rv.overallRating}/5</div>
                      <div className={`text-xs ${ratingColor[rv.overallRating]}`}>{ratingLabel[rv.overallRating]}</div>
                    </div>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded === rv._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </button>
              {expanded === rv._id && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-white/5 pt-4 grid gap-3">
                  {rv.strengths && (
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                      <div className="text-emerald-400 text-xs font-semibold mb-1">✅ Strengths</div>
                      <p className="text-gray-300 text-sm">{rv.strengths}</p>
                    </div>
                  )}
                  {rv.areasOfImprovement && (
                    <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                      <div className="text-amber-400 text-xs font-semibold mb-1">📈 Areas of Improvement</div>
                      <p className="text-gray-300 text-sm">{rv.areasOfImprovement}</p>
                    </div>
                  )}
                  {rv.comments && (
                    <div className="bg-white/3 border border-gray-100 dark:border-white/5 rounded-xl p-3">
                      <div className="text-gray-400 text-xs font-semibold mb-1">💬 Comments</div>
                      <p className="text-gray-300 text-sm">{rv.comments}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-1">Reviewed by {rv.reviewedBy?.name} · {new Date(rv.createdAt).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ReviewModal employees={employees} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
