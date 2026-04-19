import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    // 1. Check localStorage first (persistent state)
    const stored = localStorage.getItem('hrms-theme');
    if (stored !== null) return stored === 'dark';

    // 2. Fall back to OS/system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply / remove 'dark' class on root element whenever darkMode changes
  useEffect(() => {
    const root = document.getElementById('root');
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('hrms-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Listen for OS theme changes (only if user hasn't manually set a preference)
  useEffect(() => {
    const stored = localStorage.getItem('hrms-theme');
    if (stored !== null) return; // user already chose manually

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
