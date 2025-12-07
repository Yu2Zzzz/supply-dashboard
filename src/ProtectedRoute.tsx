// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  permission?: string;
}

// 加载中组件
const LoadingScreen: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        margin: '0 auto 16px',
        border: '4px solid #e2e8f0',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: '#64748b', fontSize: '14px' }}>加载中...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

// 无权限页面
const UnauthorizedScreen: React.FC<{ requiredRoles?: string[] }> = ({ requiredRoles }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    padding: '24px'
  }}>
    <div style={{
      maxWidth: '400px',
      background: '#fff',
      borderRadius: '12px',
      padding: '48px',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        margin: '0 auto 24px',
        background: '#fef2f2',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px'
      }}>
        🚫
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
        无访问权限
      </h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
        抱歉，您没有访问此页面的权限。
        {requiredRoles && requiredRoles.length > 0 && (
          <span style={{ display: 'block', marginTop: '8px' }}>
            需要角色: {requiredRoles.map(r => ({
              admin: '管理员',
              sales: '业务员',
              purchaser: '采购员'
            }[r] || r)).join(' 或 ')}
          </span>
        )}
      </p>
      <button
        onClick={() => window.history.back()}
        style={{
          padding: '10px 24px',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        返回上一页
      </button>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  permission
}) => {
  const { isAuthenticated, isLoading, hasRole, canAccess } = useAuth();
  const location = useLocation();

  // 加载中
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 未登录 -> 跳转登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      return <UnauthorizedScreen requiredRoles={allowedRoles} />;
    }
  }

  // 检查具体权限
  if (permission) {
    if (!canAccess(permission)) {
      return <UnauthorizedScreen />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
