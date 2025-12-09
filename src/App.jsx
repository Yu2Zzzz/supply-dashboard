import React, { useState, useMemo, useCallback, useEffect, createContext, useContext, memo, useRef } from 'react';
import { AlertCircle, Package, TrendingUp, TrendingDown, ChevronLeft, CheckCircle, AlertTriangle, XCircle, Clock, Factory, Users, Calendar, Box, Truck, AlertOctagon, Filter, ChevronRight, Layers, ShoppingCart, LogOut, User, Menu, X, Home, FileText, Settings, Warehouse, Building, UserPlus, Edit, Trash2, Plus, Save, Search, RefreshCw, Zap, Eye, Play, Send, Check, ArrowRight } from 'lucide-react';
// 在第2行添加这些
import { BASE_URL, RISK, PO_STATUS, SO_STATUS } from './config/constants';
import { debounce, formatDate, formatDateInput, createRiskCalculator, highestRisk, TODAY, daysDiff } from './utils/helpers';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApi } from './hooks/useApi';

// 导入页面组件
import LoginPage from './pages/LoginPage';
import SalesOrderPage from './pages/SalesOrderPage';
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import UserManagementPage from './pages/UserManagementPage';
import WarehouseManagementPage from './pages/WarehouseManagementPage';
import ProductManagementPage from './pages/ProductManagementPage';
import MaterialManagementPage from './pages/MaterialManagementPage';
// ============ API 配置 ============


// ============ 工具函数 ============

// ============ 认证上下文 ============

// ============ API 请求封装 ============

// ============ 登录页面 ============

// ============ 风险计算器 ============

// ============ UI 组件 ============
const Card = memo(({ children, style = {}, onClick, hover = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      style={{ 
        background: '#fff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '16px', 
        padding: '24px',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        transform: isHovered && onClick ? 'translateY(-2px)' : 'translateY(0)',
        ...style 
      }}
    >
      {children}
    </div>
  );
});

const StatusBadge = memo(({ level, size = 'md' }) => {
  const r = RISK[level] || RISK.pending;
  const Icon = r.icon;
  const styles = size === 'sm' 
    ? { padding: '5px 10px', fontSize: '11px', gap: 4, iconSize: 12 }
    : { padding: '7px 14px', fontSize: '13px', gap: 6, iconSize: 14 };
  
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: styles.gap,
      padding: styles.padding,
      fontSize: styles.fontSize,
      fontWeight: 600, 
      color: r.color, 
      backgroundColor: r.bgColor, 
      borderRadius: '50px',
      border: `1px solid ${r.color}30`,
    }}>
      <Icon size={styles.iconSize} />
      <span>{r.text}</span>
    </span>
  );
});

// 通用状态标签
const StatusTag = memo(({ status, statusMap }) => {
  const s = statusMap[status] || { color: '#64748b', bgColor: '#f1f5f9', text: status };
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      padding: '6px 14px',
      fontSize: '12px',
      fontWeight: 600, 
      color: s.color, 
      backgroundColor: s.bgColor, 
      borderRadius: '20px',
      border: `1px solid ${s.color}30`,
    }}>
      {s.text}
    </span>
  );
});

const MetricCard = memo(({ icon: Icon, label, value, sublabel, color = '#475569', trend }) => (
  <Card style={{ flex: 1, minWidth: '200px' }} hover={false}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ 
        padding: '10px', 
        background: `${color}10`, 
        borderRadius: '12px',
        boxShadow: `0 4px 12px ${color}20`
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      {trend && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontSize: '12px', 
          fontWeight: 600,
          color: trend > 0 ? '#10b981' : '#ef4444'
        }}>
          {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', lineHeight: 1 }}>{value}</div>
    {sublabel && <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{sublabel}</div>}
  </Card>
));

const Button = memo(({ children, onClick, variant = 'primary', icon: Icon, size = 'md', disabled = false, style = {}, loading = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const variants = {
    primary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
    danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none' },
    success: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none' },
    warning: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none' },
  };
  
  const sizes = {
    sm: { padding: '7px 14px', fontSize: '12px' },
    md: { padding: '11px 18px', fontSize: '14px' },
    lg: { padding: '13px 26px', fontSize: '16px' },
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px',
        fontWeight: 600,
        borderRadius: '10px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
        transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
        ...variants[variant],
        ...sizes[size],
        ...style
      }}
    >
      {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
});

const Input = memo(({ label, value, onChange, placeholder, type = 'text', required = false, disabled = false, style = {} }) => (
  <div style={{ marginBottom: '16px', ...style }}>
    {label && <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>}
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      disabled={disabled}
      style={{ 
        width: '100%', 
        padding: '11px 14px', 
        fontSize: '14px', 
        border: '2px solid #e2e8f0', 
        borderRadius: '10px', 
        outline: 'none', 
        boxSizing: 'border-box',
        transition: 'all 0.2s',
        background: disabled ? '#f8fafc' : '#fff'
      }}
      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
    />
  </div>
));

const Select = memo(({ label, value, onChange, options, required = false, disabled = false, style = {} }) => (
  <div style={{ marginBottom: '16px', ...style }}>
    {label && <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>}
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ 
        width: '100%', 
        padding: '11px 14px', 
        fontSize: '14px', 
        border: '2px solid #e2e8f0', 
        borderRadius: '10px', 
        outline: 'none', 
        boxSizing: 'border-box',
        background: disabled ? '#f8fafc' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      <option value="">请选择</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
));

const Modal = memo(({ isOpen, onClose, title, children, width = '500px' }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} style={{ color: '#64748b' }} /></button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
});

const EmptyState = memo(({ icon: Icon, title, description }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
    <div style={{ width: '80px', height: '80px', marginBottom: '20px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={40} style={{ color: '#94a3b8' }} />
    </div>
    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '300px' }}>{description}</div>
  </div>
));

const LoadingScreen = memo(() => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', margin: '0 auto 32px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
        <Factory size={40} style={{ color: '#fff' }} />
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>加载中</div>
      <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>正在获取数据...</div>
    </div>
  </div>
));

const ErrorScreen = memo(({ error, onRetry }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={40} style={{ color: '#ef4444' }} />
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>连接错误</div>
      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>{error}</div>
      <Button onClick={onRetry} variant="primary" icon={RefreshCw}>重新连接</Button>
    </Card>
  </div>
));

const TableRow = memo(({ children, onClick }) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <tr onClick={onClick} onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} style={{ backgroundColor: isHover ? '#f8fafc' : '#fff', cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.15s' }}>
      {children}
    </tr>
  );
});

// ============ 侧边栏 ============
const Sidebar = memo(({ currentPage, onNavigate, collapsed, onToggle }) => {
  const { user, logout, hasRole } = useAuth();

  const menuItems = [
    { key: 'dashboard', label: '仪表板', icon: Home, roles: ['admin', 'sales', 'purchaser'] },
    { key: 'orders', label: '业务订单', icon: FileText, roles: ['admin', 'sales'] },
    { key: 'products', label: '产品管理', icon: Package, roles: ['admin', 'purchaser'] },
    { key: 'materials', label: '物料管理', icon: Layers, roles: ['admin', 'purchaser'] },
    { key: 'suppliers', label: '供应商管理', icon: Building, roles: ['admin', 'purchaser'] },
    { key: 'warehouses', label: '仓库管理', icon: Warehouse, roles: ['admin', 'purchaser'] },
    { key: 'purchase-orders', label: '采购订单', icon: ShoppingCart, roles: ['admin', 'purchaser'] },
    { key: 'warnings', label: '库存预警', icon: AlertTriangle, roles: ['admin', 'purchaser'] },  // 业务员不需要看预警
    { key: 'users', label: '用户管理', icon: Users, roles: ['admin'] },
  ];

  const visibleItems = menuItems.filter(item => hasRole(item.roles));
  const getRoleName = (role) => ({ admin: '管理员', sales: '业务员', purchaser: '采购员' }[role] || role);
  const getRoleColor = (role) => ({ admin: '#ef4444', sales: '#3b82f6', purchaser: '#10b981' }[role] || '#64748b');

  return (
    <aside style={{
      width: collapsed ? '80px' : '280px',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s',
      zIndex: 100,
      boxShadow: '4px 0 24px rgba(0,0,0,0.12)'
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Factory size={22} style={{ color: '#fff' }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>供应链管理</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>CONTROL CENTER</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.key || currentPage.startsWith(item.key + '-');
          return (
            <div key={item.key} onClick={() => onNavigate(item.key)} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '14px' : '14px 18px', marginBottom: '6px', borderRadius: '12px', cursor: 'pointer',
              background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
              color: isActive ? '#fff' : '#94a3b8', transition: 'all 0.2s', justifyContent: collapsed ? 'center' : 'flex-start',
              boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}>
              <Icon size={20} />
              {!collapsed && <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '14px' }}>
          <div style={{ width: '40px', height: '40px', background: getRoleColor(user?.role), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={20} style={{ color: '#fff' }} />
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.realName || user?.username}</div>
              <div style={{ fontSize: '11px', color: getRoleColor(user?.role), fontWeight: 600 }}>{getRoleName(user?.role)}</div>
            </div>
          )}
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
          <LogOut size={16} />{!collapsed && '退出登录'}
        </button>
      </div>

      <button onClick={onToggle} style={{ position: 'absolute', right: '-16px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
});

// ============ Dashboard ============
const DashboardPage = memo(({ data, onNav }) => {
  const { orders = [], orderLines = [], products = [], bom = [], mats = [], suppliers = [], pos = [] } = data;
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  
  const orderData = useMemo(() => orders.map(order => {
    const lines = orderLines.filter(l => l.orderId === order.id);
    const matDemands = {};
    lines.forEach(line => {
      const prodBom = bom.filter(b => b.p === line.productCode);
      prodBom.forEach(b => { matDemands[b.m] = (matDemands[b.m] || 0) + b.c * line.qty; });
    });
    const risks = Object.entries(matDemands).map(([code, demand]) => calcRisk(code, demand, order.deliveryDate)).filter(Boolean);
    return { ...order, lines, risks, overallRisk: highestRisk(risks.map(r => r.level)) };
  }), [orders, orderLines, bom, calcRisk]);

  const stats = useMemo(() => ({
    total: orderData.length,
    atRisk: orderData.filter(o => RISK[o.overallRisk]?.priority >= 2).length,
    lowStock: mats.filter(m => m.inv < m.safe).length,
    inTransit: pos.filter(p => p.status === 'shipped').length
  }), [orderData, mats, pos]);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>仪表板</h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>供应链风险监控概览</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <MetricCard icon={ShoppingCart} label="活跃订单" value={stats.total} sublabel="需跟踪订单" color="#3b82f6" />
        <MetricCard icon={AlertTriangle} label="风险订单" value={stats.atRisk} sublabel={stats.atRisk > 0 ? '需要关注' : '全部正常'} color="#f59e0b" />
        <MetricCard icon={Box} label="库存预警" value={stats.lowStock} sublabel="低于安全库存" color="#ef4444" />
        <MetricCard icon={Truck} label="在途采购" value={stats.inTransit} sublabel="运输中" color="#10b981" />
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>订单风险概览</h2>
        </div>
        
        {orderData.length === 0 ? (
          <EmptyState icon={Package} title="暂无订单" description="当前没有活跃的订单" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>订单编号</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>客户</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>产品数</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>交付日期</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {orderData.map(order => (
                  <TableRow key={order.id} onClick={() => onNav('order-detail', order.id)}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.customer}</td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>{order.lines.length}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.deliveryDate}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}><StatusBadge level={order.overallRisk} size="sm" /></td>
                    <td style={{ padding: '16px' }}><ChevronRight size={16} style={{ color: '#94a3b8' }} /></td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
});

// ============ 订单详情页 ============
const OrderDetailPage = memo(({ id, data, onNav, onBack }) => {
  const { orders = [], orderLines = [], products = [], bom = [], mats = [], suppliers = [], pos = [] } = data;
  const order = orders.find(o => o.id === id);
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  
  if (!order) return <EmptyState icon={Package} title="订单不存在" description="未找到该订单" />;

  const lines = orderLines.filter(l => l.orderId === id);
  const productData = lines.map(line => {
    const prodBom = bom.filter(b => b.p === line.productCode);
    const matRisks = prodBom.map(b => {
      const risk = calcRisk(b.m, b.c * line.qty, order.deliveryDate);
      return risk ? { ...risk, bomQty: b.c } : null;
    }).filter(Boolean);
    return { ...line, matRisks, overallRisk: highestRisk(matRisks.map(r => r.level)) };
  });

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', marginBottom: '24px', padding: 0 }}>
        <ChevronLeft size={20} /> 返回
      </button>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>订单 {order.id}</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{order.customer}</p>
          </div>
          <StatusBadge level={highestRisk(productData.map(p => p.overallRisk))} />
        </div>
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>下单日期</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{order.orderDate}</div></div>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>交付日期</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{order.deliveryDate}</div></div>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>业务员</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{order.salesPerson}</div></div>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px 0' }}>产品清单</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {productData.map((prod, idx) => (
            <div key={idx} onClick={() => onNav('product-detail', prod.productCode)} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{prod.productName}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>数量: {prod.qty.toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <StatusBadge level={prod.overallRisk} size="sm" />
                  <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});

// ============ 产品详情页 ============
const ProductDetailPage = memo(({ code, data, onNav, onBack }) => {
  const { products = [], bom = [], mats = [], suppliers = [], pos = [] } = data;
  const product = products.find(p => p.code === code);
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  
  if (!product) return <EmptyState icon={Package} title="产品不存在" description="未找到该产品" />;

  const prodBom = bom.filter(b => b.p === code);
  const matRisks = prodBom.map(b => {
    const risk = calcRisk(b.m, b.c * 1000, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    return risk ? { ...risk, bomQty: b.c } : null;
  }).filter(Boolean);

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', marginBottom: '24px', padding: 0 }}>
        <ChevronLeft size={20} /> 返回
      </button>

      <Card style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{product.name}</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>产品编码: {product.code}</p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px 0' }}>BOM 物料清单</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>物料</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>单位用量</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>库存</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>在途</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {matRisks.map((mat, idx) => (
                <TableRow key={idx} onClick={() => onNav('material-detail', mat.code)}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{mat.name}</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>{mat.bomQty}</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: mat.inv < mat.safe ? '#dc2626' : '#374151' }}>{mat.inv.toLocaleString()}</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#374151' }}>{mat.transit.toLocaleString()}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}><StatusBadge level={mat.level} size="sm" /></td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});

// ============ 物料详情页 ============
// ============ 物料详情页 ============
const MaterialDetailPage = memo(({ code, data, onBack }) => {
  const { mats = [], suppliers = [] } = data;
  const mat = mats.find(m => m.code === code);
  const { token } = useAuth();

  const [poList, setPoList] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poError, setPoError] = useState('');

  // 从后端正式采购接口拉采购单，不再用 /api/data 里的 pos
  useEffect(() => {
    if (!token) return;

    const fetchPOs = async () => {
      try {
        setPoLoading(true);
        setPoError('');

        // 先简单拉一批再前端按物料过滤，避免依赖 materialId 是否在 mats 里
        const params = new URLSearchParams({
          page: '1',
          pageSize: '200',
        });

        const res = await fetch(`${BASE_URL}/api/purchase-orders?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.message || '获取采购订单失败');
        }

        const list = json.data?.list || json.data || [];
        setPoList(list);
      } catch (err) {
        console.error('获取采购订单失败:', err);
        setPoError(err.message || '获取采购订单失败');
      } finally {
        setPoLoading(false);
      }
    };

    fetchPOs();
  }, [token]);

  if (!mat) {
    return <EmptyState icon={Box} title="物料不存在" description="未找到该物料" />;
  }

  const matSuppliers = suppliers.filter(s => s.mat === code);

  // 采购单按物料编码过滤；如果以后 mats 里有 id，也一起兼容
  const matPOs = poList.filter(po =>
    po.materialCode === mat.code ||
    (mat.id && po.materialId === mat.id)
  );

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#64748b',
          marginBottom: '24px',
          padding: 0
        }}
      >
        <ChevronLeft size={20} /> 返回
      </button>

      <Card style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{mat.name}</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{mat.spec}</p>
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>当前库存</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: mat.inv < mat.safe ? '#dc2626' : '#0f172a' }}>
              {mat.inv.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>在途数量</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {mat.transit.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>安全库存</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#64748b' }}>
              {mat.safe.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>采购周期</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#64748b' }}>
              {mat.lead}天
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>采购员</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
              {mat.buyer || '-'}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* 供应商卡片保持原样 */}
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>供应商</h2>
          {matSuppliers.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '14px' }}>暂无供应商信息</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matSuppliers.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: s.main ? '2px solid #3b82f6' : '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                    {s.main && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#3b82f6',
                          background: '#eff6ff',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        主供应商
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    准时率: {(s.onTime * 100).toFixed(0)}% | 质量率: {(s.quality * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 采购订单卡片改为使用 matPOs */}
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>采购订单</h2>

          {poLoading && (
            <div style={{ color: '#64748b', fontSize: '14px' }}>正在加载采购订单...</div>
          )}

          {poError && (
            <div style={{ color: '#ef4444', fontSize: '14px' }}>{poError}</div>
          )}

          {!poLoading && !poError && matPOs.length === 0 && (
            <div style={{ color: '#64748b', fontSize: '14px' }}>暂无采购订单</div>
          )}

          {!poLoading && !poError && matPOs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matPOs.map((po) => (
                <div
                  key={po.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                      {po.poNo}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {po.supplierName} | {Number(po.quantity || 0).toLocaleString()} {po.unit || ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {formatDate(po.expectedDate || po.orderDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
});


// ============ 预警页面 ============
const WarningsPage = memo(({ data }) => {
  const { mats = [] } = data;
  const [levelFilter, setLevelFilter] = useState('all');
  
  const warnings = useMemo(() => {
    return mats.filter(m => m.inv < m.safe).map(m => ({
      level: m.inv < m.safe * 0.5 ? 'RED' : m.inv < m.safe * 0.8 ? 'ORANGE' : 'YELLOW',
      matCode: m.code,
      matName: m.name,
      stockQty: m.inv,
      safetyStock: m.safe,
      buyer: m.buyer
    }));
  }, [mats]);

  const filtered = levelFilter === 'all' ? warnings : warnings.filter(w => w.level === levelFilter);
  const levelColors = { RED: '#ef4444', ORANGE: '#f97316', YELLOW: '#eab308' };
  const levelTexts = { RED: '红色预警', ORANGE: '橙色预警', YELLOW: '黄色预警' };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>库存预警</h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>库存低于安全库存的物料</p>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'RED', 'ORANGE', 'YELLOW'].map(level => (
            <button key={level} onClick={() => setLevelFilter(level)} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: levelFilter === level ? (level === 'all' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : levelColors[level]) : '#f1f5f9', color: levelFilter === level ? '#fff' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              {level === 'all' ? `全部 (${warnings.length})` : `${levelTexts[level]} (${warnings.filter(w => w.level === level).length})`}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={CheckCircle} title="暂无预警" description="当前没有库存预警" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>级别</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>物料</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>当前库存</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>安全库存</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>采购员</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: levelColors[w.level] }} /></td>
                    <td style={{ padding: '16px' }}><div style={{ fontWeight: 600, color: '#0f172a' }}>{w.matName}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{w.matCode}</div></td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>{w.stockQty.toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>{w.safetyStock.toLocaleString()}</td>
                    <td style={{ padding: '16px', color: '#374151', fontWeight: 500 }}>{w.buyer || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
});

// ============ 业务订单管理页面 ============

// ============ 采购订单管理页面 ============

// ============ 用户管理页面 ============

// ============ 通用 CRUD 管理页面 ============
const CrudManagementPage = memo(({ title, subtitle, apiEndpoint, columns, formFields, icon: Icon }) => {
  const { request } = useApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [keyword, setKeyword] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await request(`${apiEndpoint}?keyword=${keyword}`);
    if (res.success) setItems(res.data?.list || res.data || []);
    setLoading(false);
  }, [request, apiEndpoint, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const endpoint = editingItem ? `${apiEndpoint}/${editingItem.id}` : apiEndpoint;
    const method = editingItem ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) { setShowModal(false); fetchData(); }
    else alert(res.message || '操作失败');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除吗？')) return;
    const res = await request(`${apiEndpoint}/${id}`, { method: 'DELETE' });
    if (res.success) fetchData();
    else alert(res.message || '删除失败');
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    const initialData = {};
    formFields.forEach(f => { initialData[f.key] = item ? item[f.key] || '' : f.defaultValue || ''; });
    setFormData(initialData);
    setShowModal(true);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>{subtitle}</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>新增</Button>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="搜索..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>刷新</Button>
        </div>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Icon || Package} title="暂无数据" description="点击新增按钮添加" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {columns.map(col => <th key={col.key} style={{ textAlign: col.align || 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{col.title}</th>)}
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {columns.map(col => <td key={col.key} style={{ padding: '16px', fontSize: '14px', color: '#374151', textAlign: col.align || 'left' }}>{col.render ? col.render(item[col.key], item) : item[col.key]}</td>)}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(item)}>编辑</Button>
                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(item.id)}>删除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? `编辑${title}` : `新增${title}`}>
        {formFields.map(field => (
          field.type === 'select' ? (
            <Select key={field.key} label={field.label} value={formData[field.key]} onChange={v => setFormData({ ...formData, [field.key]: v })} required={field.required} options={field.options} />
          ) : (
            <Input key={field.key} label={field.label} type={field.type || 'text'} value={formData[field.key]} onChange={v => setFormData({ ...formData, [field.key]: v })} required={field.required} />
          )
        ))}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

// ============ 产品/物料/供应商/仓库管理（使用通用CRUD） ============
// ProductManagementPage 已移至 ./pages/ProductManagementPage.jsx


const SupplierManagementPage = memo(() => (
  <CrudManagementPage title="供应商管理" subtitle="管理供应商信息" apiEndpoint="/api/suppliers" icon={Building}
    columns={[
      { key: 'supplierCode', title: '供应商编码', render: (v) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{v}</span> },
      { key: 'name', title: '供应商名称' },
      { key: 'contactPerson', title: '联系人' },
      { key: 'phone', title: '电话' },
      { key: 'onTimeRate', title: '准时率', align: 'center', render: (v) => <span style={{ fontWeight: 600, color: v >= 0.9 ? '#16a34a' : '#f59e0b' }}>{((v || 0) * 100).toFixed(0)}%</span> },
    ]}
    formFields={[
      { key: 'supplierCode', label: '供应商编码', required: true },
      { key: 'name', label: '供应商名称', required: true },
      { key: 'contactPerson', label: '联系人' },
      { key: 'phone', label: '电话' },
      { key: 'email', label: '邮箱' },
      { key: 'address', label: '地址' },
    ]}
  />
));

// WarehouseManagementPage 已移至 ./pages/WarehouseManagementPage.jsx

// ============ 主应用内容（带URL路由） ============
const MainApp = () => {
  const { token } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(() => {
    // 初始化时从URL读取路由
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    return { page: path.slice(1) || 'dashboard', data: params.get('id') || null };
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || '网络请求失败');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 导航函数 - 同时更新URL
  const navigate = useCallback((page, pageData = null) => {
    const url = pageData ? `/${page}?id=${pageData}` : `/${page}`;
    window.history.pushState({ page, data: pageData }, '', url);
    setCurrentRoute({ page, data: pageData });
  }, []);

  // 返回函数
  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  // 监听浏览器前进/后退按钮
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        setCurrentRoute({ page: event.state.page, data: event.state.data });
      } else {
        // 如果没有state，从URL解析
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        setCurrentRoute({ page: path.slice(1) || 'dashboard', data: params.get('id') || null });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 初始化时设置history state
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const page = path.slice(1) || 'dashboard';
    const pageData = params.get('id') || null;
    window.history.replaceState({ page, data: pageData }, '', window.location.href);
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={fetchData} />;

  const sharedData = data || { orders: [], orderLines: [], products: [], bom: [], mats: [], suppliers: [], pos: [] };
  const { page, data: pageData } = currentRoute;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage data={sharedData} onNav={navigate} />;
      case 'order-detail': return <OrderDetailPage id={pageData} data={sharedData} onNav={navigate} onBack={goBack} />;
      case 'product-detail': return <ProductDetailPage code={pageData} data={sharedData} onNav={navigate} onBack={goBack} />;
      case 'material-detail': return <MaterialDetailPage code={pageData} data={sharedData} onBack={goBack} />;
      case 'warnings': return <WarningsPage data={sharedData} />;
      case 'users': return <UserManagementPage 
        Button={Button} 
        Input={Input} 
        Select={Select} 
        Modal={Modal} 
        Card={Card} 
        EmptyState={EmptyState} 
        LoadingScreen={LoadingScreen} 
      />;
      case 'products': return <ProductManagementPage />;
      case 'materials': return <MaterialManagementPage />;
      case 'suppliers': return <SupplierManagementPage />;
      case 'warehouses': return <WarehouseManagementPage />;
      case 'orders': return <SalesOrderPage 
        Button={Button} 
        Input={Input} 
        Select={Select} 
        Modal={Modal} 
        Card={Card} 
        EmptyState={EmptyState} 
        LoadingScreen={LoadingScreen} 
        StatusTag={StatusTag} 
      />;
      case 'purchase-orders': return <PurchaseOrderPage 
        Button={Button} 
        Input={Input} 
        Select={Select} 
        Modal={Modal} 
        Card={Card} 
        EmptyState={EmptyState} 
        LoadingScreen={LoadingScreen} 
        StatusTag={StatusTag} 
      />;
      default: return <DashboardPage data={sharedData} onNav={navigate} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <Sidebar 
        currentPage={page} 
        onNavigate={(p) => navigate(p, null)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main style={{ marginLeft: sidebarCollapsed ? '80px' : '280px', minHeight: '100vh', transition: 'margin-left 0.3s', padding: '40px' }}>
        {renderPage()}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 10px; }
      `}</style>
    </div>
  );
};

// ============ 主应用入口 ============
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginPage />;
  return <MainApp />;
}