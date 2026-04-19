import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';

function EyeIcon({ open }) {
  return open
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

function PasswordInput({ value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <input className="form-input" type={show?'text':'password'} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ paddingRight:44 }}/>
      <button type="button" onClick={()=>setShow(v=>!v)}
        style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:2,color:'#9ca3af',display:'flex',alignItems:'center' }}>
        <EyeIcon open={show}/>
      </button>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { label:'Too short', color:'#ef4444', width:'20%' },
    { label:'Weak',      color:'#f59e0b', width:'40%' },
    { label:'Fair',      color:'#f59e0b', width:'60%' },
    { label:'Good',      color:'#10b981', width:'80%' },
    { label:'Strong',    color:'#059669', width:'100%' },
  ];
  const lvl = levels[Math.min(score, levels.length-1)];

  return (
    <div style={{ marginTop:6 }}>
      <div style={{ height:4,background:'#e5e7eb',borderRadius:2,overflow:'hidden' }}>
        <div style={{ height:'100%',width:lvl.width,background:lvl.color,borderRadius:2,transition:'width 0.3s,background 0.3s' }}/>
      </div>
      <span style={{ fontSize:11,color:lvl.color,marginTop:3,display:'block',fontWeight:500 }}>{lvl.label}</span>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const toast    = useToast();

  const [profileForm, setProfileForm] = useState({ name:user?.name||'', department:user?.department||'', jobTitle:user?.jobTitle||'' });
  const [pwForm,      setPwForm]      = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading,      setPwLoading]      = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault(); setProfileLoading(true);
    try {
      await api.put(`/employees/${user?.id}`, profileForm);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword:pwForm.currentPassword, newPassword:pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Settings</h1></div>

      <div style={{ maxWidth:600 }}>
        {/* Profile Info */}
        <div className="card" style={{ marginBottom:24 }}>
          <div className="settings-section">
            <h3 className="settings-title">Profile Information</h3>

            <div style={{ marginBottom:16,padding:'12px 16px',background:'#f9fafb',borderRadius:8 }}>
              <p style={{ fontSize:13,color:'#6b7280' }}>Employee ID: <strong style={{ color:'#374151' }}>{user?.employeeId}</strong></p>
              <p style={{ fontSize:13,color:'#6b7280',marginTop:4 }}>Email: <strong style={{ color:'#374151' }}>{user?.email}</strong></p>
              <p style={{ fontSize:13,color:'#6b7280',marginTop:4 }}>Role: <strong style={{ color:'#374151',textTransform:'capitalize' }}>{user?.role}</strong></p>
            </div>

            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={profileForm.name} onChange={e=>setProfileForm({...profileForm,name:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={profileForm.department} onChange={e=>setProfileForm({...profileForm,department:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" value={profileForm.jobTitle} onChange={e=>setProfileForm({...profileForm,jobTitle:e.target.value})}/>
              </div>
              <button className="btn btn-primary" type="submit" style={{ width:'auto',padding:'10px 24px' }} disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="settings-section">
            <h3 className="settings-title">Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <PasswordInput value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <PasswordInput value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} required/>
                <PasswordStrength password={pwForm.newPassword}/>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <PasswordInput value={pwForm.confirmPassword} onChange={e=>setPwForm({...pwForm,confirmPassword:e.target.value})} required/>
                {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                  <span style={{ fontSize:11,color:'#ef4444',marginTop:3,display:'block' }}>Passwords do not match</span>
                )}
              </div>
              <button className="btn btn-primary" type="submit" style={{ width:'auto',padding:'10px 24px' }} disabled={pwLoading}>
                {pwLoading ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
