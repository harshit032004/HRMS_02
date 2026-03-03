import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Settings() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    jobTitle: user?.jobTitle || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setProfileLoading(true);
    try {
      await api.put(`/employees/${user?.id}`, profileForm);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwErr('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Profile Info */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="settings-section">
            <h3 className="settings-title">Profile Information</h3>

            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Employee ID: <strong style={{ color: '#374151' }}>{user?.employeeId}</strong></p>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Email: <strong style={{ color: '#374151' }}>{user?.email}</strong></p>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Role: <strong style={{ color: '#374151', textTransform: 'capitalize' }}>{user?.role}</strong></p>
            </div>

            {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
            {profileErr && <div className="alert alert-error">{profileErr}</div>}

            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input className="form-input" value={profileForm.jobTitle}
                  onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: 'auto', padding: '10px 24px' }} disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="settings-section">
            <h3 className="settings-title">Change Password</h3>

            {pwMsg && <div className="alert alert-success">{pwMsg}</div>}
            {pwErr && <div className="alert alert-error">{pwErr}</div>}

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: 'auto', padding: '10px 24px' }} disabled={pwLoading}>
                {pwLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
