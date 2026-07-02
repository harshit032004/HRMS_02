import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// ── helpers ──────────────────────────────────────────────────────
const fmt = (d) => {
  const dt = new Date(d);
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function Avatar({ name, size = 7, color = 'indigo' }) {
  const colors = { indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400', emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' };
  const c = colors[color] || colors.indigo;
  return (
    <div className={`w-${size} h-${size} rounded-full ${c} flex items-center justify-center flex-shrink-0 font-semibold text-xs`}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

// ── Inbox (conversation list) ─────────────────────────────────────
function Inbox({ onSelect, onNew }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/chat')
      .then(r => setThreads(r.data.data || []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Messages</p>
        <button onClick={onNew}
          className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading
          ? <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">Loading…</div>
          : threads.length === 0
          ? <div className="p-6 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-xs text-gray-400 dark:text-gray-500">No conversations yet</p>
              <button onClick={onNew} className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors">Start a chat</button>
            </div>
          : threads.map(t => (
            <button key={t.thread} onClick={() => onSelect(t.otherUser)}
              className="w-full px-4 py-3 flex items-start gap-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-50 dark:border-white/[0.04] text-left">
              <Avatar name={t.otherUser?.name} color="emerald" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.otherUser?.name || '—'}</p>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-1">{fmtDate(t.lastAt)}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{t.lastMessage}</p>
              </div>
              {t.unread > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{t.unread}</span>
              )}
            </button>
          ))}
      </div>
    </div>
  );
}

// ── Contact picker (new chat) ─────────────────────────────────────
function NewChat({ onSelect, onBack }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/chat/hr-contacts')
      .then(r => setContacts(r.data.data || []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
        <button onClick={onBack} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">New Message</p>
      </div>
      <div className="px-3 pt-3 pb-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search HR / Admin…"
          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading
          ? <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">Loading contacts…</div>
          : filtered.length === 0
          ? <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">No HR contacts found</div>
          : filtered.map(c => (
            <button key={c._id} onClick={() => onSelect(c)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-50 dark:border-white/[0.04]">
              <Avatar name={c.name} color="indigo" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">{c.role}{c.department ? ` · ${c.department}` : ''}</p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

// ── Conversation thread ───────────────────────────────────────────
function Conversation({ receiver, onBack, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/chat/${receiver._id}`);
      setMessages(r.data.data || []);
    } catch { /* silent */ }
  }, [receiver._id]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 6000); // poll every 6s
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      await api.post('/chat', { receiverId: receiver._id, message: msg });
      setText('');
      await load();
    } catch { /* silent */ } finally { setSending(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  // Group messages by date
  let lastDate = null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
        <button onClick={onBack} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <Avatar name={receiver.name} color="emerald" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{receiver.name}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">{receiver.role}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-2xl mb-2">👋</div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Start the conversation</p>
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender._id === currentUser?.id || m.sender._id === currentUser?._id;
          const dateStr = fmtDate(m.createdAt);
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;
          return (
            <div key={m._id || i}>
              {showDate && (
                <div className="text-center my-2">
                  <span className="text-[10px] bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 rounded-full px-2 py-0.5">{dateStr}</span>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-snug ${isMe
                    ? 'bg-indigo-500 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-900 dark:text-gray-100 rounded-bl-sm'
                  }`}>
                    {m.message}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1">{fmt(m.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-white/[0.05] rounded-xl px-3 py-2 border border-gray-100 dark:border-white/[0.08]">
          <textarea
            rows={1}
            value={text}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'; }}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none leading-snug"
          />
          <button onClick={send} disabled={!text.trim() || sending}
            className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ── Main ChatWidget export ────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('inbox'); // 'inbox' | 'new' | 'conversation'
  const [activeReceiver, setActiveReceiver] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Poll unread count
  useEffect(() => {
    const poll = () => {
      api.get('/chat')
        .then(r => {
          const total = (r.data.data || []).reduce((s, t) => s + (t.unread || 0), 0);
          setUnreadTotal(total);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  const openConversation = (contact) => {
    setActiveReceiver(contact);
    setView('conversation');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all duration-200 hover:scale-105 z-50"
        title="HR Chat"
      >
        {open
          ? <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {unreadTotal > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadTotal > 9 ? '9+' : unreadTotal}</span>
              )}
            </>
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-[480px] rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.08] shadow-2xl shadow-black/20 flex flex-col overflow-hidden z-50 animate-in">
          {/* Panel header */}
          <div className="px-4 py-3 bg-indigo-600 dark:bg-indigo-700 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm font-semibold text-white flex-1">HR Chat</p>
            <p className="text-[11px] text-indigo-200">{user?.name}</p>
          </div>

          <div className="flex-1 overflow-hidden">
            {view === 'inbox' && (
              <Inbox onSelect={openConversation} onNew={() => setView('new')} />
            )}
            {view === 'new' && (
              <NewChat onSelect={openConversation} onBack={() => setView('inbox')} />
            )}
            {view === 'conversation' && activeReceiver && (
              <Conversation
                receiver={activeReceiver}
                currentUser={user}
                onBack={() => { setView('inbox'); setActiveReceiver(null); }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
