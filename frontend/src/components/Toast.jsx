import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration || 3500);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onRemove]);

  const c = {
    success:{ bg:'#d1fae5', border:'#6ee7b7', color:'#065f46', icon:'✓' },
    error:  { bg:'#fee2e2', border:'#fca5a5', color:'#991b1b', icon:'✕' },
    info:   { bg:'#dbeafe', border:'#93c5fd', color:'#1e40af', icon:'ℹ' },
    warning:{ bg:'#fef3c7', border:'#fcd34d', color:'#92400e', icon:'⚠' },
  }[toast.type] || { bg:'#dbeafe', border:'#93c5fd', color:'#1e40af', icon:'ℹ' };

  return (
    <div style={{ display:'flex',alignItems:'flex-start',gap:10,background:c.bg,border:`1px solid ${c.border}`,color:c.color,borderRadius:10,padding:'12px 16px',minWidth:280,maxWidth:380,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',animation:'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ width:22,height:22,borderRadius:'50%',background:c.color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0,marginTop:1 }}>{c.icon}</div>
      <span style={{ fontSize:14,fontWeight:500,flex:1,lineHeight:1.5 }}>{toast.message}</span>
      <button onClick={()=>onRemove(toast.id)} style={{ background:'none',border:'none',cursor:'pointer',color:c.color,fontSize:18,padding:'0 2px',lineHeight:1,opacity:0.6,flexShrink:0 }}>×</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => setToasts(prev=>prev.filter(t=>t.id!==id)), []);

  const showToast = useCallback((message, type='info', duration=3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev=>[...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  const toast = useCallback((msg,type,dur)=>showToast(msg,type,dur),[showToast]);
  toast.success = (msg,dur)=>showToast(msg,'success',dur);
  toast.error   = (msg,dur)=>showToast(msg,'error',dur);
  toast.info    = (msg,dur)=>showToast(msg,'info',dur);
  toast.warning = (msg,dur)=>showToast(msg,'warning',dur);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position:'fixed',top:20,right:20,display:'flex',flexDirection:'column',gap:10,zIndex:9999,pointerEvents:'none' }}>
        {toasts.map(t=>(
          <div key={t.id} style={{ pointerEvents:'auto' }}><ToastItem toast={t} onRemove={remove}/></div>
        ))}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(40px) scale(0.92)}to{opacity:1;transform:translateX(0) scale(1)}}`}</style>
    </ToastContext.Provider>
  );
}
