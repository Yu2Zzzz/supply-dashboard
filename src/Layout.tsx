// frontend/src/components/Layout/Layout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuConfig = [
  { key: 'dashboard', label: '仪表板', icon: '📊', path: '/', roles: ['admin', 'sales', 'purchaser'] },
  { key: 'sales-orders', label: '业务订单', icon: '📋', path: '/sales-orders', roles: ['admin', 'sales'] },
  { key: 'products', label: '产品管理', icon: '📦', path: '/products', roles: ['admin', 'purchaser'] },
  { key: 'materials', label: '物料管理', icon: '🔧', path: '/materials', roles: ['admin', 'purchaser'] },
  { key: 'purchase-orders', label: '采购订单', icon: '🛒', path: '/purchase-orders', roles: ['admin', 'purchaser'] },
  { key: 'suppliers', label: '供应商管理', icon: '🏭', path: '/suppliers', roles: ['admin', 'purchaser'] },
  { key: 'warehouses', label: '仓库管理', icon: '🏠', path: '/warehouses', roles: ['admin', 'purchaser'] },
  { key: 'warnings', label: '库存预警', icon: '⚠️', path: '/warnings', roles: ['admin', 'sales', 'purchaser'] },
  { key: 'users', label: '用户管理', icon: '👥', path: '/users', roles: ['admin'] },
];

const Layout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const visibleMenus = menuConfig.filter(item => hasRole(item.roles));

  const getRoleName = (role: string) => ({ admin: '管理员', sales: '业务员', purchaser: '采购员' }[role] || role);
  const getRoleColor = (role: string) => ({ admin: '#ef4444', sales: '#3b82f6', purchaser: '#10b981' }[role] || '#64748b');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside style={{ width: collapsed ? '72px' : '240px', background: '#0f172a', transition: 'width 0.3s', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📦</div>
          {!collapsed && <div><div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>供应链管理</div><div style={{ fontSize: '11px', color: '#64748b' }}>Control Center</div></div>}
        </div>
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {visibleMenus.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <div key={item.key} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '12px' : '12px 16px', marginBottom: '4px', borderRadius: '8px', cursor: 'pointer', background: isActive ? '#3b82f6' : 'transparent', color: isActive ? '#fff' : '#94a3b8', transition: 'all 0.2s', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#1e293b', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', background: '#334155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>{user?.realName?.[0] || user?.username?.[0] || 'U'}</div>
            {!collapsed && <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.realName || user?.username}</div><div style={{ fontSize: '11px', color: getRoleColor(user?.role || ''), fontWeight: 500 }}>{getRoleName(user?.role || '')}</div></div>}
          </div>
          <button onClick={logout} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🚪 {!collapsed && '退出登录'}</button>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', background: '#3b82f6', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{collapsed ? '→' : '←'}</button>
      </aside>
      <main style={{ flex: 1, marginLeft: collapsed ? '72px' : '240px', transition: 'margin-left 0.3s', minHeight: '100vh' }}>
        <header style={{ height: '64px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{visibleMenus.find(m => location.pathname === m.path || (m.path !== '/' && location.pathname.startsWith(m.path)))?.label || '仪表板'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>系统正常</span></div>
        </header>
        <div style={{ padding: '24px' }}><Outlet /></div>
      </main>
    </div>
  );
};

export default Layout;
