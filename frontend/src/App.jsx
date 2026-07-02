import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CommandPaletteProvider, useCommandPalette } from './context/CommandPaletteContext';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import Leaves from './pages/Leaves';
import LeaveApprovals from './pages/LeaveApprovals';
import Settings from './pages/Settings';
import Jobs from './pages/Jobs';
import Candidates from './pages/Candidates';
import Goals from './pages/Goals';
import Feedback from './pages/Feedback';
import Reviews from './pages/Reviews';
// import Announcements from './pages/Announcements'; // Announcements module hidden
import Payroll from './pages/Payroll';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const { darkMode } = useTheme();
  const { setOpen } = useCommandPalette();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:'0.1s'}}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay:'0.2s'}}></div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Sidebar />
      <main className="flex-1 ml-64 bg-gray-50 dark:bg-[#0a0e1a] min-h-screen transition-colors duration-300">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}

function ManagerRoute({ children }) {
  const { user, isManager } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isManager()) return <Navigate to="/dashboard" replace />;
  return children;
}

function HRRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/attendance" element={<ProtectedLayout><Attendance /></ProtectedLayout>} />
      <Route path="/employees" element={<ProtectedLayout><ManagerRoute><Employees /></ManagerRoute></ProtectedLayout>} />
      <Route path="/employees/:id" element={<ProtectedLayout><ManagerRoute><EmployeeProfile /></ManagerRoute></ProtectedLayout>} />
      <Route path="/leaves" element={<ProtectedLayout><Leaves /></ProtectedLayout>} />
      <Route path="/leave-approvals" element={<ProtectedLayout><ManagerRoute><LeaveApprovals /></ManagerRoute></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="/jobs" element={<ProtectedLayout><Jobs /></ProtectedLayout>} />
      <Route path="/candidates" element={<ProtectedLayout><HRRoute><Candidates /></HRRoute></ProtectedLayout>} />
      {/* Performance Management */}
      <Route path="/goals" element={<ProtectedLayout><Goals /></ProtectedLayout>} />
      <Route path="/feedback" element={<ProtectedLayout><Feedback /></ProtectedLayout>} />
      <Route path="/reviews"       element={<ProtectedLayout><Reviews /></ProtectedLayout>} />
      {/* <Route path="/announcements" element={<ProtectedLayout><Announcements /></ProtectedLayout>} /> */}
      <Route path="/payroll"       element={<ProtectedLayout><Payroll /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <CommandPaletteProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CommandPaletteProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
