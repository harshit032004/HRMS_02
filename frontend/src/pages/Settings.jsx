import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all";

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
    {children}
  </div>
);

const Alert = ({ text, type }) => (
  <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium ${type === 'error' ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
    {type === 'error'
      ? <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 5a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 9a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 16z" clipRule="evenodd"/></svg>
      : <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
    {text}
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', department: user?.department || '', jobTitle: user?.jobTitle || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      await api.put(`/employees/${user?.id}`, profileForm);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) { setProfileMsg({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' }); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ text: 'New passwords do not match', type: 'error' }); return; }
    if (pwForm.newPassword.length < 6) { setPwMsg({ text: 'Password must be at least 6 characters', type: 'error' }); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg({ text: 'Password changed successfully!', type: 'success' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPwMsg({ text: err.response?.data?.message || 'Failed to change password', type: 'error' }); }
    finally { setPwLoading(false); }
  };

  const infoItems = [
    { label: 'Employee ID', value: user?.employeeId || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your profile and account preferences</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Your Profile'}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{user?.role} · {user?.department || 'No department set'}</p>
            </div>
          </div>

          {/* Readonly info */}
          <div className="px-6 py-4 border-b border-gray-50 dark:border-white/[0.04]">
            <div className="grid grid-cols-3 gap-4">
              {infoItems.map(item => (
                <div key={item.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{item.label}</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5 truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="p-6 space-y-4">
            {profileMsg && <Alert {...profileMsg} />}

            <InputField label="Full Name">
              <input className={inputCls} value={profileForm.name}
                onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
            </InputField>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Department">
                <input className={inputCls} placeholder="e.g. Engineering" value={profileForm.department}
                  onChange={e => setProfileForm({...profileForm, department: e.target.value})} />
              </InputField>
              <InputField label="Job Title">
                <input className={inputCls} placeholder="e.g. Engineer" value={profileForm.jobTitle}
                  onChange={e => setProfileForm({...profileForm, jobTitle: e.target.value})} />
              </InputField>
            </div>

            <div className="pt-1">
              <button type="submit" disabled={profileLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-md shadow-indigo-600/20">
                {profileLoading
                  ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
                  : <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Save Changes
                  </>}
              </button>
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Keep your account secure</p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            {pwMsg && <Alert {...pwMsg} />}

            <InputField label="Current Password">
              <input type="password" className={inputCls} value={pwForm.currentPassword}
                onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} required />
            </InputField>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="New Password">
                <input type="password" className={inputCls} placeholder="Min. 6 characters" value={pwForm.newPassword}
                  onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} required />
              </InputField>
              <InputField label="Confirm Password">
                <input type="password" className={inputCls} placeholder="Repeat new password" value={pwForm.confirmPassword}
                  onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} required />
              </InputField>
            </div>

            <div className="pt-1">
              <button type="submit" disabled={pwLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white dark:hover:bg-gray-100 hover:bg-gray-800 text-white dark:text-gray-900 text-sm font-semibold transition-all disabled:opacity-60">
                {pwLoading
                  ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Updating…</>
                  : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
