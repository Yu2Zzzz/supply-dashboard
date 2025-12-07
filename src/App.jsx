import React, { useState, useMemo, useCallback, useEffect, createContext, useContext, memo, useRef } from 'react';
import { AlertCircle, Package, TrendingUp, TrendingDown, ChevronLeft, CheckCircle, AlertTriangle, XCircle, Clock, Factory, Users, Calendar, Box, Truck, AlertOctagon, Filter, ChevronRight, Layers, ShoppingCart, LogOut, User, Menu, X, Home, FileText, Settings, Warehouse, Building, UserPlus, Edit, Trash2, Plus, Save, Search, RefreshCw, Zap, Eye, Play, Send, Check, ArrowRight } from 'lucide-react';

// ============ 常量配置 ============
const BASE_URL = 'https://supply-backend-production.up.railway.app';

// 采购订单状态
const PO_STATUS = {
  draft: { text: '草稿', color: '#64748b', bgColor: '#f1f5f9', next: 'confirmed' },
  confirmed: { text: '已确认', color: '#3b82f6', bgColor: '#dbeafe', next: 'producing' },
  producing: { text: '生产中', color: '#f59e0b', bgColor: '#fef3c7', next: 'shipped' },
  shipped: { text: '已发货', color: '#8b5cf6', bgColor: '#ede9fe', next: 'arrived' },
  arrived: { text: '已到货', color: '#10b981', bgColor: '#d1fae5', next: null },
  cancelled: { text: '已取消', color: '#ef4444', bgColor: '#fee2e2', next: null }
};

// 销售订单状态
const SO_STATUS = {
  pending: { text: '待处理', color: '#64748b', bgColor: '#f1f5f9', next: 'confirmed' },
  confirmed: { text: '已确认', color: '#3b82f6', bgColor: '#dbeafe', next: 'processing' },
  processing: { text: '处理中', color: '#f59e0b', bgColor: '#fef3c7', next: 'shipped' },
  shipped: { text: '已发货', color: '#8b5cf6', bgColor: '#ede9fe', next: 'completed' },
  completed: { text: '已完成', color: '#10b981', bgColor: '#d1fae5', next: null },
  cancelled: { text: '已取消', color: '#ef4444', bgColor: '#fee2e2', next: null }
};

// 风险等级
const RISK = {
  none: { level: 0, text: '正常', color: '#10b981', bgColor: '#d1fae5' },
  low: { level: 1, text: '低风险', color: '#f59e0b', bgColor: '#fef3c7' },
  medium: { level: 2, text: '中风险', color: '#f97316', bgColor: '#ffedd5' },
  high: { level: 3, text: '高风险', color: '#ef4444', bgColor: '#fee2e2' }
};

// 日期工具函数
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const daysDiff = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

// ============ 认证上下文 ============
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, message: data.message || '登录失败' };
    } catch (e) {
      setIsLoading(false);
      return { success: false, message: '网络错误' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token;

  return <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, isLoading }}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// ============ API Hook ============
const useApi = () => {
  const { token, logout } = useAuth();
  
  const request = useCallback(async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });
      if (res.status === 401) {
        logout();
        return { success: false, message: '登录已过期' };
      }
      return await res.json();
    } catch (e) {
      return { success: false, message: '网络错误' };
    }
  }, [token, logout]);

  return { request };
};

// ============ API 配置 ============


// ============ 工具函数 ============

// ============ 认证上下文 ============

// ============ API 请求封装 ============

// ============ 登录页面 ============
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
            overflow: 'hidden'
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0 }}>百汇供应链管理系统</h1>
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
      <div style={{ width: '80px', height: '80px', margin: '0 auto 32px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite', overflow: 'hidden' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
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
        <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>百汇供应链</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>BAIHUI SCM</div>
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
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>百汇供应链风险监控概览</p>
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
const MaterialDetailPage = memo(({ code, data, onBack }) => {
  const { mats = [], suppliers = [], pos = [] } = data;
  const mat = mats.find(m => m.code === code);
  if (!mat) return <EmptyState icon={Box} title="物料不存在" description="未找到该物料" />;

  const matSuppliers = suppliers.filter(s => s.mat === code);
  const matPOs = pos.filter(p => p.mat === code);

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', marginBottom: '24px', padding: 0 }}>
        <ChevronLeft size={20} /> 返回
      </button>

      <Card style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{mat.name}</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{mat.spec}</p>
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>当前库存</div><div style={{ fontSize: '20px', fontWeight: 700, color: mat.inv < mat.safe ? '#dc2626' : '#0f172a' }}>{mat.inv.toLocaleString()}</div></div>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>在途数量</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{mat.transit.toLocaleString()}</div></div>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>安全库存</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#64748b' }}>{mat.safe.toLocaleString()}</div></div>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>采购周期</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#64748b' }}>{mat.lead}天</div></div>
          <div><div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>采购员</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{mat.buyer || '-'}</div></div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>供应商</h2>
          {matSuppliers.length === 0 ? <div style={{ color: '#64748b', fontSize: '14px' }}>暂无供应商信息</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matSuppliers.map((s, idx) => (
                <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: s.main ? '2px solid #3b82f6' : '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                    {s.main && <span style={{ fontSize: '10px', fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>主供应商</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>准时率: {(s.onTime * 100).toFixed(0)}% | 质量率: {(s.quality * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>采购订单</h2>
          {matPOs.length === 0 ? <div style={{ color: '#64748b', fontSize: '14px' }}>暂无采购订单</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matPOs.map((po, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{po.po}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{po.supplier} | {po.qty.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(po.date)}</div>
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
  const { request } = useApi();
  const { mats = [] } = data;
  const [warningType, setWarningType] = useState('material'); // 'material' | 'product' | 'delivery'
  const [levelFilter, setLevelFilter] = useState('all');
  const [productInventory, setProductInventory] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取产品库存和销售订单数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取销售订单
        const ordersRes = await request('/api/sales-orders');
        if (ordersRes.success) setSalesOrders(ordersRes.data?.list || ordersRes.data || []);
        
        // 尝试获取产品库存
        let products = [];
        try {
          const invRes = await request('/api/inventory?type=product');
          if (invRes.success) {
            products = invRes.data?.list || invRes.data || [];
          }
        } catch (e) {
          console.log('inventory API不可用');
        }
        
        // 如果没有数据，从products获取
        if (products.length === 0) {
          try {
            const prodRes = await request('/api/products');
            if (prodRes.success) {
              const prodList = prodRes.data?.list || prodRes.data || [];
              products = prodList.map(p => ({
                productCode: p.productCode || p.product_code,
                productName: p.name || p.productName,
                quantity: p.stock || p.inventory || 0,
                safetyStock: p.safetyStock || p.safety_stock || 100,
                warehouseName: '主仓库'
              }));
            }
          } catch (e) {
            console.log('获取产品失败');
          }
        }
        setProductInventory(products);
      } catch (e) {
        console.error('获取数据失败:', e);
      }
      setLoading(false);
    };
    fetchData();
  }, [request]);

  // 物料库存预警
  const materialWarnings = useMemo(() => {
    return mats.filter(m => m.inv < m.safe).map(m => ({
      level: m.inv < m.safe * 0.5 ? 'RED' : m.inv < m.safe * 0.8 ? 'ORANGE' : 'YELLOW',
      code: m.code,
      name: m.name,
      stockQty: m.inv,
      safetyStock: m.safe,
      shortage: m.safe - m.inv,
      buyer: m.buyer
    }));
  }, [mats]);

  // 产品库存预警
  const productWarnings = useMemo(() => {
    return productInventory.filter(p => {
      const qty = p.quantity || 0;
      const safe = p.safetyStock || p.safety_stock || 0;
      return safe > 0 && qty < safe;
    }).map(p => {
      const qty = p.quantity || 0;
      const safe = p.safetyStock || p.safety_stock || 0;
      return {
        level: qty < safe * 0.5 ? 'RED' : qty < safe * 0.8 ? 'ORANGE' : 'YELLOW',
        code: p.productCode || p.product_code,
        name: p.productName || p.product_name,
        stockQty: qty,
        safetyStock: safe,
        shortage: safe - qty,
        warehouse: p.warehouseName || p.warehouse_name || '-'
      };
    });
  }, [productInventory]);

  // 交期预警（订单即将到期或已过期）
  const deliveryWarnings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return salesOrders.filter(o => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      if (!o.deliveryDate && !o.delivery_date) return false;
      const deliveryDate = new Date(o.deliveryDate || o.delivery_date);
      const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7; // 7天内到期的订单
    }).map(o => {
      const deliveryDate = new Date(o.deliveryDate || o.delivery_date);
      const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
      return {
        level: daysUntil < 0 ? 'RED' : daysUntil <= 2 ? 'ORANGE' : 'YELLOW',
        orderNo: o.orderNo || o.order_no,
        customer: o.customerName || o.customer_name,
        deliveryDate: o.deliveryDate || o.delivery_date,
        daysUntil,
        status: o.status,
        totalAmount: o.totalAmount || o.total_amount || 0
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [salesOrders]);

  // 当前显示的预警
  const currentWarnings = warningType === 'material' ? materialWarnings : 
                          warningType === 'product' ? productWarnings : deliveryWarnings;
  const filtered = levelFilter === 'all' ? currentWarnings : currentWarnings.filter(w => w.level === levelFilter);

  const levelColors = { RED: '#ef4444', ORANGE: '#f97316', YELLOW: '#eab308' };
  const levelTexts = { RED: '红色预警', ORANGE: '橙色预警', YELLOW: '黄色预警' };
  const statusTexts = { pending: '待处理', processing: '处理中', shipped: '已发货' };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>库存与交期预警</h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>监控库存不足和订单交期风险</p>
      </div>

      {/* 预警类型统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ cursor: 'pointer', border: warningType === 'material' ? '2px solid #3b82f6' : '2px solid transparent', transition: 'all 0.2s' }}
          onClick={() => { setWarningType('material'); setLevelFilter('all'); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={24} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{materialWarnings.length}</div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>物料库存预警</div>
            </div>
          </div>
        </Card>
        <Card style={{ cursor: 'pointer', border: warningType === 'product' ? '2px solid #10b981' : '2px solid transparent', transition: 'all 0.2s' }}
          onClick={() => { setWarningType('product'); setLevelFilter('all'); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{productWarnings.length}</div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>产品库存预警</div>
            </div>
          </div>
        </Card>
        <Card style={{ cursor: 'pointer', border: warningType === 'delivery' ? '2px solid #f59e0b' : '2px solid transparent', transition: 'all 0.2s' }}
          onClick={() => { setWarningType('delivery'); setLevelFilter('all'); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{deliveryWarnings.length}</div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>交期预警</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 级别筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginRight: '8px' }}>
            {warningType === 'material' ? '物料库存预警' : warningType === 'product' ? '产品库存预警' : '订单交期预警'}：
          </span>
          {['all', 'RED', 'ORANGE', 'YELLOW'].map(level => (
            <button key={level} onClick={() => setLevelFilter(level)} style={{ 
              padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: levelFilter === level ? (level === 'all' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : levelColors[level]) : '#f1f5f9', 
              color: levelFilter === level ? '#fff' : '#374151' 
            }}>
              {level === 'all' ? `全部 (${currentWarnings.length})` : `${levelTexts[level]} (${currentWarnings.filter(w => w.level === level).length})`}
            </button>
          ))}
        </div>
      </Card>

      {/* 预警列表 */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>加载中...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CheckCircle} title="暂无预警" description={`当前没有${warningType === 'material' ? '物料库存' : warningType === 'product' ? '产品库存' : '交期'}预警`} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* 物料库存预警表格 */}
            {warningType === 'material' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>级别</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>物料</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>当前库存</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>安全库存</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>缺口</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>采购员</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: levelColors[w.level] }} />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{w.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{w.code}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{w.stockQty.toLocaleString()}</td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>{w.safetyStock.toLocaleString()}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>-{w.shortage.toLocaleString()}</td>
                      <td style={{ padding: '16px', color: '#374151', fontWeight: 500 }}>{w.buyer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 产品库存预警表格 */}
            {warningType === 'product' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>级别</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>产品</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>当前库存</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>安全库存</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>缺口</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>仓库</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: levelColors[w.level] }} />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{w.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{w.code}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{w.stockQty.toLocaleString()}</td>
                      <td style={{ padding: '16px', textAlign: 'right', color: '#64748b' }}>{w.safetyStock.toLocaleString()}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>-{w.shortage.toLocaleString()}</td>
                      <td style={{ padding: '16px', color: '#374151', fontWeight: 500 }}>{w.warehouse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 交期预警表格 */}
            {warningType === 'delivery' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>级别</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>订单号</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>客户</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>交期</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>剩余天数</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>订单金额</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: levelColors[w.level] }} />
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>{w.orderNo}</td>
                      <td style={{ padding: '16px', color: '#374151' }}>{w.customer}</td>
                      <td style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>{formatDate(w.deliveryDate)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                          background: w.daysUntil < 0 ? '#fef2f2' : w.daysUntil <= 2 ? '#fffbeb' : '#fefce8',
                          color: w.daysUntil < 0 ? '#dc2626' : w.daysUntil <= 2 ? '#d97706' : '#ca8a04'
                        }}>
                          {w.daysUntil < 0 ? `已逾期 ${Math.abs(w.daysUntil)} 天` : w.daysUntil === 0 ? '今天到期' : `${w.daysUntil} 天`}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#f0fdf4', color: '#16a34a' }}>
                          {statusTexts[w.status] || w.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>¥{w.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
});

// ============ 业务订单管理页面 ============
const SalesOrderManagementPage = memo(() => {
  const { request } = useApi();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    customerId: '', orderDate: '', deliveryDate: '', salesPerson: '', status: 'pending', remark: '', lines: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      request('/api/sales-orders'),
      request('/api/customers'),
      request('/api/products')
    ]);
    if (ordersRes.success) setOrders(ordersRes.data?.list || ordersRes.data || []);
    if (customersRes.success) setCustomers(customersRes.data?.list || customersRes.data || []);
    if (productsRes.success) setProducts(productsRes.data?.list || productsRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 保存订单（创建或更新）
  const handleSubmit = async () => {
    // 格式化日期
    const formatDateForApi = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    };

    const submitData = {
      customerId: formData.customerId,
      orderDate: formatDateForApi(formData.orderDate),
      deliveryDate: formatDateForApi(formData.deliveryDate),
      salesPerson: formData.salesPerson || '',
      status: formData.status || 'pending',
      remark: formData.remark || '',
      lines: formData.lines || []
    };

    const endpoint = editingOrder ? `/api/sales-orders/${editingOrder.id}` : '/api/sales-orders';
    const method = editingOrder ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(submitData) });
    if (res.success) { setShowModal(false); fetchData(); }
    else alert(res.message || '操作失败');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该订单吗？')) return;
    const res = await request(`/api/sales-orders/${id}`, { method: 'DELETE' });
    if (res.success) fetchData();
    else alert(res.message || '删除失败');
  };

  // 状态流转 - 只更新状态字段
  const handleStatusChange = async (order, newStatus) => {
    // 格式化日期
    const formatDateForApi = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    };

    // 构建更新数据，保持原有字段不变，只改状态
    const updateData = {
      customerId: order.customerId || order.customer_id,
      orderDate: formatDateForApi(order.orderDate || order.order_date),
      deliveryDate: formatDateForApi(order.deliveryDate || order.delivery_date),
      salesPerson: order.salesPerson || order.sales_person || '',
      status: newStatus,
      remark: order.remark || '',
      lines: order.lines || []
    };

    console.log('更新订单状态:', { id: order.id, newStatus, updateData });

    const res = await request(`/api/sales-orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    if (res.success) {
      fetchData();
    } else {
      console.error('状态更新失败:', res);
      alert(res.message || '状态更新失败');
    }
  };

  const openModal = (order = null) => {
    setEditingOrder(order);
    if (order) {
      setFormData({
        customerId: order.customerId || order.customer_id, 
        orderDate: formatDateInput(order.orderDate || order.order_date), 
        deliveryDate: formatDateInput(order.deliveryDate || order.delivery_date),
        salesPerson: order.salesPerson || order.sales_person || '', 
        status: order.status || 'pending', 
        remark: order.remark || '', 
        lines: order.lines || []
      });
    } else {
      setFormData({ 
        customerId: '', 
        orderDate: new Date().toISOString().split('T')[0], 
        deliveryDate: '', 
        salesPerson: '', 
        status: 'pending', 
        remark: '', 
        lines: [] 
      });
    }
    setShowModal(true);
  };

  const addLine = () => {
    setFormData({ ...formData, lines: [...formData.lines, { productId: '', quantity: 1, unitPrice: 0 }] });
  };

  const updateLine = (idx, field, value) => {
    const newLines = [...formData.lines];
    newLines[idx][field] = value;
    setFormData({ ...formData, lines: newLines });
  };

  const removeLine = (idx) => {
    setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== idx) });
  };

  // 过滤
  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (keyword && !o.orderNo?.includes(keyword) && !o.customerName?.includes(keyword)) return false;
    return true;
  });

  const getProductOptions = () => products.map(p => ({
    value: p.id || p.productId || p.productCode,
    label: p.name || p.productName || `${p.productCode} - ${p.name}`
  }));

  const getCustomerOptions = () => customers.map(c => ({
    value: c.id || c.customerId,
    label: c.name || c.customerName
  }));

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>业务订单管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理销售订单和状态流转</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>新增订单</Button>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="搜索订单号或客户..." value={keyword} onChange={(e) => setKeyword(e.target.value)} 
              style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'completed'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} style={{
                padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                background: statusFilter === status ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9',
                color: statusFilter === status ? '#fff' : '#374151'
              }}>
                {status === 'all' ? '全部' : SO_STATUS[status]?.text}
              </button>
            ))}
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>刷新</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="暂无订单" description="点击新增订单按钮添加" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>订单号</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>客户</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>下单日期</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>交付日期</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>业务员</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const statusInfo = SO_STATUS[order.status];
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.orderNo}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.customerName}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{formatDate(order.orderDate)}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{formatDate(order.deliveryDate)}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.salesPerson || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}><StatusTag status={order.status} statusMap={SO_STATUS} /></td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* 状态流转按钮 */}
                          {statusInfo?.next && (
                            <Button size="sm" variant="success" icon={ArrowRight} onClick={() => handleStatusChange(order, statusInfo.next)}>
                              {SO_STATUS[statusInfo.next]?.text}
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(order)}>编辑</Button>
                          {order.status === 'pending' && (
                            <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(order.id)}>删除</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOrder ? '编辑订单' : '新增订单'} size="large">
        {/* 订单号显示 - 编辑时显示原订单号 */}
        {editingOrder && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>订单号</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{editingOrder.orderNo || editingOrder.order_no}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select label="客户" value={formData.customerId} onChange={v => setFormData({ ...formData, customerId: v })} required options={getCustomerOptions()} />
          <Input label="业务员" value={formData.salesPerson} onChange={v => setFormData({ ...formData, salesPerson: v })} />
          <Input label="下单日期" type="date" value={formData.orderDate} onChange={v => setFormData({ ...formData, orderDate: v })} required />
          <Input label="交付日期" type="date" value={formData.deliveryDate} onChange={v => setFormData({ ...formData, deliveryDate: v })} required />
        </div>
        
        {/* 状态选择 */}
        <Select label="订单状态" value={formData.status} onChange={v => setFormData({ ...formData, status: v })} 
          options={Object.entries(SO_STATUS).map(([k, v]) => ({ value: k, label: v.text }))} />

        {/* 状态流转说明 */}
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>状态流转说明</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#374151', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 8px', background: SO_STATUS.pending.bgColor, color: SO_STATUS.pending.color, borderRadius: '4px' }}>待处理</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: SO_STATUS.confirmed.bgColor, color: SO_STATUS.confirmed.color, borderRadius: '4px' }}>已确认</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: SO_STATUS.processing.bgColor, color: SO_STATUS.processing.color, borderRadius: '4px' }}>处理中</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: SO_STATUS.shipped.bgColor, color: SO_STATUS.shipped.color, borderRadius: '4px' }}>已发货</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: SO_STATUS.completed.bgColor, color: SO_STATUS.completed.color, borderRadius: '4px' }}>已完成</span>
          </div>
        </div>
        
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>订单明细</h4>
            <Button size="sm" variant="secondary" icon={Plus} onClick={addLine}>添加产品</Button>
          </div>
          
          {formData.lines.length === 0 ? (
            <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>暂无产品，请点击添加</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.lines.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ flex: 2 }}>
                    <Select label="产品" value={line.productId} onChange={v => updateLine(idx, 'productId', v)} options={getProductOptions()} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input label="数量" type="number" value={line.quantity} onChange={v => updateLine(idx, 'quantity', parseInt(v) || 0)} />
                  </div>
                  <Button variant="danger" icon={Trash2} onClick={() => removeLine(idx)} style={{ marginBottom: '16px' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

// ============ 采购订单管理页面 ============
const PurchaseOrderManagementPage = memo(() => {
  const { request } = useApi();
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    poNo: '', materialId: '', supplierId: '', quantity: 0, unitPrice: 0, orderDate: '', expectedDate: '', status: 'draft', remark: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, materialsRes, suppliersRes] = await Promise.all([
      request('/api/purchase-orders'),
      request('/api/materials'),
      request('/api/suppliers')
    ]);
    if (ordersRes.success) setOrders(ordersRes.data?.list || ordersRes.data || []);
    if (materialsRes.success) setMaterials(materialsRes.data?.list || materialsRes.data || []);
    if (suppliersRes.success) setSuppliers(suppliersRes.data?.list || suppliersRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 生成采购单号
  const generatePoNo = () => {
    const today = new Date();
    const prefix = `PO${today.getFullYear()}-`;
    const seq = String(Math.floor(Math.random() * 10000)).padStart(3, '0');
    return prefix + seq;
  };

  const handleSubmit = async () => {
    const submitData = {
      ...formData,
      poNo: formData.poNo || generatePoNo(),  // 新增时自动生成单号
      totalAmount: formData.quantity * formData.unitPrice
    };
    const endpoint = editingOrder ? `/api/purchase-orders/${editingOrder.id}` : '/api/purchase-orders';
    const method = editingOrder ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(submitData) });
    if (res.success) { setShowModal(false); fetchData(); }
    else alert(res.message || '操作失败');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该采购订单吗？')) return;
    const res = await request(`/api/purchase-orders/${id}`, { method: 'DELETE' });
    if (res.success) fetchData();
    else alert(res.message || '删除失败');
  };

  // 修改状态 - 直接用 PUT 更新整个订单
  const handleStatusChange = async (order, newStatus) => {
    // 格式化日期函数
    const formatDateForApi = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    };
    
    const res = await request(`/api/purchase-orders/${order.id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ 
        poNo: order.poNo,
        materialId: order.materialId,
        supplierId: order.supplierId,
        quantity: order.quantity,
        unitPrice: order.unitPrice || 0,
        orderDate: formatDateForApi(order.orderDate),
        expectedDate: formatDateForApi(order.expectedDate),
        actualDate: newStatus === 'arrived' ? new Date().toISOString().split('T')[0] : (order.actualDate ? formatDateForApi(order.actualDate) : null),
        totalAmount: order.totalAmount || (order.quantity * (order.unitPrice || 0)),
        remark: order.remark || '',
        status: newStatus 
      }) 
    });
    if (res.success) fetchData();
    else alert(res.message || '状态更新失败');
  };

  const openModal = (order = null) => {
    setEditingOrder(order);
    if (order) {
      setFormData({
        poNo: order.poNo,  // 保存原采购单号
        materialId: order.materialId, supplierId: order.supplierId, quantity: order.quantity, unitPrice: order.unitPrice || 0,
        orderDate: formatDateInput(order.orderDate), expectedDate: formatDateInput(order.expectedDate), 
        status: order.status || 'draft', remark: order.remark || ''
      });
    } else {
      // 新增时自动生成单号
      const today = new Date();
      const prefix = `PO${today.getFullYear()}-`;
      const seq = String(Math.floor(Math.random() * 10000)).padStart(3, '0');
      setFormData({ poNo: prefix + seq, materialId: '', supplierId: '', quantity: 0, unitPrice: 0, orderDate: new Date().toISOString().split('T')[0], expectedDate: '', status: 'draft', remark: '' });
    }
    setShowModal(true);
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (keyword && !o.poNo?.includes(keyword) && !o.materialName?.includes(keyword)) return false;
    return true;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>采购订单管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理采购订单和状态流转</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>新增采购单</Button>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="搜索采购单号或物料..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'draft', 'confirmed', 'producing', 'shipped', 'arrived'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', background: statusFilter === status ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9', color: statusFilter === status ? '#fff' : '#64748b', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                {status === 'all' ? '全部' : PO_STATUS[status]?.text}
              </button>
            ))}
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>刷新</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="暂无采购订单" description="点击新增采购单按钮添加" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>采购单号</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>物料</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>供应商</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>数量</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>金额</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>预计到货</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const statusInfo = PO_STATUS[order.status];
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.poNo}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.materialName}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{order.supplierName}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{order.quantity?.toLocaleString()}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#10b981', textAlign: 'right' }}>¥{(order.totalAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{formatDate(order.expectedDate)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}><StatusTag status={order.status} statusMap={PO_STATUS} /></td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* 状态流转按钮 - 显示下一个状态 */}
                          {statusInfo?.next && (
                            <Button size="sm" variant="success" icon={ArrowRight} onClick={() => handleStatusChange(order, statusInfo.next)}>
                              {PO_STATUS[statusInfo.next]?.text}
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(order)}>编辑</Button>
                          {order.status === 'draft' && (
                            <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(order.id)}>删除</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOrder ? '编辑采购单' : '新增采购单'}>
        {/* 采购单号 - 编辑时只读显示 */}
        {editingOrder && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>采购单号</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{formData.poNo}</div>
          </div>
        )}
        <Select label="物料" value={formData.materialId} onChange={v => setFormData({ ...formData, materialId: v })} required options={materials.map(m => ({ value: m.id, label: `${m.materialCode} - ${m.name}` }))} />
        <Select label="供应商" value={formData.supplierId} onChange={v => setFormData({ ...formData, supplierId: v })} required options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="数量" type="number" value={formData.quantity} onChange={v => setFormData({ ...formData, quantity: parseInt(v) || 0 })} required />
          <Input label="单价" type="number" value={formData.unitPrice} onChange={v => setFormData({ ...formData, unitPrice: parseFloat(v) || 0 })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="下单日期" type="date" value={formData.orderDate} onChange={v => setFormData({ ...formData, orderDate: v })} required />
          <Input label="预计到货日期" type="date" value={formData.expectedDate} onChange={v => setFormData({ ...formData, expectedDate: v })} required />
        </div>
        
        {/* 状态选择 - 编辑时可以修改状态 */}
        <Select 
          label="订单状态" 
          value={formData.status} 
          onChange={v => setFormData({ ...formData, status: v })} 
          options={Object.entries(PO_STATUS).map(([key, val]) => ({ value: key, label: val.text }))} 
        />
        
        <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>订单金额</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>¥{(formData.quantity * formData.unitPrice).toLocaleString()}</div>
        </div>
        
        {/* 状态流转说明 */}
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>状态流转说明</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#374151', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 8px', background: PO_STATUS.draft.bgColor, color: PO_STATUS.draft.color, borderRadius: '4px' }}>草稿</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: PO_STATUS.confirmed.bgColor, color: PO_STATUS.confirmed.color, borderRadius: '4px' }}>已确认</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: PO_STATUS.producing.bgColor, color: PO_STATUS.producing.color, borderRadius: '4px' }}>生产中</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: PO_STATUS.shipped.bgColor, color: PO_STATUS.shipped.color, borderRadius: '4px' }}>已发货</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: PO_STATUS.arrived.bgColor, color: PO_STATUS.arrived.color, borderRadius: '4px' }}>已到货</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

// ============ 用户管理页面 ============
const UserManagementPage = memo(() => {
  const { request } = useApi();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', realName: '', email: '', phone: '', roleId: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([request('/api/users'), request('/api/roles')]);
    if (usersRes.success) setUsers(usersRes.data?.list || []);
    if (rolesRes.success) setRoles(rolesRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const endpoint = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) { setShowModal(false); fetchData(); }
    else alert(res.message || '操作失败');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该用户吗？')) return;
    const res = await request(`/api/users/${id}`, { method: 'DELETE' });
    if (res.success) fetchData();
    else alert(res.message || '删除失败');
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('请输入新密码（至少6位）：');
    if (!newPassword || newPassword.length < 6) { alert('密码至少6位'); return; }
    const res = await request(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
    if (res.success) alert('密码重置成功');
    else alert(res.message || '重置失败');
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    setFormData(user ? { username: user.username, realName: user.realName || '', email: user.email || '', phone: user.phone || '', roleId: user.roleId, password: '' } : { username: '', password: '', realName: '', email: '', phone: '', roleId: roles[0]?.id || '' });
    setShowModal(true);
  };

  const getRoleName = (roleId) => roles.find(r => r.id === roleId)?.role_name || '-';

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>用户管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理系统用户账号和权限</p>
        </div>
        <Button icon={UserPlus} onClick={() => openModal()}>新增用户</Button>
      </div>

      <Card>
        {users.length === 0 ? (
          <EmptyState icon={Users} title="暂无用户" description="点击新增用户按钮添加" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>用户名</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>姓名</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>邮箱</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>角色</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{user.username}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{user.realName || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{user.email || '-'}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: '#eff6ff', color: '#3b82f6' }}>{getRoleName(user.roleId)}</span></td>
                    <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: user.isActive ? '#dcfce7' : '#fee2e2', color: user.isActive ? '#16a34a' : '#dc2626' }}>{user.isActive ? '启用' : '停用'}</span></td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(user)}>编辑</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleResetPassword(user.id)}>重置密码</Button>
                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(user.id)}>删除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? '编辑用户' : '新增用户'}>
        <Input label="用户名" value={formData.username} onChange={v => setFormData({ ...formData, username: v })} required disabled={!!editingUser} />
        {!editingUser && <Input label="密码" type="password" value={formData.password} onChange={v => setFormData({ ...formData, password: v })} required />}
        <Input label="姓名" value={formData.realName} onChange={v => setFormData({ ...formData, realName: v })} />
        <Input label="邮箱" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
        <Input label="电话" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} />
        <Select label="角色" value={formData.roleId} onChange={v => setFormData({ ...formData, roleId: v })} required options={roles.map(r => ({ value: r.id, label: r.role_name }))} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

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
const ProductManagementPage = memo(() => (
  <CrudManagementPage title="产品管理" subtitle="管理产品信息和BOM" apiEndpoint="/api/products" icon={Package}
    columns={[
      { key: 'productCode', title: '产品编码', render: (v) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{v}</span> },
      { key: 'name', title: '产品名称' },
      { key: 'category', title: '类别' },
      { key: 'unit', title: '单位', align: 'center' },
      { key: 'status', title: '状态', align: 'center', render: (v) => <span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: v === 'active' ? '#dcfce7' : '#fee2e2', color: v === 'active' ? '#16a34a' : '#dc2626' }}>{v === 'active' ? '启用' : '停用'}</span> },
    ]}
    formFields={[
      { key: 'productCode', label: '产品编码', required: true },
      { key: 'name', label: '产品名称', required: true },
      { key: 'category', label: '类别' },
      { key: 'unit', label: '单位', defaultValue: 'PCS' },
      { key: 'status', label: '状态', type: 'select', defaultValue: 'active', options: [
        { value: 'active', label: '启用' },
        { value: 'inactive', label: '停用' }
      ]},
    ]}
  />
));

const MaterialManagementPage = memo(() => (
  <CrudManagementPage title="物料管理" subtitle="管理物料主数据" apiEndpoint="/api/materials" icon={Layers}
    columns={[
      { key: 'materialCode', title: '物料编码', render: (v) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{v}</span> },
      { key: 'name', title: '物料名称' },
      { key: 'spec', title: '规格' },
      { key: 'unit', title: '单位', align: 'center' },
      { key: 'safeStock', title: '安全库存', align: 'center' },
      { key: 'buyer', title: '采购员' },
    ]}
    formFields={[
      { key: 'materialCode', label: '物料编码', required: true },
      { key: 'name', label: '物料名称', required: true },
      { key: 'spec', label: '规格' },
      { key: 'unit', label: '单位', defaultValue: 'PCS' },
      { key: 'safeStock', label: '安全库存', type: 'number', defaultValue: 0 },
      { key: 'leadTime', label: '采购周期(天)', type: 'number', defaultValue: 7 },
      { key: 'buyer', label: '采购员' },
    ]}
  />
));

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

// ============ 仓库管理页面（带库存管理） ============
const WarehouseManagementPage = memo(() => {
  const { request } = useApi();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [inventory, setInventory] = useState({ materials: [], products: [] });
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [inventoryForm, setInventoryForm] = useState({ quantity: 0, safetyStock: 0 });
  const [inventoryTab, setInventoryTab] = useState('materials'); // 'materials' | 'products'
  const [formData, setFormData] = useState({
    warehouseCode: '', name: '', location: '', capacity: 0, manager: ''
  });

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    const res = await request('/api/warehouses');
    if (res.success) setWarehouses(res.data?.list || res.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  // 获取仓库库存 - 适配现有后端
  const fetchInventory = async (warehouseId) => {
    setInventoryLoading(true);
    let materials = [];
    let products = [];
    
    try {
      // 尝试使用 /api/inventory 接口
      const materialsRes = await request(`/api/inventory?warehouseId=${warehouseId}&type=material`);
      if (materialsRes.success) {
        materials = materialsRes.data?.list || materialsRes.data || [];
      }
    } catch (e) {
      console.log('inventory API不可用，尝试从materials获取');
    }

    // 如果inventory接口不可用，尝试从materials获取
    if (materials.length === 0) {
      try {
        const materialsRes = await request('/api/materials');
        if (materialsRes.success) {
          const matList = materialsRes.data?.list || materialsRes.data || [];
          // 转换格式，只显示该仓库的物料（如果有仓库字段），否则显示所有
          materials = matList.map(m => ({
            id: m.id,
            materialId: m.id,
            materialCode: m.materialCode || m.material_code,
            materialName: m.name || m.materialName,
            quantity: m.currentStock || m.current_stock || m.inventory || 0,
            safetyStock: m.safetyStock || m.safety_stock || 0,
            unit: m.unit,
            warehouseId: warehouseId
          }));
        }
      } catch (e) {
        console.error('获取物料失败:', e);
      }
    }

    // 尝试获取产品库存
    try {
      const productsRes = await request(`/api/inventory?warehouseId=${warehouseId}&type=product`);
      if (productsRes.success) {
        products = productsRes.data?.list || productsRes.data || [];
      }
    } catch (e) {
      console.log('产品库存API不可用');
    }

    // 如果产品库存API不可用，从products获取基本信息
    if (products.length === 0) {
      try {
        const productsRes = await request('/api/products');
        if (productsRes.success) {
          const prodList = productsRes.data?.list || productsRes.data || [];
          // 转换格式
          products = prodList.map(p => ({
            id: p.id,
            productId: p.id,
            productCode: p.productCode || p.product_code,
            productName: p.name || p.productName,
            quantity: p.stock || p.inventory || 0,
            safetyStock: p.safetyStock || p.safety_stock || 100,
            unit: p.unit || '件',
            warehouseId: warehouseId
          }));
        }
      } catch (e) {
        console.error('获取产品失败:', e);
      }
    }

    setInventory({ materials, products });
    setInventoryLoading(false);
  };

  // 打开仓库编辑
  const openWarehouseModal = (warehouse = null) => {
    setEditingWarehouse(warehouse);
    if (warehouse) {
      setFormData({
        warehouseCode: warehouse.warehouseCode || warehouse.warehouse_code || '',
        name: warehouse.name || '',
        location: warehouse.location || '',
        capacity: warehouse.capacity || 0,
        manager: warehouse.manager || ''
      });
    } else {
      setFormData({ warehouseCode: '', name: '', location: '', capacity: 0, manager: '' });
    }
    setShowModal(true);
  };

  // 打开库存详情
  const openInventoryModal = async (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowInventoryModal(true);
    await fetchInventory(warehouse.id);
  };

  // 保存仓库
  const handleSaveWarehouse = async () => {
    const endpoint = editingWarehouse ? `/api/warehouses/${editingWarehouse.id}` : '/api/warehouses';
    const method = editingWarehouse ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) {
      setShowModal(false);
      fetchWarehouses();
    } else {
      alert(res.message || '保存失败');
    }
  };

  // 删除仓库
  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm('确定要删除该仓库吗？')) return;
    const res = await request(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (res.success) fetchWarehouses();
    else alert(res.message || '删除失败');
  };

  // 编辑库存
  const openEditInventory = (item, type) => {
    setEditingInventory({ ...item, type });
    setInventoryForm({
      quantity: item.quantity || 0,
      safetyStock: item.safetyStock || item.safety_stock || 0
    });
  };

  // 保存库存 - 适配现有后端
  const handleSaveInventory = async () => {
    if (!editingInventory) return;
    
    let success = false;
    let errorMsg = '';

    // 尝试方案1：使用 /api/inventory/:id
    try {
      const res = await request(`/api/inventory/${editingInventory.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: inventoryForm.quantity,
          safetyStock: inventoryForm.safetyStock,
          type: editingInventory.type
        })
      });
      if (res.success) {
        success = true;
      } else {
        errorMsg = res.message;
      }
    } catch (e) {
      console.log('inventory API不可用，尝试materials API');
    }

    // 尝试方案2：如果是物料，使用 /api/materials/:id/inventory
    if (!success && editingInventory.type === 'material' && editingInventory.materialId) {
      try {
        const res = await request(`/api/materials/${editingInventory.materialId}/inventory`, {
          method: 'PUT',
          body: JSON.stringify({
            currentStock: inventoryForm.quantity,
            safetyStock: inventoryForm.safetyStock
          })
        });
        if (res.success) {
          success = true;
        } else {
          errorMsg = res.message || errorMsg;
        }
      } catch (e) {
        console.log('materials/inventory API也不可用');
      }
    }

    // 尝试方案3：直接更新物料
    if (!success && editingInventory.type === 'material' && editingInventory.materialId) {
      try {
        const res = await request(`/api/materials/${editingInventory.materialId}`, {
          method: 'PUT',
          body: JSON.stringify({
            currentStock: inventoryForm.quantity,
            safetyStock: inventoryForm.safetyStock
          })
        });
        if (res.success) {
          success = true;
        } else {
          errorMsg = res.message || errorMsg;
        }
      } catch (e) {
        errorMsg = '更新失败';
      }
    }

    if (success) {
      setEditingInventory(null);
      fetchInventory(selectedWarehouse.id);
    } else {
      alert(errorMsg || '保存失败，库存API可能不可用');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>仓库管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理仓库信息和库存</p>
        </div>
        <Button icon={Plus} onClick={() => openWarehouseModal()}>新增仓库</Button>
      </div>

      {/* 仓库卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {warehouses.length === 0 ? (
          <Card><EmptyState icon={Warehouse} title="暂无仓库" description="点击新增仓库按钮添加" /></Card>
        ) : (
          warehouses.map(wh => (
            <Card key={wh.id} style={{ cursor: 'pointer', transition: 'all 0.2s', border: '2px solid transparent' }}
              onClick={() => openInventoryModal(wh)}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Warehouse size={28} style={{ color: '#fff' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openWarehouseModal(wh)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                    <Edit size={16} style={{ color: '#64748b' }} />
                  </button>
                  <button onClick={() => handleDeleteWarehouse(wh.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer' }}>
                    <Trash2 size={16} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{wh.warehouseCode || wh.warehouse_code}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{wh.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: '#64748b' }}>位置：</span><span style={{ color: '#374151', fontWeight: 500 }}>{wh.location || '-'}</span></div>
                <div><span style={{ color: '#64748b' }}>容量：</span><span style={{ color: '#374151', fontWeight: 500 }}>{wh.capacity || '-'}</span></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>管理员：</span><span style={{ color: '#374151', fontWeight: 500 }}>{wh.manager || '-'}</span></div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '13px', fontWeight: 600 }}>
                <Eye size={16} /> 点击查看库存详情
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 仓库编辑模态框 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingWarehouse ? '编辑仓库' : '新增仓库'}>
        <Input label="仓库编码" value={formData.warehouseCode} onChange={v => setFormData({ ...formData, warehouseCode: v })} required />
        <Input label="仓库名称" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
        <Input label="位置" value={formData.location} onChange={v => setFormData({ ...formData, location: v })} />
        <Input label="容量" type="number" value={formData.capacity} onChange={v => setFormData({ ...formData, capacity: parseInt(v) || 0 })} />
        <Input label="管理员" value={formData.manager} onChange={v => setFormData({ ...formData, manager: v })} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSaveWarehouse}>保存</Button>
        </div>
      </Modal>

      {/* 库存详情模态框 */}
      <Modal isOpen={showInventoryModal} onClose={() => { setShowInventoryModal(false); setEditingInventory(null); }} 
        title={selectedWarehouse ? `${selectedWarehouse.name} - 库存管理` : '库存管理'} size="large">
        
        {/* 选项卡 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
          <button onClick={() => setInventoryTab('materials')} style={{
            padding: '10px 20px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
            background: inventoryTab === 'materials' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9',
            color: inventoryTab === 'materials' ? '#fff' : '#64748b'
          }}>
            <Box size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            物料库存 ({inventory.materials.length})
          </button>
          <button onClick={() => setInventoryTab('products')} style={{
            padding: '10px 20px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
            background: inventoryTab === 'products' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
            color: inventoryTab === 'products' ? '#fff' : '#64748b'
          }}>
            <Package size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            产品库存 ({inventory.products.length})
          </button>
        </div>

        {inventoryLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>加载中...</div>
        ) : (
          <>
            {/* 物料库存表格 */}
            {inventoryTab === 'materials' && (
              inventory.materials.length === 0 ? (
                <EmptyState icon={Box} title="暂无物料库存" description="该仓库还没有物料库存记录" />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>物料编码</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>物料名称</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>当前库存</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>安全库存</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.materials.map(item => {
                        const isLow = item.quantity < (item.safetyStock || item.safety_stock || 0);
                        const isCritical = item.quantity < (item.safetyStock || item.safety_stock || 0) * 0.5;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.materialCode || item.material_code}</td>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{item.materialName || item.material_name}</td>
                            <td style={{ padding: '12px', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: isCritical ? '#dc2626' : isLow ? '#f59e0b' : '#10b981' }}>
                              {item.quantity?.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#64748b' }}>
                              {(item.safetyStock || item.safety_stock || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                background: isCritical ? '#fef2f2' : isLow ? '#fffbeb' : '#f0fdf4',
                                color: isCritical ? '#dc2626' : isLow ? '#d97706' : '#16a34a'
                              }}>
                                {isCritical ? '严重不足' : isLow ? '库存不足' : '正常'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <Button size="sm" variant="secondary" icon={Edit} onClick={() => openEditInventory(item, 'material')}>编辑</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 产品库存表格 */}
            {inventoryTab === 'products' && (
              inventory.products.length === 0 ? (
                <EmptyState icon={Package} title="暂无产品库存" description="该仓库还没有产品库存记录" />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>产品编码</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>产品名称</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>当前库存</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>安全库存</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.products.map(item => {
                        const isLow = item.quantity < (item.safetyStock || item.safety_stock || 0);
                        const isCritical = item.quantity < (item.safetyStock || item.safety_stock || 0) * 0.5;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.productCode || item.product_code}</td>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{item.productName || item.product_name}</td>
                            <td style={{ padding: '12px', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: isCritical ? '#dc2626' : isLow ? '#f59e0b' : '#10b981' }}>
                              {item.quantity?.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', color: '#64748b' }}>
                              {(item.safetyStock || item.safety_stock || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                background: isCritical ? '#fef2f2' : isLow ? '#fffbeb' : '#f0fdf4',
                                color: isCritical ? '#dc2626' : isLow ? '#d97706' : '#16a34a'
                              }}>
                                {isCritical ? '严重不足' : isLow ? '库存不足' : '正常'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <Button size="sm" variant="secondary" icon={Edit} onClick={() => openEditInventory(item, 'product')}>编辑</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}

        {/* 库存编辑子模态框 */}
        {editingInventory && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700 }}>
                编辑库存 - {editingInventory.materialName || editingInventory.material_name || editingInventory.productName || editingInventory.product_name}
              </h3>
              <Input label="当前库存数量" type="number" value={inventoryForm.quantity} onChange={v => setInventoryForm({ ...inventoryForm, quantity: parseInt(v) || 0 })} />
              <Input label="安全库存" type="number" value={inventoryForm.safetyStock} onChange={v => setInventoryForm({ ...inventoryForm, safetyStock: parseInt(v) || 0 })} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setEditingInventory(null)}>取消</Button>
                <Button icon={Save} onClick={handleSaveInventory}>保存</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});

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
      case 'users': return <UserManagementPage />;
      case 'products': return <ProductManagementPage />;
      case 'materials': return <MaterialManagementPage />;
      case 'suppliers': return <SupplierManagementPage />;
      case 'warehouses': return <WarehouseManagementPage />;
      case 'orders': return <SalesOrderManagementPage />;
      case 'purchase-orders': return <PurchaseOrderManagementPage />;
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