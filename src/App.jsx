import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AlertCircle, Package, TrendingUp, TrendingDown, ChevronLeft, CheckCircle, AlertTriangle, XCircle, Clock, Factory, Users, Calendar, Box, Truck, AlertOctagon, Filter, ChevronRight, Layers, ShoppingCart } from 'lucide-react';

// ============ API 配置 ============
const BASE_URL = 'https://supply-backend-g3gm.onrender.com';

// ============ 工具函数 ============
const TODAY = new Date();
const daysDiff = (d1, d2) => Math.round((new Date(d1) - new Date(d2)) / 86400000);

const RISK = {
  ongoing: { color: '#10b981', text: '正常', icon: CheckCircle, priority: 1 },
  warning: { color: '#f59e0b', text: '预警', icon: AlertTriangle, priority: 2 },
  urgent: { color: '#f97316', text: '紧急', icon: AlertOctagon, priority: 3 },
  overdue: { color: '#ef4444', text: '延期', icon: XCircle, priority: 4 },
  pending: { color: '#8b5cf6', text: '待采购', icon: Clock, priority: 5 },
};

// ============ 风险计算器 ============
function createRiskCalculator(mats, pos, suppliers) {
  const matMap = Object.fromEntries(mats.map(m => [m.code, m]));
  const poByMat = pos.reduce((a, p) => { (a[p.mat] = a[p.mat] || []).push(p); return a; }, {});
  const supplierByMat = suppliers.reduce((a, s) => { (a[s.mat] = a[s.mat] || []).push(s); return a; }, {});

  return function calcRisk(matCode, demand, deliveryDate) {
    const m = matMap[matCode];
    if (!m) return null;
    const available = m.inv + m.transit, gap = Math.max(0, demand - available), gapRate = demand > 0 ? gap / demand : 0;
    const daysLeft = daysDiff(deliveryDate, TODAY);
    const matPOs = poByMat[matCode] || [];
    const latestPO = matPOs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const delay = latestPO ? daysDiff(latestPO.date, deliveryDate) : null;
    const poCoverage = gap > 0 ? Math.min(1, matPOs.reduce((s, p) => s + p.qty, 0) / gap) : 1;
    const mainSupplier = (supplierByMat[matCode] || []).find(s => s.main);
    const singleSource = m.suppliers === 1;
    
    let score = 0;
    if (delay > 0) score += Math.min(30, delay * 3);
    else if (daysLeft < 7 && gap > 0) score += 20;
    else if (daysLeft < 14 && gap > 0) score += 10;
    score += Math.min(30, gapRate * 30);
    if (m.transit === 0 && gap > 0) score += 20;
    else if (poCoverage < 0.5) score += 15;
    else if (poCoverage < 1) score += 8;
    if (singleSource) score += 5;
    if (mainSupplier?.onTime < 0.85) score += 5;
    if (m.inv < m.safe) score += 10;

    let level = 'ongoing';
    if (m.transit === 0 && gap > 0) level = 'pending';
    else if (delay > 0) level = 'overdue';
    else if (score >= 50) level = 'urgent';
    else if (score >= 25) level = 'warning';

    return { ...m, demand: Math.round(demand), available, gap, gapRate, daysLeft, delay, poCoverage, singleSource, onTime: mainSupplier?.onTime || 0, score: Math.round(score), level };
  };
}

const highestRisk = risks => risks.reduce((h, r) => (RISK[r]?.priority || 0) > (RISK[h]?.priority || 0) ? r : h, 'ongoing');

// ============ UI 组件 ============
const Card = ({ children, style = {}, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: '#fff', 
      border: '1px solid #e2e8f0', 
      borderRadius: '12px', 
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s',
      cursor: onClick ? 'pointer' : 'default',
      ...style 
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
    onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
  >
    {children}
  </div>
);

const StatusBadge = ({ level, size = 'md' }) => {
  const r = RISK[level] || RISK.pending;
  const Icon = r.icon;
  const styles = size === 'sm' 
    ? { padding: '4px 8px', fontSize: '11px', gap: 4 }
    : { padding: '6px 12px', fontSize: '13px', gap: 6 };
  
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: styles.gap,
      padding: styles.padding,
      fontSize: styles.fontSize,
      fontWeight: 600, 
      color: r.color, 
      backgroundColor: `${r.color}10`, 
      border: `1px solid ${r.color}30`,
      borderRadius: '50px'
    }}>
      <Icon size={size === 'sm' ? 12 : 14} />
      <span>{r.text}</span>
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, sublabel }) => (
  <Card style={{ flex: 1, minWidth: '200px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
        <Icon size={20} style={{ color: '#475569' }} />
      </div>
    </div>
    <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{value}</div>
    {sublabel && <div style={{ fontSize: '11px', color: '#64748b' }}>{sublabel}</div>}
  </Card>
);

const Button = ({ children, onClick, variant = 'primary', icon: Icon, style = {} }) => {
  const variants = {
    primary: { background: '#3b82f6', color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
    danger: { background: '#ef4444', color: '#fff', border: 'none' },
  };
  
  const [isHover, setIsHover] = useState(false);
  
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 600,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: isHover ? 0.9 : 1,
        ...variants[variant],
        ...style
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
    <div style={{ width: '64px', height: '64px', marginBottom: '16px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={32} style={{ color: '#94a3b8' }} />
    </div>
    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '14px', color: '#64748b' }}>{description}</div>
  </div>
);

const LoadingScreen = () => (
  <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', background: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
        <Factory size={32} style={{ color: '#fff' }} />
      </div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>加载中</div>
      <div style={{ fontSize: '14px', color: '#64748b' }}>正在获取供应链数据...</div>
    </div>
  </div>
);

const ErrorScreen = ({ error, onRetry }) => (
  <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={32} style={{ color: '#ef4444' }} />
      </div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>连接错误</div>
      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>{error}</div>
      <Button onClick={onRetry} variant="primary">重新连接</Button>
    </Card>
  </div>
);

const TableRow = ({ children, onClick }) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <tr 
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{ 
        cursor: 'pointer',
        backgroundColor: isHover ? '#f8fafc' : 'transparent',
        transition: 'background-color 0.2s'
      }}
    >
      {children}
    </tr>
  );
};

// ============ Dashboard 仪表板 ============
const Dashboard = ({ orders, orderLines, products, bom, mats, suppliers, pos, onNav }) => {
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    salesPerson: 'all'
  });

  const data = useMemo(() => {
    const orderData = orders.map(o => {
      const lines = orderLines.filter(l => l.orderId === o.id);
      const risks = [], affected = new Set();
      lines.forEach(l => {
        bom.filter(b => b.p === l.productCode).forEach(b => {
          const r = calcRisk(b.m, b.c * l.qty, o.deliveryDate);
          if (r) { risks.push(r); if (r.level !== 'ongoing') affected.add(r.code); }
        });
      });
      return {
        ...o, 
        products: lines.map(l => l.productName), 
        daysLeft: daysDiff(o.deliveryDate, TODAY),
        level: highestRisk(risks.map(r => r.level)), 
        score: Math.max(0, ...risks.map(r => r.score)),
        affected: affected.size
      };
    });
    return { orders: orderData };
  }, [orders, orderLines, bom, calcRisk]);

  // 产品数据
  const productData = useMemo(() => {
    return products.map(p => {
      const lines = orderLines.filter(l => l.productCode === p.code);
      const relatedOrders = [...new Set(lines.map(l => l.orderId))];
      const totalQty = lines.reduce((s, l) => s + l.qty, 0);
      const bomItems = bom.filter(b => b.p === p.code);
      
      const risks = lines.map(l => {
        const o = orders.find(o => o.id === l.orderId);
        return bomItems.map(b => calcRisk(b.m, b.c * l.qty, o.deliveryDate)).filter(Boolean);
      }).flat();
      
      return {
        ...p,
        orderCount: relatedOrders.length,
        totalQty,
        materialCount: bomItems.length,
        level: highestRisk(risks.map(r => r.level)),
        maxScore: Math.max(0, ...risks.map(r => r.score))
      };
    });
  }, [products, orderLines, bom, orders, calcRisk]);

  // 获取业务员列表
  const salesPeople = useMemo(() => [...new Set(orders.map(o => o.salesPerson).filter(Boolean))], [orders]);

  // 搜索 + 筛选
  const filteredOrders = useMemo(() => {
    let result = data.orders;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(term) || 
        o.customer.toLowerCase().includes(term) ||
        o.products.some(p => p.toLowerCase().includes(term)) ||
        (o.salesPerson && o.salesPerson.toLowerCase().includes(term))
      );
    }
    
    if (filters.status !== 'all') {
      result = result.filter(o => o.level === filters.status);
    }
    
    if (filters.salesPerson !== 'all') {
      result = result.filter(o => o.salesPerson === filters.salesPerson);
    }
    
    return result;
  }, [data.orders, searchTerm, filters]);

  const filteredProducts = useMemo(() => {
    let result = productData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.code.toLowerCase().includes(term) || 
        p.name.toLowerCase().includes(term)
      );
    }
    return result;
  }, [productData, searchTerm]);

  const stats = {
    overdue: data.orders.filter(o => o.level === 'overdue').length,
    urgent: data.orders.filter(o => o.level === 'urgent').length,
    warning: data.orders.filter(o => o.level === 'warning').length,
    total: orders.length,
  };

  const hasActiveFilters = filters.status !== 'all' || filters.salesPerson !== 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 搜索栏 */}
      <Card>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="搜索订单号、客户、产品、业务员..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '300px',
              padding: '10px 16px',
              fontSize: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              清除
            </button>
          )}
        </div>
      </Card>

      {/* 指标卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MetricCard icon={XCircle} label="已延期订单" value={stats.overdue} sublabel="需立即处理" />
        <MetricCard icon={AlertOctagon} label="紧急订单" value={stats.urgent} sublabel="风险分 ≥50" />
        <MetricCard icon={AlertTriangle} label="预警订单" value={stats.warning} sublabel="风险分 ≥25" />
        <MetricCard icon={Package} label="订单总数" value={stats.total} sublabel="系统中活跃订单" />
      </div>

      {/* 标签切换 */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'orders' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'orders' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          订单概览 ({filteredOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'products' ? '#3b82f6' : '#64748b',
            borderBottom: activeTab === 'products' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          产品概览 ({filteredProducts.length})
        </button>
      </div>

      {/* 订单表格 */}
      {activeTab === 'orders' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>订单列表</h2>
            <div style={{ position: 'relative' }}>
              <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(!showFilters)}>
                筛选 {hasActiveFilters && <span style={{ color: '#3b82f6' }}>●</span>}
              </Button>
            </div>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>状态</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">全部状态</option>
                  <option value="overdue">延期</option>
                  <option value="urgent">紧急</option>
                  <option value="warning">预警</option>
                  <option value="ongoing">正常</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>业务员</label>
                <select 
                  value={filters.salesPerson}
                  onChange={(e) => setFilters({...filters, salesPerson: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                >
                  <option value="all">全部业务员</option>
                  {salesPeople.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => setFilters({ status: 'all', salesPerson: 'all' })}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  重置筛选
                </button>
              </div>
            </div>
          )}
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>订单号</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>客户</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>业务员</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>产品</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>交期</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>剩余天数</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>问题数</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <TableRow key={o.id} onClick={() => onNav('order', o.id)}>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{o.id}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{o.customer}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} />
                        {o.salesPerson || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.products.join(', ')}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{o.deliveryDate}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        color: o.daysLeft <= 5 ? '#dc2626' : o.daysLeft <= 10 ? '#ea580c' : o.daysLeft <= 15 ? '#ca8a04' : '#16a34a',
                        backgroundColor: o.daysLeft <= 5 ? '#fef2f2' : o.daysLeft <= 10 ? '#fff7ed' : o.daysLeft <= 15 ? '#fefce8' : '#f0fdf4'
                      }}>
                        <Clock size={12} />
                        {o.daysLeft}天
                      </span>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <StatusBadge level={o.level} size="sm" />
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '50%',
                        color: o.affected > 0 ? '#dc2626' : '#16a34a',
                        backgroundColor: o.affected > 0 ? '#fee2e2' : '#dcfce7'
                      }}>
                        {o.affected}
                      </span>
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 产品表格 */}
      {activeTab === 'products' && (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>产品编码</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>产品名称</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>关联订单</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>总需求量</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>BOM物料</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>风险分</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <TableRow key={p.code} onClick={() => onNav('product', p.code)}>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.code}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '14px', color: '#374151' }}>{p.name}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{p.orderCount}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{p.totalQty.toLocaleString()}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{p.materialCount}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: p.maxScore >= 50 ? '#dc2626' : p.maxScore >= 25 ? '#ea580c' : '#16a34a' }}>
                        {p.maxScore}
                      </div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <StatusBadge level={p.level} size="sm" />
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ============ OrderDetail 订单详情页 ============
const OrderDetail = ({ id, orders, orderLines, bom, mats, suppliers, pos, onNav, onBack }) => {
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  const order = orders.find(o => o.id === id);
  
  if (!order) return <Card><EmptyState icon={XCircle} title="订单不存在" description="未找到该订单信息" /></Card>;
  
  const lines = orderLines.filter(l => l.orderId === id);
  const daysLeft = daysDiff(order.deliveryDate, TODAY);

  const { allRisks, criticals } = useMemo(() => {
    const allRisks = [];
    lines.forEach(l => {
      bom.filter(b => b.p === l.productCode).forEach(b => {
        const r = calcRisk(b.m, b.c * l.qty, order.deliveryDate);
        if (r) allRisks.push({ ...r, productCode: l.productCode, productName: l.productName });
      });
    });
    const criticals = allRisks.filter(r => r.level !== 'ongoing').sort((a, b) => b.score - a.score);
    return { allRisks, criticals };
  }, [order, lines, bom, calcRisk]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button variant="secondary" icon={ChevronLeft} onClick={onBack}>返回</Button>
      
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '4px' }}>销售订单</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{id}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
              <Users size={16} />
              <span>{order.customer}</span>
            </div>
            {order.salesPerson && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#eff6ff', borderRadius: '6px', fontSize: '12px', color: '#2563eb', marginTop: '8px' }}>
                <Users size={12} />
                <span>业务员: {order.salesPerson}</span>
              </div>
            )}
          </div>
          <StatusBadge level={highestRisk(allRisks.map(r => r.level))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          {[
            { label: '下单日期', value: order.orderDate, icon: Calendar },
            { label: '交货日期', value: order.deliveryDate, icon: Truck },
            { label: '剩余天数', value: `${daysLeft} 天`, icon: Clock },
            { label: '产品种类', value: `${lines.length} 种`, icon: Package },
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                <item.icon size={14} />
                <span>{item.label}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {criticals.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
            关键预警物料
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {criticals.slice(0, 6).map((m, i) => (
              <Card key={i} onClick={() => onNav('material', m.code)} style={{ borderLeft: `4px solid ${RISK[m.level].color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{m.code}</div>
                  </div>
                  <StatusBadge level={m.level} size="sm" />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {m.delay > 0 && <span style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', color: '#dc2626', backgroundColor: '#fee2e2' }}>延期 {m.delay}天</span>}
                  {m.gap > 0 && <span style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', color: '#ea580c', backgroundColor: '#ffedd5' }}>缺口 {m.gap.toLocaleString()}</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Box size={12} />
                  <span>用于: {m.productName}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>订单产品</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {lines.map(l => {
            const risks = allRisks.filter(r => r.productCode === l.productCode);
            return (
              <div 
                key={l.productCode}
                onClick={() => onNav('product', l.productCode)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{l.productCode}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{l.productName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>数量</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{l.qty.toLocaleString()}</div>
                  </div>
                  <StatusBadge level={highestRisk(risks.map(r => r.level))} size="sm" />
                  <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ============ ProductDetail 产品详情页 ============
const ProductDetail = ({ code, orders, orderLines, products, bom, mats, suppliers, pos, onNav, onBack }) => {
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  const product = products.find(p => p.code === code);
  
  if (!product) return <Card><EmptyState icon={XCircle} title="产品不存在" description="未找到该产品信息" /></Card>;
  
  const lines = orderLines.filter(l => l.productCode === code);
  const totalDemand = lines.reduce((s, l) => s + l.qty, 0);
  const relatedOrderIds = [...new Set(lines.map(l => l.orderId))];
  const earliest = orders.filter(o => relatedOrderIds.includes(o.id)).sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))[0];

  const relatedOrders = useMemo(() => {
    return lines.map(l => {
      const o = orders.find(o => o.id === l.orderId);
      if (!o) return null;
      const daysLeft = daysDiff(o.deliveryDate, TODAY);
      const bomItems = bom.filter(b => b.p === code);
      const risks = bomItems.map(b => calcRisk(b.m, b.c * l.qty, o.deliveryDate)).filter(Boolean);
      return { 
        ...o, 
        qty: l.qty, 
        daysLeft, 
        level: highestRisk(risks.map(r => r.level)), 
        score: Math.max(0, ...risks.map(r => r.score))
      };
    }).filter(Boolean).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [code, lines, orders, bom, calcRisk]);

  const bomData = useMemo(() => {
    let data = bom.filter(b => b.p === code).map(b => calcRisk(b.m, b.c * totalDemand, earliest?.deliveryDate || '2025-12-31')).filter(Boolean);
    data.sort((a, b) => b.score - a.score);
    return data;
  }, [code, totalDemand, earliest, bom, calcRisk]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button variant="secondary" icon={ChevronLeft} onClick={onBack}>返回</Button>
      
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '4px' }}>产品信息</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{code}</h1>
            <div style={{ fontSize: '16px', color: '#374151' }}>{product.name}</div>
          </div>
          <StatusBadge level={highestRisk(bomData.map(m => m.level))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <MetricCard icon={ShoppingCart} label="关联订单" value={relatedOrderIds.length} />
          <MetricCard icon={TrendingUp} label="总需求量" value={totalDemand.toLocaleString()} />
          <MetricCard icon={Calendar} label="最早交期" value={earliest?.deliveryDate || '-'} />
          <MetricCard icon={Layers} label="BOM物料" value={bomData.length} />
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
          关联订单 ({relatedOrders.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>订单号</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>客户</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>需求数量</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>交货日期</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>剩余天数</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {relatedOrders.map(o => (
                <TableRow key={o.id} onClick={() => onNav('order', o.id)}>
                  <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>{o.id}</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{o.customer}</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{o.qty.toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{o.deliveryDate}</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      color: o.daysLeft <= 5 ? '#dc2626' : o.daysLeft <= 10 ? '#ea580c' : o.daysLeft <= 15 ? '#ca8a04' : '#16a34a',
                      backgroundColor: o.daysLeft <= 5 ? '#fef2f2' : o.daysLeft <= 10 ? '#fff7ed' : o.daysLeft <= 15 ? '#fefce8' : '#f0fdf4'
                    }}>
                      <Clock size={12} />
                      {o.daysLeft}天
                    </span>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <StatusBadge level={o.level} size="sm" />
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>BOM物料清单</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {bomData.map(m => (
            <div 
              key={m.code}
              onClick={() => onNav('material', m.code)}
              style={{ 
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${RISK[m.level].color}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{m.code}</div>
                </div>
                <StatusBadge level={m.level} size="sm" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {[
                  { label: '需求', value: m.demand, color: '#0f172a' },
                  { label: '库存', value: m.inv, color: m.inv < m.safe ? '#dc2626' : '#16a34a' },
                  { label: '在途', value: m.transit, color: '#2563eb' },
                  { label: '缺口', value: m.gap, color: m.gap > 0 ? '#dc2626' : '#16a34a' },
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {m.delay > 0 && <span style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', color: '#dc2626', backgroundColor: '#fee2e2' }}>延期 {m.delay}天</span>}
                {m.singleSource && <span style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', color: '#ca8a04', backgroundColor: '#fef3c7' }}>单一来源</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============ MaterialDetail 物料详情页 ============
const MaterialDetail = ({ code, orders, orderLines, bom, mats, suppliers, pos, onBack }) => {
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  
  const matMap = Object.fromEntries(mats.map(m => [m.code, m]));
  const poByMat = pos.reduce((a, p) => { (a[p.mat] = a[p.mat] || []).push(p); return a; }, {});
  const supplierByMat = suppliers.reduce((a, s) => { (a[s.mat] = a[s.mat] || []).push(s); return a; }, {});

  const mat = matMap[code];
  const matPOs = poByMat[code] || [];
  const matSuppliers = supplierByMat[code] || [];

  const affected = useMemo(() => {
    return orderLines.filter(l => bom.some(b => b.p === l.productCode && b.m === code)).map(l => {
      const o = orders.find(o => o.id === l.orderId);
      const b = bom.find(b => b.p === l.productCode && b.m === code);
      const demand = Math.round(b.c * l.qty);
      const risk = calcRisk(code, demand, o.deliveryDate);
      return { ...o, productName: l.productName, qty: l.qty, demand, daysLeft: daysDiff(o.deliveryDate, TODAY), level: risk?.level || 'ongoing' };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [code, orders, orderLines, bom, calcRisk]);

  const totalDemand = affected.reduce((s, o) => s + o.demand, 0);
  const totalGap = Math.max(0, totalDemand - mat.inv - mat.transit);

  if (!mat) return <Card><EmptyState icon={XCircle} title="物料不存在" description="未找到该物料信息" /></Card>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button variant="secondary" icon={ChevronLeft} onClick={onBack}>返回</Button>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={18} />
            物料信息
          </h3>
          {mat.buyer && (
            <div style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#eff6ff', borderRadius: '6px', fontSize: '12px', color: '#2563eb' }}>
              <Users size={12} />
              <span>采购员: {mat.buyer}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: '物料编码', value: mat.code },
              { label: '物料名称', value: mat.name },
              { label: '规格型号', value: mat.spec },
              { label: '单价', value: `¥${mat.price}/${mat.unit}` },
              { label: '提前期', value: `${mat.lead} 天` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #86efac' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} />
            库存状态
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '11px', color: '#16a34a', marginBottom: '4px' }}>当前库存</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: mat.inv < mat.safe ? '#dc2626' : '#16a34a' }}>
                {mat.inv.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: '安全库存', value: mat.safe, color: '#64748b' },
                { label: '在途数量', value: mat.transit, color: '#2563eb' },
                { label: '总缺口', value: totalGap, color: totalGap > 0 ? '#dc2626' : '#16a34a' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', border: '1px solid #c4b5fd' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Factory size={18} />
            供应商
          </h3>
          {mat.suppliers === 1 && (
            <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#fef3c7', border: '1px solid #fde047', borderRadius: '6px', fontSize: '12px', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} />
              <span>单一来源风险</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matSuppliers.map(s => (
              <div key={s.id} style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{s.name}</span>
                  {s.main && <span style={{ padding: '2px 8px', background: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: 600, borderRadius: '4px' }}>主供</span>}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                  <span style={{ color: s.onTime < 0.85 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                    准时率 {(s.onTime*100).toFixed(0)}%
                  </span>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>质量 {(s.quality*100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>采购订单</h3>
        {matPOs.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="暂无采购订单" description="该物料尚未下单采购" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {matPOs.map(p => {
              const statusConfig = {
                arrived: { bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#16a34a', text: '已到货' },
                shipped: { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#2563eb', text: '已发货' },
                producing: { bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', color: '#ea580c', text: '生产中' },
                confirmed: { bg: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', color: '#64748b', text: '已确认' }
              }[p.status];
              
              return (
                <div key={p.po} style={{ padding: '16px', background: statusConfig.bg, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{p.po}</span>
                    <span style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', color: '#fff', backgroundColor: statusConfig.color }}>
                      {statusConfig.text}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{p.supplier}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>数量</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.qty.toLocaleString()} {mat.unit}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>金额</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>¥{p.amt.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>交期: {p.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>受影响订单</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['订单号', '客户', '产品', '需求量', '交期', '剩余', '状态'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affected.map((o, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>{o.id}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{o.customer}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{o.productName}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{o.demand.toLocaleString()}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{o.deliveryDate}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      color: o.daysLeft <= 5 ? '#dc2626' : o.daysLeft <= 10 ? '#ea580c' : '#16a34a',
                      backgroundColor: o.daysLeft <= 5 ? '#fee2e2' : o.daysLeft <= 10 ? '#ffedd5' : '#dcfce7'
                    }}>
                      {o.daysLeft} 天
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <StatusBadge level={o.level} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ============ WarningsPage 预警页面 ============
const WarningsPage = ({ onBack, mats }) => {
  const [levelFilter, setLevelFilter] = useState('all');
  const [buyerFilter, setBuyerFilter] = useState('all');
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // 创建物料映射，用于获取采购员信息
  const matMap = useMemo(() => Object.fromEntries(mats.map(m => [m.code, m])), [mats]);

  useEffect(() => {
    let cancelled = false;
    const fetchWarnings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}/api/warnings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        const levelOrder = { RED: 1, ORANGE: 2, YELLOW: 3, BLUE: 4 };
        const sorted = [...result].sort((a, b) => {
          const levelDiff = (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
          if (levelDiff !== 0) return levelDiff;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        if (!cancelled) setWarnings(sorted);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchWarnings();
    return () => { cancelled = true; };
  }, []);

  // 获取所有采购员列表
  const buyers = useMemo(() => [...new Set(mats.map(m => m.buyer).filter(Boolean))], [mats]);

  const levelConfig = {
    RED: { color: '#ef4444', bg: '#fef2f2', text: '严重', icon: XCircle },
    ORANGE: { color: '#f97316', bg: '#fff7ed', text: '紧急', icon: AlertOctagon },
    YELLOW: { color: '#f59e0b', bg: '#fffbeb', text: '预警', icon: AlertTriangle },
    BLUE: { color: '#3b82f6', bg: '#eff6ff', text: '关注', icon: AlertCircle },
  };

  // 组合筛选
  const filtered = useMemo(() => {
    let result = warnings;
    
    // 等级筛选
    if (levelFilter !== 'all') {
      result = result.filter(w => w.level === levelFilter);
    }
    
    // 采购员筛选
    if (buyerFilter !== 'all') {
      result = result.filter(w => {
        const mat = matMap[w.itemCode];
        return mat && mat.buyer === buyerFilter;
      });
    }
    
    return result;
  }, [warnings, levelFilter, buyerFilter, matMap]);

  const stats = {
    RED: warnings.filter(w => w.level === 'RED').length,
    ORANGE: warnings.filter(w => w.level === 'ORANGE').length,
    YELLOW: warnings.filter(w => w.level === 'YELLOW').length,
    BLUE: warnings.filter(w => w.level === 'BLUE').length,
  };

  const hasActiveFilters = levelFilter !== 'all' || buyerFilter !== 'all';

  if (loading) return <div style={{ padding: '32px' }}><Card><EmptyState icon={Clock} title="加载中" description="正在获取预警数据..." /></Card></div>;
  if (error) return <ErrorScreen error={error} onRetry={() => window.location.reload()} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Button variant="secondary" icon={ChevronLeft} onClick={onBack}>返回</Button>
      
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>库存预警</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>物料短缺与供应链告警</p>
          </div>
          <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(!showFilters)}>
            筛选 {hasActiveFilters && <span style={{ color: '#3b82f6' }}>●</span>}
          </Button>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>预警等级</label>
              <select 
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">全部等级</option>
                <option value="RED">严重</option>
                <option value="ORANGE">紧急</option>
                <option value="YELLOW">预警</option>
                <option value="BLUE">关注</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>采购员</label>
              <select 
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">全部采购员</option>
                {buyers.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => { setLevelFilter('all'); setBuyerFilter('all'); }}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                重置筛选
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <MetricCard icon={XCircle} label="严重" value={stats.RED} />
          <MetricCard icon={AlertOctagon} label="紧急" value={stats.ORANGE} />
          <MetricCard icon={AlertTriangle} label="预警" value={stats.YELLOW} />
          <MetricCard icon={AlertCircle} label="关注" value={stats.BLUE} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['等级', '物料编码', '物料名称', '所属产品', '采购员', '库存', '需求', '交期', '供应商'].map(h => (
                  <th key={h} style={{ 
                    textAlign: ['等级', '物料编码', '物料名称', '所属产品', '采购员', '供应商'].includes(h) ? 'left' : 'center',
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: '#64748b', 
                    textTransform: 'uppercase' 
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, idx) => {
                const cfg = levelConfig[w.level];
                const Icon = cfg.icon;
                const mat = matMap[w.itemCode];
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        color: cfg.color,
                        backgroundColor: cfg.bg
                      }}>
                        <Icon size={12} />
                        {cfg.text}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '13px', color: '#0f172a' }}>{w.itemCode}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{w.itemName}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{w.productName || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} />
                        {mat?.buyer || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: 600,
                        color: w.stockQty < w.safetyStock ? '#dc2626' : '#16a34a'
                      }}>
                        {w.stockQty.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{w.demandQty.toLocaleString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#374151' }}>{w.dueDate}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{w.supplier || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: '14px', color: '#1e293b' }}>
          显示 <strong style={{ color: '#0f172a' }}>{filtered.length}</strong> / {warnings.length} 个预警项目
          {hasActiveFilters && <span style={{ color: '#64748b', marginLeft: '8px' }}>（已应用筛选条件）</span>}
        </div>
      </Card>
    </div>
  );
};

// ============ 主应用 ============
export default function App() {
  const [page, setPage] = useState({ type: 'dashboard', data: null });
  const [history, setHistory] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const nav = useCallback((type, data) => { 
    setHistory(h => [...h, page]); 
    setPage({ type, data });
    const url = type === 'dashboard' ? '/' : `/${type}/${data || ''}`;
    window.history.pushState({ type, data }, '', url);
  }, [page]);

  const back = useCallback(() => { 
    if (history.length) { 
      const prevPage = history[history.length - 1];
      setPage(prevPage); 
      setHistory(h => h.slice(0, -1));
      const url = prevPage.type === 'dashboard' ? '/' : `/${prevPage.type}/${prevPage.data || ''}`;
      window.history.pushState(prevPage, '', url);
    } 
  }, [history]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/data`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || '网络请求失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && history.length > 0) {
        back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, back]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        setPage(e.state);
        setHistory([]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/(order|product|material|warnings)\/(.+)$/);
    if (match) {
      const [, type, data] = match;
      setPage({ type, data });
    } else if (path === '/warnings') {
      setPage({ type: 'warnings', data: null });
    }
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={fetchData} />;
  if (!data) return <ErrorScreen error="未获取到数据" onRetry={fetchData} />;

  const sharedProps = {
    orders: data.orders || [],
    orderLines: data.orderLines || [],
    products: data.products || [],
    bom: data.bom || [],
    mats: data.mats || [],
    suppliers: data.suppliers || [],
    pos: data.pos || []
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: '#fff', 
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div 
              onClick={() => { setPage({ type: 'dashboard', data: null }); setHistory([]); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Factory size={20} style={{ color: '#fff' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>供应链控制中心</h1>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>企业风险管理系统</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {history.length > 0 && (
                <div style={{ fontSize: '11px', color: '#64748b', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  按 <kbd style={{ padding: '2px 6px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>ESC</kbd> 返回
                </div>
              )}
              {page.type === 'dashboard' && (
                <Button variant="danger" icon={AlertCircle} onClick={() => nav('warnings', null)}>
                  库存预警
                </Button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>实时</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {page.type === 'dashboard' && <Dashboard {...sharedProps} onNav={nav} />}
        {page.type === 'order' && <OrderDetail {...sharedProps} id={page.data} onNav={nav} onBack={back} />}
        {page.type === 'product' && <ProductDetail {...sharedProps} code={page.data} onNav={nav} onBack={back} />}
        {page.type === 'material' && <MaterialDetail {...sharedProps} code={page.data} onBack={back} />}
        {page.type === 'warnings' && <WarningsPage onBack={back} mats={sharedProps.mats} />}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        @keyframes pulse { 
          0%, 100% { opacity: 1; } 
          50% { opacity: 0.5; } 
        }
      `}</style>
    </div>
  );
}