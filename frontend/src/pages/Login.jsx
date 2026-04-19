import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const tokens = {
  light:{ page:'#f0f2f5',card:'#ffffff',cardShadow:'0 4px 32px rgba(0,0,0,0.10)',cardBorder:'transparent',title:'#111827',subtitle:'#6b7280',label:'#374151',inputBg:'#f9fafb',inputBorder:'#e5e7eb',inputText:'#374151',divider:'#e5e7eb',dividerText:'#9ca3af',footer:'#9ca3af',errBg:'#fee2e2',errText:'#991b1b',errBorder:'#fca5a5',toggleBg:'#e2e8f0',toggleThumb:'#ffffff',websiteIcon:'#1a1a2e',eyeColor:'#9ca3af' },
  dark:{ page:'#0f172a',card:'#1e293b',cardShadow:'0 4px 32px rgba(0,0,0,0.50)',cardBorder:'#334155',title:'#f1f5f9',subtitle:'#94a3b8',label:'#cbd5e1',inputBg:'#0f172a',inputBorder:'#334155',inputText:'#e2e8f0',divider:'#334155',dividerText:'#64748b',footer:'#64748b',errBg:'rgba(239,68,68,0.12)',errText:'#f87171',errBorder:'rgba(239,68,68,0.3)',toggleBg:'#4f46e5',toggleThumb:'#ffffff',websiteIcon:'#334155',eyeColor:'#64748b' },
};

function LoginToggle({ darkMode, onToggle }) {
  const t = darkMode ? tokens.dark : tokens.light;
  return (
    <button onClick={onToggle} aria-label={darkMode?'Light mode':'Dark mode'}
      style={{ position:'fixed',top:20,right:24,background:'none',border:'none',cursor:'pointer',padding:4,borderRadius:999,zIndex:999,outline:'none' }}>
      <span style={{ position:'relative',display:'flex',alignItems:'center',width:54,height:28,borderRadius:999,background:t.toggleBg,transition:'background 0.4s ease' }}>
        <span style={{ position:'absolute',left:7,width:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',color:'#f59e0b',opacity:darkMode?0:1,transform:darkMode?'scale(0.5) rotate(90deg)':'scale(1) rotate(0deg)',transition:'opacity 0.3s,transform 0.4s',pointerEvents:'none' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </span>
        <span style={{ position:'absolute',right:7,width:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',color:'#c4b5fd',opacity:darkMode?1:0,transform:darkMode?'scale(1) rotate(0deg)':'scale(0.5) rotate(-90deg)',transition:'opacity 0.3s,transform 0.4s',pointerEvents:'none' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>
        </span>
        <span style={{ position:'absolute',left:3,width:22,height:22,borderRadius:'50%',background:t.toggleThumb,boxShadow:'0 1px 4px rgba(0,0,0,0.25)',transform:darkMode?'translateX(26px)':'translateX(0)',transition:'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}/>
      </span>
    </button>
  );
}

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const t = darkMode ? tokens.dark : tokens.light;
  const th = { transition:'background-color 0.35s ease,color 0.35s ease,border-color 0.35s ease' };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const inputStyle = { width:'100%',padding:'10px 14px',border:`1px solid ${t.inputBorder}`,borderRadius:8,fontSize:14,color:t.inputText,background:t.inputBg,outline:'none',boxSizing:'border-box',...th };

  return (
    <div style={{ minHeight:'100vh',background:t.page,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',...th }}>
      <LoginToggle darkMode={darkMode} onToggle={toggleDarkMode}/>

      <div style={{ background:t.card,borderRadius:16,padding:'40px',width:'100%',maxWidth:420,boxShadow:t.cardShadow,border:`1px solid ${t.cardBorder}`,...th }}>
        {/* Logo */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:6 }}>
          <div style={{ width:36,height:36,background:'#4f46e5',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:800,fontSize:16,flexShrink:0 }}>R</div>
          <h1 style={{ fontSize:24,fontWeight:700,color:t.title,margin:0,...th }}>Radian <span style={{ color:'#6366f1' }}>HRMS</span></h1>
        </div>
        <p style={{ textAlign:'center',color:t.subtitle,fontSize:14,marginBottom:28,...th }}>Enter your credentials to access your account</p>

        {error && <div style={{ padding:'12px 16px',borderRadius:8,marginBottom:16,background:t.errBg,color:t.errText,border:`1px solid ${t.errBorder}`,fontSize:14,...th }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block',fontSize:14,fontWeight:500,color:t.label,marginBottom:6,...th }}>Email</label>
            <input type="email" placeholder="admin@example.com" value={email} onChange={e=>setEmail(e.target.value)} required style={inputStyle}/>
          </div>

          {/* Password + show/hide eye */}
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block',fontSize:14,fontWeight:500,color:t.label,marginBottom:6,...th }}>Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPw?'text':'password'} placeholder="••••••••••" value={password} onChange={e=>setPassword(e.target.value)} required
                style={{ ...inputStyle, padding:'10px 44px 10px 14px' }}/>
              <button type="button" onClick={()=>setShowPw(v=>!v)}
                style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:2,color:t.eyeColor,display:'flex',alignItems:'center',transition:'color 0.2s' }}
                title={showPw?'Hide password':'Show password'}>
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Submit with spinner */}
          <button type="submit" disabled={loading}
            style={{ width:'100%',padding:'12px',background:'#4f46e5',color:'white',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',opacity:loading?0.8:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'background 0.2s,opacity 0.2s' }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.background='#4338ca'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#4f46e5'; }}>
            {loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation:'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign:'center',fontSize:13,color:t.footer,marginTop:16,...th }}>Don't have an account? Contact your administrator.</p>

        <div style={{ display:'flex',alignItems:'center',gap:12,margin:'24px 0 16px' }}>
          <div style={{ flex:1,height:1,background:t.divider,...th }}/><span style={{ fontSize:12,color:t.dividerText,...th }}>Follow Us</span><div style={{ flex:1,height:1,background:t.divider,...th }}/>
        </div>

        <div style={{ display:'flex',justifyContent:'center',gap:20 }}>
          <a href="https://www.instagram.com/radian.marketing/" target="_blank" rel="noopener noreferrer" title="Instagram" style={{ width:42,height:42,borderRadius:10,background:'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',textDecoration:'none',boxShadow:'0 2px 8px rgba(238,42,123,0.3)',transition:'transform 0.2s,box-shadow 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(238,42,123,0.4)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 8px rgba(238,42,123,0.3)';}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://www.linkedin.com/company/radian-marketing/" target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ width:42,height:42,borderRadius:10,background:'#0077b5',display:'flex',alignItems:'center',justifyContent:'center',color:'white',textDecoration:'none',boxShadow:'0 2px 8px rgba(0,119,181,0.3)',transition:'transform 0.2s,box-shadow 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,119,181,0.4)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,119,181,0.3)';}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="https://radianmarketing.com" target="_blank" rel="noopener noreferrer" title="Website" style={{ width:42,height:42,borderRadius:10,background:t.websiteIcon,display:'flex',alignItems:'center',justifyContent:'center',color:'white',textDecoration:'none',boxShadow:'0 2px 8px rgba(26,26,46,0.3)',transition:'transform 0.2s,box-shadow 0.2s,background 0.35s ease' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(26,26,46,0.4)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 8px rgba(26,26,46,0.3)';}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
          </a>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
