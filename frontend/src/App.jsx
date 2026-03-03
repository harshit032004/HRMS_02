import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import LeaveApprovals from './pages/LeaveApprovals';
import Settings from './pages/Settings';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function ManagerRoute({ children }) {
  const { user, isManager } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isManager()) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      } />
      <Route path="/attendance" element={
        <ProtectedLayout><Attendance /></ProtectedLayout>
      } />
      <Route path="/employees" element={
        <ProtectedLayout>
          <ManagerRoute><Employees /></ManagerRoute>
        </ProtectedLayout>
      } />
      <Route path="/leaves" element={
        <ProtectedLayout><Leaves /></ProtectedLayout>
      } />
      <Route path="/leave-approvals" element={
        <ProtectedLayout>
          <ManagerRoute><LeaveApprovals /></ManagerRoute>
        </ProtectedLayout>
      } />
      <Route path="/settings" element={
        <ProtectedLayout><Settings /></ProtectedLayout>
      } />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
