import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Stat card icons
const statIcons = {
  employees: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  pending:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  approved:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  rejected:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

function StatCard({ label, value, color, icon, iconBg }) {
  return (
    <div className="stat-card" style={{ borderLeft:`4px solid ${color}`, position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div className="stat-label">{label}</div>
        <div style={{ width:40,height:40,borderRadius:10,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',color,flexShrink:0 }}>
          {icon}
        </div>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}

function EmployeeListCard({ employees }) {
  const [showAdmins, setShowAdmins] = useState(false);
  const [animating, setAnimating]   = useState(false);
  const regularEmployees = employees.filter(e => e.role === 'employee' || e.role === 'manager');
  const adminStaff       = employees.filter(e => e.role === 'admin' || e.role === 'hr');
  const visibleList      = showAdmins ? adminStaff : regularEmployees.slice(0, 3);
  const label            = showAdmins ? 'Admin & HR Staff' : 'Employees';
  const sublabel         = showAdmins ? `${adminStaff.length} admin/HR accounts` : `Showing ${Math.min(3, regularEmployees.length)} of ${regularEmployees.length}`;

  const handleToggle = () => {
    setAnimating(true);
    setTimeout(() => { setShowAdmins(prev=>!prev); setAnimating(false); }, 220);
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2 className="card-title">Employee List</h2>
          <p className="card-subtitle" style={{ transition:'all 0.3s' }}>{sublabel}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:showAdmins?'#9ca3af':'#4f46e5', fontWeight:600 }}>Employees</span>
          <div onClick={handleToggle} style={{ width:46,height:24,borderRadius:12,cursor:'pointer',background:showAdmins?'#4f46e5':'#e5e7eb',position:'relative',transition:'background 0.3s',flexShrink:0 }}>
            <div style={{ width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:3,left:showAdmins?25:3,transition:'left 0.3s cubic-bezier(0.4,0,0.2,1)',boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
          </div>
          <span style={{ fontSize:12, color:showAdmins?'#4f46e5':'#9ca3af', fontWeight:600 }}>Admin/HR</span>
        </div>
      </div>

      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12,padding:'6px 12px',borderRadius:6,background:showAdmins?'rgba(99,102,241,0.08)':'rgba(16,185,129,0.08)',transition:'background 0.3s' }}>
        <div style={{ width:8,height:8,borderRadius:'50%',background:showAdmins?'#4f46e5':'#10b981',transition:'background 0.3s' }}/>
        <span style={{ fontSize:12,fontWeight:600,color:showAdmins?'#4f46e5':'#065f46' }}>Viewing: {label}</span>
      </div>

      <div style={{ opacity:animating?0:1, transform:animating?'translateY(8px)':'translateY(0)', transition:'opacity 0.22s ease,transform 0.22s ease' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left',padding:'10px 12px',fontSize:12,color:'#9ca3af',fontWeight:500,borderBottom:'1px solid #f3f4f6' }}>Name</th>
              <th style={{ textAlign:'left',padding:'10px 12px',fontSize:12,color:'#9ca3af',fontWeight:500,borderBottom:'1px solid #f3f4f6' }}>Department</th>
              <th style={{ textAlign:'left',padding:'10px 12px',fontSize:12,color:'#9ca3af',fontWeight:500,borderBottom:'1px solid #f3f4f6' }}>Role</th>
              <th style={{ textAlign:'left',padding:'10px 12px',fontSize:12,color:'#9ca3af',fontWeight:500,borderBottom:'1px solid #f3f4f6' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleList.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign:'center',padding:'32px 16px',color:'#9ca3af',fontSize:13 }}>No {label.toLowerCase()} found.</td></tr>
            ) : (
              visibleList.map((emp, i) => (
                <tr key={emp._id} style={{ borderBottom:i<visibleList.length-1?'1px solid #f9fafb':'none', animation:`fadeSlideIn 0.3s ease ${i*0.06}s both` }}>
                  <td style={{ padding:'12px 12px' }}>
                    <div style={{ fontWeight:600,fontSize:14,color:'#111827' }}>{emp.name || emp.email?.split('@')[0] || '—'}</div>
                    <div style={{ fontSize:11,color:'#9ca3af' }}>{emp.email}</div>
                  </td>
                  <td style={{ fontSize:13,color:'#374151',padding:'12px 12px' }}>{emp.department || '—'}</td>
                  <td style={{ fontSize:13,color:'#374151',padding:'12px 12px',textTransform:'capitalize' }}>{emp.role}</td>
                  <td style={{ padding:'12px 12px' }}>
                    <span style={{ display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:500,background:emp.isActive?'#d1fae5':'#fee2e2',color:emp.isActive?'#065f46':'#991b1b' }}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!showAdmins && regularEmployees.length > 3 && (
          <div style={{ textAlign:'center',padding:'12px 0 4px',fontSize:12,color:'#9ca3af' }}>
            + {regularEmployees.length - 3} more · Go to <strong>Employees</strong> page to view all
          </div>
        )}
      </div>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

export default function Dashboard() {
  const { user, isManager }   = useAuth();
  const [stats, setStats]     = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setError('');
      const endpoint = isManager() ? '/dashboard/admin' : '/dashboard/employee';
      const res = await api.get(endpoint);
      setStats(res.data.stats);
      setRecentLeaves(res.data.recentLeaves || []);
      setEmployees(res.data.employees || []);
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  if (isManager()) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">HR Dashboard</h1>
          <p style={{ color:'#6b7280',marginTop:4 }}>Welcome back, {user?.name}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stat Cards with icons + colored left borders */}
        <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
          <StatCard label="Total Employees" value={stats?.totalEmployees ?? 0} color="#6366f1" icon={statIcons.employees} iconBg="rgba(99,102,241,0.1)"/>
          <StatCard label="Pending Leaves"  value={stats?.pendingLeaves  ?? 0} color="#f59e0b" icon={statIcons.pending}   iconBg="rgba(245,158,11,0.1)"/>
          <StatCard label="Approved Leaves" value={stats?.approvedLeaves ?? 0} color="#10b981" icon={statIcons.approved}  iconBg="rgba(16,185,129,0.1)"/>
          <StatCard label="Rejected Leaves" value={stats?.rejectedLeaves ?? 0} color="#ef4444" icon={statIcons.rejected}  iconBg="rgba(239,68,68,0.1)"/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:24 }}>
          {/* Pending Leave Requests */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Pending Requests</h2>
              <p className="card-subtitle">Requires your action</p>
            </div>
            {recentLeaves.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>🎉</div>
                <p style={{ fontWeight:600,color:'#374151',marginBottom:4 }}>All caught up!</p>
                <p style={{ fontSize:13,color:'#9ca3af' }}>No pending leave requests at the moment.</p>
              </div>
            ) : (
              recentLeaves.map((leave) => (
                <div key={leave._id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f3f4f6' }}>
                  <div>
                    <p style={{ fontWeight:600,fontSize:14 }}>{leave.employee?.name || leave.employee?.email?.split('@')[0] || 'Unknown Employee'}</p>
                    <p style={{ fontSize:12,color:'#6b7280' }}>{leave.startDate} → {leave.endDate} ({leave.totalDays}d)</p>
                    <p style={{ fontSize:12,color:'#9ca3af' }}>{leave.reason}</p>
                  </div>
                  <span className="badge badge-pending">Pending</span>
                </div>
              ))
            )}
          </div>

          <EmployeeListCard employees={employees}/>
        </div>
      </div>
    );
  }

  // Employee Dashboard
  const statusColor = { 'checked-in':'#10b981','checked-out':'#6366f1','not-checked-in':'#ef4444' };
  const statusLabel = { 'checked-in':'Checked In','checked-out':'Checked Out','not-checked-in':'Not Checked In' };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name} 👋</h1>
        <p style={{ color:'#6b7280',marginTop:4 }}>{user?.jobTitle} · {user?.department}</p>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="Today's Status" value={statusLabel[stats?.todayStatus] || 'Unknown'} color={statusColor[stats?.todayStatus] || '#374151'} icon={statIcons.pending} iconBg="rgba(99,102,241,0.1)"/>
        <StatCard label="Pending Leaves"  value={stats?.pendingLeaves  ?? 0} color="#f59e0b" icon={statIcons.pending}  iconBg="rgba(245,158,11,0.1)"/>
        <StatCard label="Approved Leaves" value={stats?.approvedLeaves ?? 0} color="#10b981" icon={statIcons.approved} iconBg="rgba(16,185,129,0.1)"/>
      </div>
      {recentLeaves.length > 0 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">Recent Leave Requests</h2></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Duration</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td style={{ fontSize:13 }}>{leave.startDate} → {leave.endDate}</td>
                    <td style={{ fontSize:13,textTransform:'capitalize' }}>{leave.leaveType || 'casual'}</td>
                    <td style={{ fontSize:13 }}>{leave.reason}</td>
                    <td><span className={`badge badge-${leave.status}`}>{leave.status.charAt(0).toUpperCase()+leave.status.slice(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
