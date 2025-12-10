// src/pages/LoginPage.jsx
import React, { memo, useState } from 'react';
import { AlertCircle, Factory } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '40%',
        height: '40%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '35%',
        height: '35%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />

      <div style={{ 
        width: '100%', 
        maxWidth: '420px', 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        borderRadius: '24px', 
        padding: '48px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '72px', 
            height: '72px', 
            margin: '0 auto 20px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
          }}>
            <Factory size={36} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0 }}>供应链管理系统</h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>请登录您的账号</p>
        </div>

        {error && (
          <div style={{ 
            padding: '14px 18px', 
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
            border: '1px solid #fca5a5', 
            borderRadius: '12px', 
            marginBottom: '24px', 
            color: '#dc2626', 
            fontSize: '14px',
            fontWeight: 500,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>用户名</label>
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
                border: '2px solid #e2e8f0', 
                borderRadius: '12px', 
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s',
                fontWeight: 500
              }} 
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>密码</label>
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
                border: '2px solid #e2e8f0', 
                borderRadius: '12px', 
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s',
                fontWeight: 500
              }} 
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#fff', 
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
              border: 'none', 
              borderRadius: '12px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 10px 25px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s',
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: '12px', 
          fontSize: '13px', 
          color: '#64748b',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '12px', color: '#374151', fontSize: '14px' }}>🔐 测试账号</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 500 }}>
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