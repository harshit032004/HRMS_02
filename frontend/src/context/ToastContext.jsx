import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// Individual toast item
function Toast({ id, message, type, onDismiss }) {
  const icons = {
    success: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 5a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 9a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 16z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 5a1 1 0 10-2 0v5a1 1 0 102 0V7zm-1 9a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 16z" clipRule="evenodd" />
      </svg>
    ),
  };

  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    error:   'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400',
    info:    'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
        animate-[slideIn_0.25s_ease-out] ${styles[type] || styles.info}`}
    >
      {icons[type] || icons.info}
      <span className="flex-1">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience aliases
  toast.success = (msg, dur) => toast(msg, 'success', dur);
  toast.error   = (msg, dur) => toast(msg, 'error', dur);
  toast.info    = (msg, dur) => toast(msg, 'info', dur);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast portal — fixed bottom-right */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-3rem)]">
          {toasts.map(t => (
            <Toast key={t.id} {...t} onDismiss={dismiss} />
          ))}
        </div>
      )}

      {/* Keyframe for slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(1rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}
