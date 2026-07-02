import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '../context/CommandPaletteContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  dashboard:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  attendance:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
  employees:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  leaves:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  approvals:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  jobs:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  candidates:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  goals:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  feedback:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  reviews:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  settings:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  person:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>,
  goal_item:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

// ── Static pages list ────────────────────────────────────────────────────────
const ALL_PAGES = [
  { id: 'dashboard',      label: 'Dashboard',       path: '/dashboard',      icon: Icon.dashboard,  subtitle: 'Overview & stats'         },
  { id: 'attendance',     label: 'Attendance',       path: '/attendance',     icon: Icon.attendance, subtitle: 'Track check-in / check-out'},
  { id: 'employees',      label: 'Employees',        path: '/employees',      icon: Icon.employees,  subtitle: 'Manage team members',  managerOnly: true },
  { id: 'leaves',         label: 'My Leaves',        path: '/leaves',         icon: Icon.leaves,     subtitle: 'Apply & track leave'      },
  { id: 'leave-approvals',label: 'Leave Approvals',  path: '/leave-approvals',icon: Icon.approvals,  subtitle: 'Review pending requests', managerOnly: true },
  { id: 'jobs',           label: 'Job Postings',     path: '/jobs',           icon: Icon.jobs,       subtitle: 'Open positions'           },
  { id: 'candidates',     label: 'Candidates',       path: '/candidates',     icon: Icon.candidates, subtitle: 'Recruitment pipeline',    managerOnly: true },
  { id: 'goals',          label: 'Goals',            path: '/goals',          icon: Icon.goals,      subtitle: 'OKRs & targets'           },
  { id: 'feedback',       label: 'Feedback',         path: '/feedback',       icon: Icon.feedback,   subtitle: 'Give & receive feedback'  },
  { id: 'reviews',       label: 'Reviews',       path: '/reviews',       icon: Icon.reviews,   subtitle: 'Performance reviews'   },
  // { id: 'announcements',label: 'Announcements', path: '/announcements', icon: Icon.feedback,  subtitle: 'Company-wide updates'  }, // Announcements module hidden
  { id: 'settings',     label: 'Settings',      path: '/settings',      icon: Icon.settings,  subtitle: 'Account & preferences' },
];

// ── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Highlight match ──────────────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ── Result Row ───────────────────────────────────────────────────────────────
function ResultRow({ icon, label, subtitle, query, isActive, onClick, onMouseEnter, accentColor = 'text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        isActive ? 'bg-gray-100 dark:bg-white/[0.07]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4 ${accentColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          <Highlight text={label} query={query} />
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            <Highlight text={subtitle} query={query} />
          </p>
        )}
      </div>
      {isActive && (
        <kbd className="flex-shrink-0 text-[10px] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 font-mono">↵</kbd>
      )}
    </button>
  );
}

// ── Group Header ─────────────────────────────────────────────────────────────
function GroupHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100 dark:border-white/[0.05] first:border-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-[10px] text-gray-300 dark:text-gray-600">{count}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { isManager } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debouncedQuery = useDebounce(query, 200);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Fetch employees
  useEffect(() => {
    if (!open) return;
    setLoadingEmp(true);
    api.get('/employees')
      .then(res => setEmployees(res.data.employees || res.data.data || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmp(false));
  }, [open]);

  // Fetch goals
  useEffect(() => {
    if (!open) return;
    setLoadingGoals(true);
    api.get('/goals')
      .then(res => setGoals(res.data.goals || res.data.data || []))
      .catch(() => setGoals([]))
      .finally(() => setLoadingGoals(false));
  }, [open]);

  // Filtered results
  const filteredPages = useMemo(() => {
    const pages = ALL_PAGES.filter(p => !p.managerOnly || isManager());
    if (!debouncedQuery) return pages;
    const q = debouncedQuery.toLowerCase();
    return pages.filter(p => p.label.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q));
  }, [debouncedQuery, isManager]);

  const filteredEmployees = useMemo(() => {
    if (!debouncedQuery) return employees.slice(0, 5);
    const q = debouncedQuery.toLowerCase();
    return employees
      .filter(e => e.name?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q) || e.jobTitle?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [debouncedQuery, employees]);

  const filteredGoals = useMemo(() => {
    if (!debouncedQuery) return goals.slice(0, 4);
    const q = debouncedQuery.toLowerCase();
    return goals
      .filter(g => g.title?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
      .slice(0, 4);
  }, [debouncedQuery, goals]);

  // Flat list of all results for keyboard navigation
  const allResults = useMemo(() => {
    const items = [];
    filteredPages.forEach(p => items.push({ type: 'page', data: p }));
    filteredEmployees.forEach(e => items.push({ type: 'employee', data: e }));
    filteredGoals.forEach(g => items.push({ type: 'goal', data: g }));
    return items;
  }, [filteredPages, filteredEmployees, filteredGoals]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0); }, [allResults.length, debouncedQuery]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = useCallback((item) => {
    setOpen(false);
    if (item.type === 'page') {
      navigate(item.data.path);
    } else if (item.type === 'employee') {
      navigate(`/employees/${item.data._id}`);
    } else if (item.type === 'goal') {
      navigate('/goals');
    }
  }, [navigate, setOpen]);

  // Keyboard handler inside modal
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[activeIndex]) {
      e.preventDefault();
      handleSelect(allResults[activeIndex]);
    }
  }, [allResults, activeIndex, handleSelect, setOpen]);

  if (!open) return null;

  // Build page results offset for index mapping
  const pageOffset = 0;
  const empOffset  = filteredPages.length;
  const goalOffset = filteredPages.length + filteredEmployees.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-[600px] bg-white dark:bg-[#0f1623] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.07]">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, employees, goals…"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-gray-300 dark:text-gray-600 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 font-mono flex-shrink-0">Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-[420px] py-1">

          {/* Empty state */}
          {allResults.length === 0 && debouncedQuery && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No results for "<span className="text-gray-700 dark:text-gray-200">{debouncedQuery}</span>"</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Default empty query hint */}
          {allResults.length === 0 && !debouncedQuery && !loadingEmp && !loadingGoals && (
            <div className="py-10 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">Start typing to search pages, employees, and goals</p>
            </div>
          )}

          {/* Pages group */}
          {filteredPages.length > 0 && (
            <>
              <GroupHeader label="Pages" count={filteredPages.length} />
              {filteredPages.map((page, i) => (
                <ResultRow
                  key={page.id}
                  icon={page.icon}
                  label={page.label}
                  subtitle={page.subtitle}
                  query={debouncedQuery}
                  isActive={activeIndex === pageOffset + i}
                  onClick={() => handleSelect({ type: 'page', data: page })}
                  onMouseEnter={() => setActiveIndex(pageOffset + i)}
                  accentColor="text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                  data-active={activeIndex === pageOffset + i}
                />
              ))}
            </>
          )}

          {/* Employees group */}
          {(filteredEmployees.length > 0 || loadingEmp) && (
            <>
              <GroupHeader label="Employees" count={loadingEmp ? '…' : filteredEmployees.length} />
              {loadingEmp ? (
                <div className="px-4 py-3 flex gap-1.5">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}
                </div>
              ) : filteredEmployees.map((emp, i) => (
                <div key={emp._id} data-active={activeIndex === empOffset + i}>
                  <ResultRow
                    icon={
                      <span className="w-full h-full flex items-center justify-center text-xs font-bold">
                        {emp.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    }
                    label={emp.name || 'Unknown'}
                    subtitle={[emp.jobTitle, emp.department].filter(Boolean).join(' · ')}
                    query={debouncedQuery}
                    isActive={activeIndex === empOffset + i}
                    onClick={() => handleSelect({ type: 'employee', data: emp })}
                    onMouseEnter={() => setActiveIndex(empOffset + i)}
                    accentColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                  />
                </div>
              ))}
            </>
          )}

          {/* Goals group */}
          {(filteredGoals.length > 0 || loadingGoals) && (
            <>
              <GroupHeader label="Goals" count={loadingGoals ? '…' : filteredGoals.length} />
              {loadingGoals ? (
                <div className="px-4 py-3 flex gap-1.5">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}
                </div>
              ) : filteredGoals.map((goal, i) => (
                <div key={goal._id} data-active={activeIndex === goalOffset + i}>
                  <ResultRow
                    icon={Icon.goal_item}
                    label={goal.title || 'Untitled Goal'}
                    subtitle={[
                      goal.assignedTo?.name ? `Assigned to ${goal.assignedTo.name}` : null,
                      goal.status ? goal.status.charAt(0).toUpperCase() + goal.status.slice(1) : null,
                    ].filter(Boolean).join(' · ')}
                    query={debouncedQuery}
                    isActive={activeIndex === goalOffset + i}
                    onClick={() => handleSelect({ type: 'goal', data: goal })}
                    onMouseEnter={() => setActiveIndex(goalOffset + i)}
                    accentColor="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-600">
            <kbd className="border border-gray-200 dark:border-white/10 rounded px-1 font-mono">↑</kbd>
            <kbd className="border border-gray-200 dark:border-white/10 rounded px-1 font-mono">↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-600">
            <kbd className="border border-gray-200 dark:border-white/10 rounded px-1 font-mono">↵</kbd>
            <span>open</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-600">
            <kbd className="border border-gray-200 dark:border-white/10 rounded px-1.5 font-mono">Esc</kbd>
            <span>close</span>
          </div>
          <div className="ml-auto text-[10px] text-gray-300 dark:text-gray-700 font-mono">⌘K</div>
        </div>
      </div>
    </div>
  );
}
