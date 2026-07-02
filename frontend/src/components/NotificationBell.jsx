import { useState, useEffect, useRef, useCallback } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import api from '../utils/api';

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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const TYPE_COLORS = {
  leave_request:    'bg-amber-400',
  leave_approved:   'bg-emerald-400',
  leave_rejected:   'bg-red-400',
  candidate:        'bg-blue-400',
  candidate_selected: 'bg-purple-500',
  goal_completed:   'bg-green-400',
  goal_assigned:    'bg-indigo-400',
  feedback:         'bg-pink-400',
  default:          'bg-gray-400',
};

function dotColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

const STORAGE_KEY = 'hrms_notif_read_at';

// ── Component ────────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const [items,      setItems]      = useState([]);
  const [open,       setOpen]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [readAt,     setReadAt]     = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Date(stored) : null;
  });

  const wrapperRef = useRef(null);
  useClickOutside(wrapperRef, () => setOpen(false));

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/activity');
      // activity feed returns { activities: [...] } or { data: [...] }
      const feed = res.data?.activities || res.data?.data || [];
      setItems(Array.isArray(feed) ? feed : []);
    } catch {
      // silently fail — bell is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Unread = items from last 24h that are newer than readAt timestamp
  const unread = items.filter(item => {
    const t = new Date(item.time);
    const isRecent = Date.now() - t.getTime() < 86400000; // 24h
    if (!isRecent) return false;
    if (!readAt) return true;
    return t > readAt;
  });

  const markAllRead = () => {
    const now = new Date();
    localStorage.setItem(STORAGE_KEY, now.toISOString());
    setReadAt(now);
  };

  const handleBellClick = () => {
    setOpen(prev => !prev);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-150"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-lg">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-11 w-80 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div>
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unread.length > 0 && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  {unread.length} new
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Mark all as read
            </button>
          </div>

          {/* Feed */}
          <div className="overflow-y-auto max-h-[360px] divide-y divide-white/[0.04] notif-scroll">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>
                  ))}
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-2xl mb-2">🔔</div>
                <p className="text-xs text-gray-500">No recent activity</p>
              </div>
            ) : (
              items.map((item, idx) => {
                const isUnread = readAt ? new Date(item.time) > readAt && Date.now() - new Date(item.time) < 86400000 : Date.now() - new Date(item.time) < 86400000;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${isUnread ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02]'}`}
                  >
                    {/* colored dot */}
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor(item.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${isUnread ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                        {item.message}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{relativeTime(item.time)}</p>
                    </div>
                    {isUnread && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
