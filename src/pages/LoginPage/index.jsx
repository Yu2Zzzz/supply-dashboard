// src/pages/LoginPage.jsx
import React, { memo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

const danmakuLines = [
  'Aluminium Garden Furniture',
  'Rope Garden Furniture',
  'Fabric Garden Furniture',
  'Rattan Garden Furniture',
  'Sun Lounger',
  'Dining Table'
];

const LoginPage = memo(() => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at 15% 20%, rgba(255,153,51,0.12), transparent 32%), radial-gradient(circle at 85% 10%, rgba(0,0,0,0.06), transparent 28%), linear-gradient(140deg, #f7f3eb 0%, #f1eadf 55%, #f7f3eb 100%)', 
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
      color: '#1f2937'
    }}>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes float-up {
          0% { opacity: 0; transform: translateY(24px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: '-10%',
        background: 'radial-gradient(circle at 25% 60%, rgba(249,115,22,0.12), transparent 42%), radial-gradient(circle at 80% 35%, rgba(0,0,0,0.08), transparent 32%)',
        filter: 'blur(50px)',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {Array.from({ length: 12 }).map((_, index) => {
          const line = danmakuLines[index % danmakuLines.length];
          return (
          <div
            key={line + index}
            style={{
              position: 'absolute',
              top: `${(index * 8.5) % 100}%`,
              left: 0,
              width: '400%',
              whiteSpace: 'nowrap',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '6px',
              textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.08)',
              animation: `scroll-left ${18 + index * 3}s linear infinite`,
              animationDelay: `-${index * 3}s`
            }}
          >
            {`${line}   `.repeat(12)}
          </div>
        );
        })}
      </div>

      <div style={{ 
        width: '100%', 
        maxWidth: '440px', 
        background: 'linear-gradient(140deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78))', 
        backdropFilter: 'blur(12px)',
        borderRadius: '28px', 
        padding: '48px', 
        boxShadow: '0 30px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(0,0,0,0.05)',
        opacity: 0,
        animation: 'float-up 0.8s ease forwards',
        animationDelay: '0.1s'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo.png" 
            alt="BHR Logo" 
            style={{ 
              width: '104px', 
              height: '104px', 
              objectFit: 'contain', 
              filter: 'brightness(0) saturate(100%)',
              marginBottom: '22px',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto'
            }} 
          />
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '1px' }}>百汇供应链管理系统</h1>
          <p style={{ fontSize: '15px', color: '#475569', marginTop: '10px', fontWeight: 500 }}>请登录您的账号</p>
        </div>

        {error && (
          <div style={{ 
            padding: '14px 18px', 
            background: 'linear-gradient(135deg, rgba(248,113,113,0.18) 0%, rgba(220,38,38,0.15) 100%)', 
            border: '1px solid rgba(248,113,113,0.4)', 
            borderRadius: '12px', 
            marginBottom: '24px', 
            color: '#b91c1c', 
            fontSize: '14px',
            fontWeight: 600,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1f2937', marginBottom: '10px', letterSpacing: '0.3px' }}>用户名</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="请输入用户名" 
              required
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                fontSize: '15px', 
                border: '1px solid rgba(0,0,0,0.08)', 
                borderRadius: '12px', 
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s',
                fontWeight: 600,
                background: '#f9fafb',
                color: '#0f172a',
                boxShadow: '0 10px 24px rgba(0,0,0,0.08)'
              }} 
              onFocus={(e) => e.target.style.borderColor = '#f97316'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
            />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1f2937', marginBottom: '10px', letterSpacing: '0.3px' }}>密码</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="请输入密码" 
              required
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                fontSize: '15px', 
                border: '1px solid rgba(0,0,0,0.08)', 
                borderRadius: '12px', 
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s',
                fontWeight: 600,
                background: '#f9fafb',
                color: '#0f172a',
                boxShadow: '0 10px 24px rgba(0,0,0,0.08)'
              }} 
              onFocus={(e) => e.target.style.borderColor = '#f97316'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '16px', 
              fontWeight: 800, 
              color: '#111827', 
              background: loading ? '#e2e8f0' : 'linear-gradient(140deg, #f97316 0%, #fb923c 100%)', 
              border: 'none', 
              borderRadius: '14px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 15px 35px rgba(249, 115, 22, 0.35)',
              transition: 'all 0.25s',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)', 
          borderRadius: '14px', 
          fontSize: '13px', 
          color: '#334155',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <div style={{ fontWeight: 800, marginBottom: '12px', color: '#0f172a', fontSize: '14px', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
            测试账号
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 600 }}>
            <div>👨‍💼 管理员: admin / admin123</div>
            <div>💼 业务员: sales / sales123</div>
            <div>📦 采购员: purchaser / purchaser123</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LoginPage;
