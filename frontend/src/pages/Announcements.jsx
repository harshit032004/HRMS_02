import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import Breadcrumb from '../components/Breadcrumb';

// ── helpers ──────────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PRIORITY_STYLES = {
  urgent: { badge: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400', dot: 'bg-red-500', border: 'border-l-red-500' },
  normal: { badge: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-l-blue-500' },
  low:    { badge: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400', dot: 'bg-gray-400', border: 'border-l-gray-400' },
};

// ── Announcement Form Modal ───────────────────────────────────────────────────
function AnnouncementModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:     existing?.title     || '',
    body:      existing?.body      || '',
    priority:  existing?.priority  || 'normal',
    expiresAt: existing?.expiresAt ? existing.expiresAt.slice(0, 10) : '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) { setErr('Title and body are required.'); return; }
    setLoading(true);
    setErr('');
    try {
      const payload = { ...form, expiresAt: form.expiresAt || null };
      if (existing) {
        await api.patch(`/announcements/${existing._id}`, payload);
      } else {
        await api.post('/announcements', payload);
      }
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {existing ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {err && <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">{err}</p>}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Office closed on Friday"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Body *</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Full announcement text…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-gray-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Expires (optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {loading && <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>}
            {existing ? 'Save Changes' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View All Modal ────────────────────────────────────────────────────────────
function ViewAllModal({ announcements, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">All Announcements</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">
          {announcements.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No active announcements.</p>
          )}
          {announcements.map(ann => {
            const s = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.normal;
            return (
              <div key={ann._id} className={`border-l-4 ${s.border} pl-4 py-1`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge}`}>{ann.priority}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{relativeTime(ann.createdAt)}</span>
                  {ann.postedBy?.name && <span className="text-xs text-gray-400 dark:text-gray-500">· {ann.postedBy.name}</span>}
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{ann.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{ann.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Announcements() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdminOrHr = ['admin', 'hr'].includes(user?.role);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [modal, setModal]                 = useState(null); // null | 'new' | announcement object
  const [viewAll, setViewAll]             = useState(false);
  const [deleting, setDeleting]           = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements/all');
      setAnnouncements(res.data.announcements || []);
    } catch { toast('Failed to load announcements', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement permanently?')) return;
    setDeleting(id);
    try {
      await api.delete(`/announcements/${id}`);
      toast('Announcement deleted', 'success');
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch { toast('Delete failed', 'error'); }
    finally { setDeleting(null); }
  };

  const handleToggleActive = async (ann) => {
    try {
      await api.patch(`/announcements/${ann._id}`, { isActive: !ann.isActive });
      toast(`Announcement ${ann.isActive ? 'deactivated' : 'activated'}`, 'success');
      fetchAll();
    } catch { toast('Update failed', 'error'); }
  };

  const activeAnnouncements = announcements.filter(a => a.isActive &&
    (!a.expiresAt || new Date(a.expiresAt) > new Date()));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Breadcrumb crumbs={[{ label: 'Announcements' }]} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isAdminOrHr ? 'Manage company-wide announcements' : 'Latest updates from HR'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewAll(true)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            View active ({activeAnnouncements.length})
          </button>
          {isAdminOrHr && (
            <button
              onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No announcements yet</p>
            {isAdminOrHr && <button onClick={() => setModal('new')} className="mt-2 text-sm text-indigo-500 hover:text-indigo-600 font-medium">Post the first one →</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02]">
                  {['Title', 'Priority', 'Posted by', 'Posted', 'Expires', 'Status', ...(isAdminOrHr ? ['Actions'] : [])].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {announcements.map(ann => {
                  const s = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.normal;
                  const isExpired = ann.expiresAt && new Date(ann.expiresAt) <= new Date();
                  return (
                    <tr key={ann._id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{ann.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs mt-0.5">{ann.body.slice(0, 80)}{ann.body.length > 80 ? '…' : ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
                          {ann.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {ann.postedBy?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs">
                        {relativeTime(ann.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                        {ann.expiresAt
                          ? <span className={isExpired ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}>
                              {isExpired ? 'Expired · ' : ''}{new Date(ann.expiresAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                            </span>
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          ann.isActive && !isExpired
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ann.isActive && !isExpired ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                          {ann.isActive && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                        </span>
                      </td>
                      {isAdminOrHr && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setModal(ann)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(ann)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                ann.isActive
                                  ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                  : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                              }`}
                              title={ann.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {ann.isActive
                                ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64A9 9 0 015.64 19.36M6.34 6.34A9 9 0 0019.66 17.66M1 1l22 22"/></svg>
                                : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                            <button
                              onClick={() => handleDelete(ann._id)}
                              disabled={deleting === ann._id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <AnnouncementModal
          existing={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAll(); toast(modal === 'new' ? 'Announcement posted!' : 'Updated!', 'success'); }}
        />
      )}
      {viewAll && (
        <ViewAllModal announcements={activeAnnouncements} onClose={() => setViewAll(false)} />
      )}
    </div>
  );
}
