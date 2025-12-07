// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#fff',
        borderRadius: '16px',
        padding: '48px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px'
          }}>📦</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>供应链管理系统</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>请登录您的账号</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#dc2626',
            fontSize: '14px'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" style={inputStyle} required />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" style={inputStyle} required />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#fff',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>{loading ? '登录中...' : '登 录'}</button>
        </form>

        <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>测试账号：</div>
          <div>管理员: admin / admin123</div>
          <div>业务员: sales / sales123</div>
          <div>采购员: purchaser / purchaser123</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
