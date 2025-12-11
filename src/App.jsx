import React, { useState, useMemo, useCallback, useEffect, createContext, useContext, memo, useRef } from 'react';
import { AlertCircle, Package, TrendingUp, TrendingDown, ChevronLeft, CheckCircle, AlertTriangle, XCircle, Clock, Factory, Users, Calendar, Box, Truck, AlertOctagon, Filter, ChevronRight, Layers, ShoppingCart, LogOut, User, Menu, X, Home, FileText, Settings, Warehouse, Building, UserPlus, Edit, Trash2, Plus, Save, Search, RefreshCw, Zap, Eye, Play, Send, Check, ArrowRight } from 'lucide-react';
// 在第2行添加这些
import { BASE_URL, RISK, PO_STATUS, SO_STATUS } from './config/constants';
import { debounce, formatDate, formatDateInput, createRiskCalculator, highestRisk, TODAY, daysDiff } from './utils/helpers';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApi } from './hooks/useApi';

// 导入页面组件
// ✅ 新的导入（使用新路径）
import LoginPage from "./pages/LoginPage/index";
import SalesOrderPage from "./pages/SalesOrder/index";
import PurchaseOrderPage from "./pages/Purchase/index";
import UserManagementPage from "./pages/User/index";
import ProductManagementPage from "./pages/Product/index";
import MaterialManagementPage from "./pages/Material/index";
import WarehouseManagementPage from "./pages/Warehouse/index";
import SupplierManagementPage from "./pages/Supplier/index";

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

// ✅ 安全的菜单过滤 - 处理 role 是对象或字符串的情况
  const visibleItems = !user ? menuItems : menuItems.filter(item => {
    if (!user || !user.role) return false;
    
    // 提取角色字符串
    const userRoleStr = typeof user.role === 'object' 
      ? (user.role.code || user.role.name || '')
      : String(user.role);
    
    // 检查权限
    return item.roles.some(requiredRole => 
      String(requiredRole).toLowerCase() === userRoleStr.toLowerCase()
    );
  });

  const getRoleName = (role) => {
    if (!role) return '未知';
    if (typeof role === 'object') return role.name || role.code || '未知';
    return ({ admin: '管理员', sales: '业务员', purchaser: '采购员' }[role] || role);
  };
  
  const getRoleColor = (role) => {
    if (!role) return '#64748b';
    const roleStr = typeof role === 'object' ? (role.code || role.name) : role;
    return ({ admin: '#3b82f6', sales: '#10b981', purchaser: '#f59e0b' }[roleStr] || '#64748b');
  };

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
  const { orders = [], orderLines = [], products = [], bom = [], mats = [], suppliers = [] } = data;
  const { token } = useAuth();
  
  // ✅ 修复：获取真实采购订单数据
  const [poList, setPoList] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  
  useEffect(() => {
    if (!token) return;
    
    const fetchPOs = async () => {
      try {
        setPoLoading(true);
        const params = new URLSearchParams({ page: '1', pageSize: '200' });
        const res = await fetch(`${BASE_URL}/api/purchase-orders?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        const json = await res.json();
        if (json.success) {
          setPoList(json.data?.list || json.data || []);
        }
      } catch (err) {
        console.error('获取采购订单失败:', err);
      } finally {
        setPoLoading(false);
      }
    };
    
    fetchPOs();
  }, [token]);
  
  // ✅ 转换真实采购订单为风险计算器格式
  const poPos = useMemo(() => 
    poList.map(po => ({
      mat: po.materialCode,
      qty: Number(po.quantity) || 0,
      date: (po.expectedDate || po.orderDate || '').split('T')[0],
      status: po.status,
      supplier: po.supplierName,
    })),
    [poList]
  );
  
  // ✅ 使用真实采购订单创建风险计算器
  const calcRisk = useMemo(() => createRiskCalculator(mats, poPos, suppliers), [mats, poPos, suppliers]);
  
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
    inTransit: poList.filter(p => p.status === 'shipped' || p.status === 'producing').length
  }), [orderData, mats, poList]);

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
                  <TableRow 
  key={order.id} 
  onClick={() => {
    console.log('🔍 Order data:', order);
    console.log('🔍 ID type:', typeof order.id, order.id);
    onNav('order-detail', order.id);
  }}
>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{typeof order.customer === "object" ? (order.customer?.name || "N/A") : order.customer}</td>
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

// ============ 订单详情页 - 完全重写（使用真实API） ============
const OrderDetailPage = memo(({ id, data, onNav, onBack }) => {
  const { orders = [], suppliers = [] } = data;
  const { token } = useAuth();
  const order = orders.find(o => o.id === id);
  
  // 状态管理
  const [orderLines, setOrderLines] = useState([]);
  const [productDataWithRisk, setProductDataWithRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [poList, setPoList] = useState([]);
  
  // ✅ 关键修复：对每个产品获取真实BOM和计算风险
  useEffect(() => {
    if (!token || !order) return;
    
    const fetchCompleteOrderData = async () => {
      try {
        setLoading(true);
        
        // 1. 获取订单详情（包含产品列表）
        // 如果 id 是订单号（如 SO2025-002），转换为数字 ID
        let apiId = id;
        if (typeof id === 'string' && id.startsWith('SO')) {
         // 尝试从本地数据查找真实 ID
          const localOrder = orders.find(o => o.id === id || o.order_no === id);
          apiId = localOrder?.order_id || localOrder?.sales_order_id || id;
          console.log('🔍 Converting order ID:', id, '→', apiId);
        }

        const orderRes = await fetch(`${BASE_URL}/api/sales-orders/${apiId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const orderData = await orderRes.json();
        
        if (!orderData.success) {
          console.error('获取订单失败');
          setLoading(false);
          return;
        }
        
        const lines = orderData.data?.lines || [];
        setOrderLines(lines);
        
        // 2. 获取所有采购订单
        const poRes = await fetch(`${BASE_URL}/api/purchase-orders?page=1&pageSize=200`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const poData = await poRes.json();
        const purchaseOrders = poData.success ? (poData.data?.list || []) : [];
        setPoList(purchaseOrders);
        
        // 3. 获取所有物料数据
        const materialsRes = await fetch(`${BASE_URL}/api/materials`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const materialsData = await materialsRes.json();
        const allMaterials = materialsData.success ? (materialsData.data?.list || materialsData.data || []) : [];
        
        // 4. 为每个产品获取BOM并计算风险
        const productsWithRisk = await Promise.all(
          lines.map(async (line) => {
            try {
              // 获取产品BOM
              const prodRes = await fetch(`${BASE_URL}/api/products/${line.productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const prodData = await prodRes.json();
              
              if (!prodData.success) {
                return {
                  ...line,
                  bomItems: [],
                  materialRisks: [],
                  overallRisk: 'ongoing'
                };
              }
              
              const bomItems = prodData.data?.bomItems || [];
              
              // 计算每个BOM物料的风险
              const materialRisks = bomItems.map(bomItem => {
                // 找到物料数据
                const material = allMaterials.find(m => m.id === bomItem.materialId);
                if (!material) return null;
                
                const demand = bomItem.quantity * line.quantity;
                
                // 该物料的采购订单
                const matPOs = purchaseOrders.filter(po => 
                  po.materialId === material.id || po.materialCode === (material.materialCode || material.material_code)
                );
                
                // 计算库存和在途
                const currentStock = material.stock || 0;
                const inTransit = matPOs
                  .filter(po => po.status === 'producing' || po.status === 'shipped')
                  .reduce((sum, po) => sum + (Number(po.quantity) || 0), 0);
                
                const available = currentStock + inTransit;
                const gap = Math.max(0, demand - available);
                const daysLeft = daysDiff(order.deliveryDate, TODAY);
                
                // 检查采购是否延迟
                let hasDelayedPO = false;
                let maxDelay = 0;
                matPOs.forEach(po => {
                  const expectedDate = po.expectedDate || po.orderDate;
                  if (expectedDate) {
                    const delay = daysDiff(expectedDate, order.deliveryDate);
                    if (delay > 0) {
                      hasDelayedPO = true;
                      maxDelay = Math.max(maxDelay, delay);
                    }
                  }
                });
                
                // ✅ 优化的风险等级判断
                let level = 'ongoing';
                
                if (daysLeft < 0 && gap > 0) {
                  // 订单已逾期且库存不足
                  level = 'overdue';
                } else if (hasDelayedPO && gap > 0 && daysLeft < 14) {
                  // 采购延迟且库存不足且交期临近
                  level = 'overdue';
                } else if (inTransit === 0 && gap > 0 && daysLeft < 30) {
                  // 没有在途采购，有缺口
                  level = 'pending';
                } else if (gap > 0 && daysLeft < 7) {
                  // 7天内交付且有缺口
                  level = 'urgent';
                } else if (gap > demand * 0.3) {
                  // 缺口超过30%
                  level = 'warning';
                } else if (currentStock < (material.safeStock || material.safe_stock || 100)) {
                  // 库存低于安全库存但够用
                  level = 'warning';
                }
                
                return {
                  materialId: bomItem.materialId,
                  materialCode: material.materialCode || material.material_code,
                  materialName: bomItem.materialName || material.name,
                  unitUsage: bomItem.quantity,
                  demand,
                  currentStock,
                  inTransit,
                  available,
                  gap,
                  daysLeft,
                  hasDelayedPO,
                  maxDelay,
                  level
                };
              }).filter(Boolean);
              
              // 产品风险 = 所有物料的最高风险
              const productRisk = materialRisks.length > 0 
                ? highestRisk(materialRisks.map(r => r.level))
                : 'ongoing';
              
              return {
                ...line,
                bomItems,
                materialRisks,
                overallRisk: productRisk
              };
              
            } catch (error) {
              console.error('获取产品BOM失败:', line.productName, error);
              return {
                ...line,
                bomItems: [],
                materialRisks: [],
                overallRisk: 'ongoing'
              };
            }
          })
        );
        
        setProductDataWithRisk(productsWithRisk);
        setLoading(false);
        
      } catch (error) {
        console.error('获取订单数据失败:', error);
        setLoading(false);
      }
    };
    
    fetchCompleteOrderData();
  }, [id, token, order]);
  
  // ✅ 计算订单整体风险
  const orderOverallRisk = useMemo(() => {
    if (productDataWithRisk.length === 0) return 'ongoing';
    
    const productRisks = productDataWithRisk.map(p => p.overallRisk);
    let overallRisk = highestRisk(productRisks);
    
    // 特殊规则：如果今天已过交付日期 → 强制"逾期"
    if (order && order.deliveryDate) {
      const daysLeft = daysDiff(order.deliveryDate, TODAY);
      if (daysLeft < 0 && order.status !== 'completed') {
        overallRisk = 'overdue';
      }
    }
    
    return overallRisk;
  }, [productDataWithRisk, order]);
  
  if (!order) return <EmptyState icon={Package} title="订单不存在" description="未找到该订单" />;

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', marginBottom: '24px', padding: 0 }}>
        <ChevronLeft size={20} /> 返回
      </button>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>订单 {order.id}</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{typeof order.customer === "object" ? (order.customer?.name || "N/A") : order.customer}</p>
          </div>
          <StatusBadge level={orderOverallRisk} />
        </div>
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>下单日期</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              {order.orderDate ? formatDate(order.orderDate) : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>交付日期</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              {order.deliveryDate ? formatDate(order.deliveryDate) : '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>业务员</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              {order.salesPerson || '-'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>距离交付</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: daysDiff(order.deliveryDate, TODAY) < 0 ? '#ef4444' : '#10b981' }}>
              {daysDiff(order.deliveryDate, TODAY) >= 0 ? `${daysDiff(order.deliveryDate, TODAY)} 天` : `逾期 ${Math.abs(daysDiff(order.deliveryDate, TODAY))} 天`}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px 0' }}>产品清单</h2>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            正在加载产品BOM数据，计算准确风险...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {productDataWithRisk.map((prod, idx) => (
              <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{prod.productName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>数量: {prod.quantity?.toLocaleString() || 0}</div>
                  </div>
                  <StatusBadge level={prod.overallRisk} size="sm" />
                </div>
                
                {/* BOM物料风险详情 */}
                {prod.materialRisks && prod.materialRisks.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                      BOM物料状态 ({prod.materialRisks.length}个)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {prod.materialRisks.map((mat, midx) => (
                        <div key={midx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: '6px', fontSize: '12px' }}>
                          <span style={{ color: '#374151', fontWeight: 500 }}>{mat.materialName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                              库存:{mat.currentStock} | 在途:{mat.inTransit}
                            </span>
                            <StatusBadge level={mat.level} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
});

// ============ 产品详情页 ============
// ============ 产品详情页（修正 BOM 在途数量） ============
const ProductDetailPage = memo(({ code, data, onNav, onBack }) => {
  const { products = [], bom = [], mats = [], suppliers = [] } = data;
  const { token } = useAuth();

  const [poList, setPoList] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poError, setPoError] = useState('');

  // 当前产品
  const product = useMemo(
    () => products.find(p => p.code === code),
    [products, code]
  );

  // 拉正式采购订单列表，用它来算在途
  useEffect(() => {
    if (!token) return;

    const fetchPOs = async () => {
      try {
        setPoLoading(true);
        setPoError('');

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

  if (!product) {
    return <EmptyState icon={Package} title="产品不存在" description="未找到该产品" />;
  }

  // 该产品的 BOM
  const prodBom = useMemo(
    () => bom.filter(b => b.p === code),
    [bom, code]
  );

  // 把采购订单转成类似原来 pos 的结构，给风险计算器用
  const poPos = useMemo(
    () =>
      poList.map(po => ({
        mat: po.materialCode,                          // 物料编码
        qty: Number(po.quantity) || 0,                 // 数量
        expectedDate: (po.expectedDate || po.orderDate || '').split('T')[0],
        status: po.status,
        supplier: po.supplierName,
      })),
    [poList]
  );

  // 每个物料的在途数量 map，方便直接覆盖 transit
  const transitMap = useMemo(() => {
    const map = {};
    poPos.forEach(p => {
      if (!p.mat) return;
      map[p.mat] = (map[p.mat] || 0) + (p.qty || 0);
    });
    return map;
  }, [poPos]);

  // 用“采购订单版 pos” 计算风险
  const calcRisk = useMemo(
    () => createRiskCalculator(mats, poPos, suppliers),
    [mats, poPos, suppliers]
  );

  const matRisks = useMemo(
    () =>
      prodBom
        .map(b => {
          const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
          const risk = calcRisk(b.m, b.c * 1000, targetDate);
          if (!risk) return null;

          // ✅ 在这里用 transitMap 覆盖 risk.transit，保证在途数量等于真实采购在途
          const transit = transitMap[b.m] ?? risk.transit ?? 0;

          return {
            ...risk,
            transit,
            bomQty: b.c,
          };
        })
        .filter(Boolean),
    [prodBom, calcRisk, transitMap]
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
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 8px 0'
          }}
        >
          {product.name}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          产品编码: {product.code}
        </p>
      </Card>

      <Card>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 20px 0'
          }}
        >
          BOM 物料清单
        </h2>

        {poLoading && (
          <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
            正在加载采购订单，用于计算在途数量…
          </div>
        )}
        {poError && (
          <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '8px' }}>
            {poError}
          </div>
        )}

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
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {mat.name}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                    {mat.bomQty}
                  </td>
                  <td
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: mat.inv < mat.safe ? '#dc2626' : '#10b981'
                    }}
                  >
                    {mat.inv.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: mat.transit > 0 ? '#3b82f6' : '#64748b'
                    }}
                  >
                    {mat.transit.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <StatusBadge level={mat.level} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});

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

        const params = new URLSearchParams({
          page: '1',
          pageSize: '200',
        });

        const res = await fetch(
          `${BASE_URL}/api/purchase-orders?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

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
    return (
      <EmptyState
        icon={Box}
        title="物料不存在"
        description="未找到该物料"
      />
    );
  }

  // 该物料的供应商
  const matSuppliers = suppliers.filter((s) => s.mat === code);

  // 该物料关联的采购单（从 /api/purchase-orders 拉回来的）
  const matPOs = poList.filter(
    (po) => po.materialCode === mat.code || (mat.id && po.materialId === mat.id)
  );

  // 👉 在途数量：优先用采购订单求和，若列表为空则回退到 mats 里的 transit 字段
  const transitQty =
    matPOs.length > 0
      ? matPOs.reduce(
          (sum, po) => sum + Number(po.quantity || 0),
          0
        )
      : Number(mat.transit || 0);

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
          padding: 0,
        }}
      >
        <ChevronLeft size={20} /> 返回
      </button>

      {/* 头部信息 */}
      <Card style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}
        >
          {mat.name}
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0,
          }}
        >
          {mat.spec}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '4px',
              }}
            >
              当前库存
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: mat.inv < mat.safe ? '#dc2626' : '#0f172a',
              }}
            >
              {Number(mat.inv || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '4px',
              }}
            >
              在途数量
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {transitQty.toLocaleString()}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '4px',
              }}
            >
              安全库存
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              {Number(mat.safe || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '4px',
              }}
            >
              采购周期
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              {mat.lead}天
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '4px',
              }}
            >
              采购员
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#3b82f6',
              }}
            >
              {mat.buyer || '-'}
            </div>
          </div>
        </div>
      </Card>

      {/* 下方供应商 + 采购单 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}
      >
        {/* 供应商卡片 */}
        <Card>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 16px 0',
            }}
          >
            供应商
          </h2>
          {matSuppliers.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              暂无供应商信息
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {matSuppliers.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: s.main
                      ? '2px solid #3b82f6'
                      : '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{ fontWeight: 600, color: '#0f172a' }}
                    >
                      {s.name}
                    </div>
                    {s.main && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#3b82f6',
                          background: '#eff6ff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        主供应商
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginTop: '8px',
                    }}
                  >
                    准时率: {(s.onTime * 100).toFixed(0)}% | 质量率:{' '}
                    {(s.quality * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 采购订单卡片（使用 matPOs） */}
        <Card>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 16px 0',
            }}
          >
            采购订单
          </h2>

          {poLoading && (
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              正在加载采购订单...
            </div>
          )}

          {poError && (
            <div style={{ color: '#ef4444', fontSize: '14px' }}>
              {poError}
            </div>
          )}

          {!poLoading && !poError && matPOs.length === 0 && (
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              暂无采购订单
            </div>
          )}

          {!poLoading && !poError && matPOs.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {matPOs.map((po) => (
                <div
                  key={po.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#0f172a',
                        fontSize: '13px',
                      }}
                    >
                      {po.poNo}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                      }}
                    >
                      {po.supplierName} |{' '}
                      {Number(po.quantity || 0).toLocaleString()}{' '}
                      {po.unit || ''}
                    </div>
                  </div>
                  <div
                    style={{ fontSize: '12px', color: '#64748b' }}
                  >
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
// ============ 通用 CRUD 页面（安全渲染版） ============
const CrudManagementPage = memo(({
  title,
  columns,
  fetchUrl,
  createUrl,
  updateUrl,
  deleteUrl,
  filters: initialFilters = [],
  Button,
  Input,
  Select,
  Modal,
  Card,
  EmptyState,
  LoadingScreen,
  StatusTag,
}) => {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState(() =>
    initialFilters.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultValue || '' }), {})
  );

  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---------- 核心：统一安全渲染函数 ----------
  const normalizeValue = useCallback((value) => {
    if (value == null || Number.isNaN(value)) return '';

    // React 元素直接返回
    if (React.isValidElement(value)) return value;

    // 数组：逐个渲染并用逗号隔开
    if (Array.isArray(value)) {
      return value.map((v, i) => (
        <span key={i}>
          {i > 0 ? ', ' : ''}
          {normalizeValue(v)}
        </span>
      ));
    }

    // 对象：尽量挑一个“最像人话”的字段来展示
    if (typeof value === 'object') {
      if ('name' in value && value.name != null) return String(value.name);
      if ('code' in value && value.code != null) return String(value.code);
      if ('id' in value && value.id != null) return String(value.id);
      // 实在没办法，就安全地 JSON 一下避免直接把对象塞进 JSX
      try {
        return JSON.stringify(value);
      } catch {
        return '[object]';
      }
    }

    // 其他：统一转成字符串
    return String(value);
  }, []);

  // 让每一格的渲染都走 normalizeValue
    // 统一安全渲染单元格，避免把对象直接塞进 JSX
  const renderCell = (col, item) => {
    const raw = col.render ? col.render(item[col.key], item) : item[col.key];

    // React 元素 / null / undefined 直接用
    if (
      React.isValidElement(raw) ||
      raw === null ||
      raw === undefined
    ) {
      return raw;
    }

    // 基本类型，转成字符串
    const t = typeof raw;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      return String(raw);
    }

    // 对象：尽量挑一个字段展示
    if (t === 'object') {
      if (raw.name) return String(raw.name);
      if (raw.code) return String(raw.code);
      if (raw.id) return String(raw.id);
      try {
        return JSON.stringify(raw);
      } catch {
        return '[object]';
      }
    }

    // 兜底
    return String(raw);
  };

  // ---------- 加载数据 ----------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: search || '',
      });

      Object.entries(filters).forEach(([k, v]) => {
        if (v != null && v !== '') params.append(k, v);
      });

      const res = await fetch(`${BASE_URL}${fetchUrl}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const list = json.data?.list || json.data || json.items || [];
      setItems(Array.isArray(list) ? list : []);
      setTotal(json.data?.total || json.total || list.length || 0);
    } catch (err) {
      console.error(`${title} 列表获取失败:`, err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [token, fetchUrl, page, pageSize, search, filters, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- 创建 / 更新 ----------
  const handleSave = async (formData) => {
    try {
      setLoading(true);
      const isEdit = !!editingItem;
      const url = isEdit ? `${BASE_URL}${updateUrl}/${editingItem.id}` : `${BASE_URL}${createUrl}`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error(`${isEdit ? '更新' : '创建'} ${title} 失败:`, err);
      alert(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  // ---------- 删除 ----------
  const handleDelete = async (id) => {
    if (!window.confirm('确认删除这条记录吗？')) return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}${deleteUrl}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchData();
    } catch (err) {
      console.error(`删除 ${title} 失败:`, err);
      alert(err.message || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{title}</h1>
        {Button && (
          <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            新建 {title}
          </Button>
        )}
      </div>

      {/* 筛选区 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {initialFilters.map((f) => (
          <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{f.label}</span>
            {f.type === 'select' && Select ? (
              <Select
                value={filters[f.key]}
                onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
              >
                <option value="">全部</option>
                {(f.options || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            ) : Input ? (
              <Input
                placeholder={f.placeholder || ''}
                value={filters[f.key]}
                onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            ) : null}
          </div>
        ))}

        {Input && (
          <div style={{ marginLeft: 'auto' }}>
            <Input
              placeholder="搜索…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
        )}
      </div>

      {/* 列表区 */}
      {loading && <LoadingScreen />}
      {!loading && error && <EmptyState message={error} />}

      {!loading && !error && (
        <Card>
          {items.length === 0 ? (
            <EmptyState message={`暂无${title}`} />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderBottom: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        fontWeight: 600,
                        color: '#475569',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.title}
                    </th>
                  ))}
                  <th style={{ width: 120, padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id || item.code}>
                          {columns.map(col => (
        <td
          key={col.key}
          style={{
            padding: '16px',
            fontSize: '14px',
            color: '#0f172a',
            textAlign: col.align || 'left',
            whiteSpace: 'nowrap',
          }}
        >
          {renderCell(col, item)}
        </td>
      ))}

                    <td
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {Button && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                            style={{ marginRight: 8 }}
                          >
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                          >
                            删除
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* TODO: 你原来如果有 Modal / 分页，这里可以继续接上你自己的实现 */}
      {Modal && isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
          title={editingItem ? `编辑${title}` : `新建${title}`}
          onSave={handleSave}
          initialData={editingItem || {}}
          columns={columns}
        />
      )}
    </div>
  );
});
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
      case 'products': return <ProductManagementPage 
        Button={Button} Input={Input} Select={Select} Modal={Modal} 
        Card={Card} EmptyState={EmptyState} LoadingScreen={LoadingScreen}
      />;

      case 'materials': return <MaterialManagementPage 
        Button={Button} Input={Input} Select={Select} Modal={Modal} 
        Card={Card} EmptyState={EmptyState} LoadingScreen={LoadingScreen}
      />;

      case 'warehouses': return <WarehouseManagementPage 
        Button={Button} Input={Input} Select={Select} Modal={Modal} 
       Card={Card} EmptyState={EmptyState} LoadingScreen={LoadingScreen}
      />;
      case 'suppliers': return <SupplierManagementPage 
        Button={Button}
        Input={Input}
        Select={Select}
        Modal={Modal}
        Card={Card}
        EmptyState={EmptyState}
        LoadingScreen={LoadingScreen}
      />;
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
