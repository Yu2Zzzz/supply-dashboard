import React, { useState, useMemo, useCallback, useEffect } from 'react';

// ============ API 配置 ============
const BASE_URL = import.meta.env.PROD
  ? 'https://supply-backend-g3gm.onrender.com'
  : 'http://localhost:4000';

useEffect(() => {
  axios.get(`${BASE_URL}/api/data`)
    .then((res) => setBackendData(res.data))
    .catch((err) => console.error(err));
}, []);

// ============ 工具函数 ============
const TODAY = new Date();
const daysDiff = (d1, d2) => Math.round((new Date(d1) - new Date(d2)) / 86400000);

const RISK = {
  ongoing: { color: '#10b981', bg: '#ecfdf5', gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', text: '正常', icon: '✓', priority: 1 },
  warning: { color: '#eab308', bg: '#fefce8', gradient: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', text: '预警', icon: '!', priority: 2 },
  urgent: { color: '#f97316', bg: '#fff7ed', gradient: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', text: '紧急', icon: '!!', priority: 3 },
  overdue: { color: '#ef4444', bg: '#fef2f2', gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', text: '延期', icon: '✕', priority: 4 },
  pending: { color: '#8b5cf6', bg: '#f5f3ff', gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', text: '待采购', icon: '○', priority: 5 },
};

// ============ 风险计算 ============
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
const StatusBadge = ({ level, size = 'md' }) => {
  const r = RISK[level] || RISK.pending;
  const styles = { sm: { padding: '5px 12px', fontSize: 11, gap: 4 }, md: { padding: '7px 16px', fontSize: 13, gap: 5 } };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 50, fontWeight: 700, color: r.color, background: r.gradient, boxShadow: `0 2px 8px ${r.color}25`, ...styles[size] }}>
      <span style={{ fontSize: size === 'sm' ? 10 : 12 }}>{r.icon}</span>
      <span>{r.text}</span>
    </span>
  );
};

const ScoreBar = ({ score, size = 'md' }) => {
  const color = score >= 50 ? '#ef4444' : score >= 25 ? '#f97316' : score >= 10 ? '#eab308' : '#10b981';
  const w = size === 'sm' ? 36 : 48, h = size === 'sm' ? 5 : 6;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: w, height: h, background: '#e2e8f0', borderRadius: h, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: h, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: size === 'sm' ? 12 : 14, fontWeight: 800, color, minWidth: 22, fontFamily: 'SF Mono, monospace' }}>{score}</span>
    </div>
  );
};

const DaysTag = ({ days, compact }) => {
  const color = days <= 5 ? '#ef4444' : days <= 10 ? '#f97316' : days <= 15 ? '#eab308' : '#10b981';
  const bg = days <= 5 ? '#fef2f2' : days <= 10 ? '#fff7ed' : days <= 15 ? '#fefce8' : '#ecfdf5';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: compact ? '4px 10px' : '6px 14px', borderRadius: 50, fontSize: compact ? 11 : 13, fontWeight: 700, color, background: bg, boxShadow: `0 2px 6px ${color}15` }}>
      <span style={{ fontSize: compact ? 10 : 11 }}>⏱</span> {days}天
    </span>
  );
};

const Card = ({ children, style, onClick, glow }) => (
  <div onClick={onClick} style={{ 
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
    borderRadius: 20, padding: 20, 
    boxShadow: glow ? `0 8px 32px ${glow}20, 0 2px 8px rgba(0,0,0,0.04)` : '0 4px 24px rgba(0,0,0,0.04)',
    border: '1px solid rgba(255,255,255,0.8)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: onClick ? 'pointer' : 'default',
    ...style 
  }}>{children}</div>
);

const GlassCard = ({ children, style, color = '#3b82f6' }) => (
  <div style={{ background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`, backdropFilter: 'blur(20px)', borderRadius: 20, padding: 20, border: `1px solid ${color}15`, boxShadow: `0 8px 32px ${color}08`, ...style }}>{children}</div>
);

// 统计卡片 - 提高文字对比度
const StatCard = ({ icon, label, value, sub, color }) => (
  <GlassCard color={color} style={{ flex: 1, minWidth: 170, padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${color}20, ${color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: 34, fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 600 }}>{sub}</div>}
  </GlassCard>
);

const BackButton = ({ onClick }) => (
  <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: 'none', borderRadius: 12, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 20 }}>
    <span style={{ fontSize: 16 }}>←</span> 返回
  </button>
);

const EmptyState = ({ icon, text }) => (
  <div style={{ padding: 50, textAlign: 'center' }}>
    <div style={{ width: 80, height: 80, margin: '0 auto 16px', borderRadius: 20, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{icon}</div>
    <div style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>{text}</div>
  </div>
);

const LoadingScreen = () => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: 20, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, animation: 'pulse 2s infinite' }}>🏭</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>加载中...</div>
      <div style={{ fontSize: 14, color: '#64748b' }}>正在获取供应链数据</div>
    </div>
  </div>
);

const ErrorScreen = ({ error, onRetry }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', maxWidth: 400, padding: 20 }}>
      <div style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: 20, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>数据加载失败</div>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>{error}</div>
      <button onClick={onRetry} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>重试</button>
    </div>
  </div>
);

// ============ Dashboard ============
const Dashboard = ({ orders, orderLines, products, bom, mats, suppliers, pos, onNav }) => {
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);

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
        ...o, products: lines.map(l => l.productName), 
        daysLeft: daysDiff(o.deliveryDate, TODAY),
        level: highestRisk(risks.map(r => r.level)), 
        score: Math.max(0, ...risks.map(r => r.score)),
        affected: affected.size
      };
    });

    return { orders: orderData };
  }, [orders, orderLines, bom, calcRisk]);

  const stats = {
    overdue: data.orders.filter(o => o.level === 'overdue').length,
    urgent: data.orders.filter(o => o.level === 'urgent').length,
    warning: data.orders.filter(o => o.level === 'warning').length,
    value: data.orders.reduce((s, o) => s + 100, 0) * 10000,
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard icon="🔴" label="已延期" value={stats.overdue} sub="需立即处理" color="#ef4444" />
        <StatCard icon="🟠" label="紧急" value={stats.urgent} sub="风险分≥50" color="#f97316" />
        <StatCard icon="🟡" label="预警" value={stats.warning} sub="风险分≥25" color="#eab308" />
        <StatCard icon="💰" label="采购额" value={`¥${(stats.value/10000).toFixed(0)}万`} sub={`${orders.length}个订单`} color="#3b82f6" />
      </div>

      <Card style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>订单概览</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              {['订单', '客户', '产品', '交期', '剩余', '风险分', '状态', '问题'].map(h => (
                <th key={h} style={{ padding: '16px 18px', textAlign: ['订单','客户','产品'].includes(h) ? 'left' : 'center', fontWeight: 700, fontSize: 12, color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.orders.map(o => (
              <tr key={o.id} onClick={() => onNav('order', o.id)} style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9' }}><span style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{o.id}</span></td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{o.customer}</td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: 13, fontWeight: 500 }}>{o.products.join(', ')}</td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600 }}>{o.deliveryDate}</td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><DaysTag days={o.daysLeft} /></td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><ScoreBar score={o.score} /></td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><StatusBadge level={o.level} /></td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <span style={{ padding: '6px 16px', borderRadius: 50, fontSize: 14, fontWeight: 800, color: o.affected > 0 ? '#ef4444' : '#10b981', background: o.affected > 0 ? '#fef2f2' : '#ecfdf5' }}>{o.affected}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ============ OrderDetail ============
const OrderDetail = ({ id, orders, orderLines, bom, mats, suppliers, pos, onNav, onBack }) => {
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);
  
  const order = orders.find(o => o.id === id);
  
  if (!order) return <Card><EmptyState icon="❌" text="订单不存在" /></Card>;
  
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
    <div>
      <BackButton onClick={onBack} />
      <Card glow="#3b82f6" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>销售订单</div>
            <h2 style={{ margin: 0, fontSize: 34, fontWeight: 800, background: 'linear-gradient(135deg, #1e293b, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{id}</h2>
            <div style={{ color: '#475569', fontWeight: 600, marginTop: 6, fontSize: 16 }}>{order.customer}</div>
          </div>
          <StatusBadge level={highestRisk(allRisks.map(r => r.level))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: '下单日期', value: order.orderDate, icon: '📅' },
            { label: '交货日期', value: order.deliveryDate, icon: '🎯' },
            { label: '剩余天数', value: <DaysTag days={daysLeft} compact />, icon: '⏱' },
            { label: '产品种类', value: `${lines.length} 种`, icon: '📦' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 16, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 700 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {criticals.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>🚨 关键预警物料</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {criticals.slice(0, 6).map((m, i) => (
              <Card key={i} onClick={() => onNav('material', m.code)} glow={RISK[m.level].color} style={{ borderLeft: `4px solid ${RISK[m.level].color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{m.name}</span>
                  <ScoreBar score={m.score} size="sm" />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {m.delay > 0 && <span style={{ padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, color: '#ef4444', background: '#fef2f2' }}>延期{m.delay}天</span>}
                  {m.gap > 0 && <span style={{ padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, color: '#f97316', background: '#fff7ed' }}>缺口{m.gap.toLocaleString()}</span>}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>📦 用于: {m.productName}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>📦 订单产品</h3>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              {['产品', '数量', 'BOM物料', '风险分', '状态'].map(h => (
                <th key={h} style={{ padding: '16px 18px', textAlign: h === '产品' ? 'left' : 'center', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map(l => {
              const risks = allRisks.filter(r => r.productCode === l.productCode);
              return (
                <tr key={l.productCode} onClick={() => onNav('product', l.productCode)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{l.productCode}</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{l.productName}</div>
                  </td>
                  <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{l.qty.toLocaleString()}</td>
                  <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{risks.length}</td>
                  <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><ScoreBar score={Math.max(0, ...risks.map(r => r.score))} /></td>
                  <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><StatusBadge level={highestRisk(risks.map(r => r.level))} size="sm" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ============ ProductDetail ============
const ProductDetail = ({ code, orders, orderLines, products, bom, mats, suppliers, pos, onNav, onBack }) => {
  const calcRisk = useMemo(() => createRiskCalculator(mats, pos, suppliers), [mats, pos, suppliers]);

  const product = products.find(p => p.code === code);
  
  if (!product) return <Card><EmptyState icon="❌" text="产品不存在" /></Card>;
  
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
      return { ...o, qty: l.qty, daysLeft, level: highestRisk(risks.map(r => r.level)), score: Math.max(0, ...risks.map(r => r.score)), gapCount: risks.filter(r => r.gap > 0).length };
    }).filter(Boolean).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [code, lines, orders, bom, calcRisk]);

  const bomData = useMemo(() => {
    let data = bom.filter(b => b.p === code).map(b => calcRisk(b.m, b.c * totalDemand, earliest?.deliveryDate || '2025-12-31')).filter(Boolean);
    data.sort((a, b) => b.score - a.score);
    return data;
  }, [code, totalDemand, earliest, bom, calcRisk]);

  return (
    <div>
      <BackButton onClick={onBack} />
      <Card glow="#3b82f6" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>产品信息</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg, #1e293b, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{code}</h2>
            <div style={{ fontSize: 18, color: '#1e293b', fontWeight: 600 }}>{product.name}</div>
          </div>
          <StatusBadge level={highestRisk(bomData.map(m => m.level))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { label: '关联订单', value: relatedOrderIds.length, icon: '📋', color: '#3b82f6' },
            { label: '总需求量', value: totalDemand.toLocaleString(), icon: '📊', color: '#8b5cf6' },
            { label: '最早交期', value: earliest?.deliveryDate || '-', icon: '🎯', color: '#f97316' },
            { label: 'BOM物料', value: bomData.length, icon: '🔧', color: '#10b981' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 16, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 700 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>📋 关联订单 ({relatedOrders.length})</h3>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              {['订单', '客户', '需求数量', '交货日期', '剩余天数', '风险分', '状态'].map(h => (
                <th key={h} style={{ padding: '16px 18px', textAlign: ['订单', '客户'].includes(h) ? 'left' : 'center', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {relatedOrders.map(o => (
              <tr key={o.id} onClick={() => onNav('order', o.id)} style={{ cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9' }}><span style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{o.id}</span></td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{o.customer}</td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{o.qty.toLocaleString()}</td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600 }}>{o.deliveryDate}</td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><DaysTag days={o.daysLeft} /></td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><ScoreBar score={o.score} /></td>
                <td style={{ padding: 18, borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}><StatusBadge level={o.level} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>🔧 BOM物料 ({bomData.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {bomData.map(m => (
          <Card key={m.code} onClick={() => onNav('material', m.code)} glow={RISK[m.level]?.color} style={{ borderLeft: `4px solid ${RISK[m.level].color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{m.code}</div>
              </div>
              <ScoreBar score={m.score} size="sm" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { label: '需求', value: m.demand, color: '#1e293b' },
                { label: '库存', value: m.inv, color: m.inv < m.safe ? '#ef4444' : '#10b981' },
                { label: '在途', value: m.transit, color: '#3b82f6' },
                { label: '缺口', value: m.gap, color: m.gap > 0 ? '#ef4444' : '#10b981' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center', padding: 8, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {m.delay > 0 && <span style={{ padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, color: '#ef4444', background: '#fef2f2' }}>🕐 延期{m.delay}天</span>}
              {m.singleSource && <span style={{ padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fffbeb' }}>⚠️ 单一来源</span>}
              {m.poCoverage < 1 && <span style={{ padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, color: '#8b5cf6', background: '#f5f3ff' }}>📋 PO {(m.poCoverage*100).toFixed(0)}%</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============ MaterialDetail ============
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

  if (!mat) return <Card><EmptyState icon="❌" text="物料不存在" /></Card>;

  return (
    <div>
      <BackButton onClick={onBack} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        <Card glow="#3b82f6">
          <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700 }}>📦 物料信息</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              { label: '编码', value: mat.code },
              { label: '名称', value: mat.name },
              { label: '规格', value: mat.spec },
              { label: '单价', value: `¥${mat.price}/${mat.unit}` },
              { label: '提前期', value: `${mat.lead} 天` },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <GlassCard color="#10b981">
          <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700 }}>📊 库存状态</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: '当前库存', value: mat.inv, color: mat.inv < mat.safe ? '#ef4444' : '#10b981' },
              { label: '安全库存', value: mat.safe, color: '#64748b' },
              { label: '在途数量', value: mat.transit, color: '#3b82f6' },
              { label: '总缺口', value: totalGap, color: totalGap > 0 ? '#ef4444' : '#10b981' },
            ].map((item, i) => (
              <div key={i} style={{ padding: 14, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard color="#8b5cf6">
          <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700 }}>🏭 供应商</h3>
          {mat.suppliers === 1 && <div style={{ padding: 12, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: 12, marginBottom: 14, fontSize: 13, color: '#b45309', fontWeight: 600 }}>⚠️ 单一来源风险</div>}
          {matSuppliers.map(s => (
            <div key={s.id} style={{ padding: 14, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{s.name}</span>
                {s.main && <span style={{ fontSize: 10, padding: '4px 10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', borderRadius: 50, fontWeight: 700 }}>主供</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: s.onTime < 0.85 ? '#ef4444' : '#10b981', fontWeight: 600 }}>准时率 {(s.onTime*100).toFixed(0)}%</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>质量 {(s.quality*100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </GlassCard>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>📋 采购订单</h3>
      {matPOs.length === 0 ? <Card><EmptyState icon="📭" text="暂无采购订单" /></Card> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
          {matPOs.map(p => {
            const st = { arrived: { bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#10b981', text: '已到货' }, shipped: { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#3b82f6', text: '已发货' }, producing: { bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)', color: '#f97316', text: '生产中' }, confirmed: { bg: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', color: '#64748b', text: '已确认' } }[p.status];
            return (
              <Card key={p.po} style={{ background: st.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{p.po}</span>
                  <span style={{ fontSize: 11, padding: '5px 12px', background: st.color, color: '#fff', borderRadius: 50, fontWeight: 700 }}>{st.text}</span>
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 8, fontWeight: 600 }}>{p.supplier}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{p.qty.toLocaleString()} {mat.unit}</span>
                  <span style={{ fontWeight: 800, color: '#1e293b' }}>¥{p.amt.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, fontWeight: 600 }}>📅 交期: {p.date}</div>
              </Card>
            );
          })}
        </div>
      )}

      <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>⚠️ 受影响订单</h3>
      <Card style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              {['订单', '客户', '产品', '订单量', '物料需求', '交期', '剩余', '状态'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {affected.map((o, i) => (
              <tr key={i}>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}><span style={{ fontWeight: 800, color: '#3b82f6' }}>{o.id}</span></td>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{o.customer}</td>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>{o.productName}</td>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{o.qty.toLocaleString()}</td>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{o.demand.toLocaleString()}</td>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>{o.deliveryDate}</td>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}><DaysTag days={o.daysLeft} compact /></td>
                <td style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}><StatusBadge level={o.level} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ============ WarningsPage ============
const WarningsPage = ({ onBack }) => {
  const [filter, setFilter] = useState('all');
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从后端获取预警数据
useEffect(() => {
  let cancelled = false; // 防止组件卸载后继续 setState

  const fetchWarnings = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/warnings`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();

      // 按预警等级排序: RED > ORANGE > YELLOW > BLUE，然后按交期升序
      const levelOrder = { RED: 1, ORANGE: 2, YELLOW: 3, BLUE: 4 };
      const sorted = [...result].sort((a, b) => {
        const levelDiff = (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
        if (levelDiff !== 0) return levelDiff;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      if (!cancelled) {
        setWarnings(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch warnings:', err);
      if (!cancelled) {
        setError(err.message || '获取预警数据失败');
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchWarnings();

  // 清理函数：组件卸载时避免 setState
  return () => {
    cancelled = true;
  };
}, [API_BASE]);

  const levelConfig = {
    RED: { color: '#ef4444', bg: '#fef2f2', text: '严重', icon: '🔴' },
    ORANGE: { color: '#f97316', bg: '#fff7ed', text: '紧急', icon: '🟠' },
    YELLOW: { color: '#eab308', bg: '#fefce8', text: '预警', icon: '🟡' },
    BLUE: { color: '#3b82f6', bg: '#eff6ff', text: '关注', icon: '🔵' },
  };

  const filtered = filter === 'all' ? warnings : warnings.filter(w => w.level === filter);
  const stats = {
    RED: warnings.filter(w => w.level === 'RED').length,
    ORANGE: warnings.filter(w => w.level === 'ORANGE').length,
    YELLOW: warnings.filter(w => w.level === 'YELLOW').length,
    BLUE: warnings.filter(w => w.level === 'BLUE').length,
  };

  // 加载中状态
  if (loading) {
    return (
      <div data-page="warnings-loading">
        <BackButton onClick={onBack} />
        <Card><EmptyState icon="⏳" text="加载预警数据中..." /></Card>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div data-page="warnings-error">
        <BackButton onClick={onBack} />
        <Card>
          <EmptyState icon="⚠️" text={error} />
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>重新加载</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div data-page="warnings">
      <BackButton onClick={onBack} />
      
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}>⚠️</span>
          库存预警总览
        </h2>
        
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard icon="🔴" label="严重" value={stats.RED} sub="立即处理" color="#ef4444" />
          <StatCard icon="🟠" label="紧急" value={stats.ORANGE} sub="优先关注" color="#f97316" />
          <StatCard icon="🟡" label="预警" value={stats.YELLOW} sub="提前准备" color="#eab308" />
          <StatCard icon="🔵" label="关注" value={stats.BLUE} sub="持续跟踪" color="#3b82f6" />
        </div>

        <div style={{ display: 'flex', gap: 10, background: '#f1f5f9', borderRadius: 14, padding: 4, flexWrap: 'wrap' }}>
          {[
            { k: 'all', l: '全部', c: warnings.length },
            { k: 'RED', l: '🔴 严重', c: stats.RED },
            { k: 'ORANGE', l: '🟠 紧急', c: stats.ORANGE },
            { k: 'YELLOW', l: '🟡 预警', c: stats.YELLOW },
            { k: 'BLUE', l: '🔵 关注', c: stats.BLUE },
          ].map(v => (
            <button key={v.k} onClick={() => setFilter(v.k)} style={{
              flex: 1, minWidth: 100, padding: '12px 16px', border: 'none', borderRadius: 11, cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
              background: filter === v.k ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
              color: filter === v.k ? '#fff' : '#64748b',
              boxShadow: filter === v.k ? '0 4px 16px rgba(59,130,246,0.4)' : 'none',
              whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}>
              {v.l} ({v.c})
            </button>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: 'auto' }}>
        <table id="warnings-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
              {['预警等级', '物料编码', '物料名称', '所属产品', '订单号', '当前库存', '需求数量', '安全库存', '订单交期', '供应商'].map(h => (
                <th key={h} style={{ padding: '16px 14px', textAlign: ['预警等级', '物料编码', '物料名称', '所属产品', '订单号', '供应商'].includes(h) ? 'left' : 'center', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, idx) => {
              const cfg = levelConfig[w.level];
              const stockStatus = w.stockQty < w.safetyStock ? 'low' : 'normal';
              
              return (
                <tr key={idx} data-warning-level={w.level} data-item-code={w.itemCode} data-order-id={w.orderId}
                  style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                  <td style={{ padding: '16px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 50, background: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                      <span>{cfg.icon}</span><span>{cfg.text}</span>
                    </span>
                  </td>
                  <td style={{ padding: '16px 14px', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{w.itemCode}</td>
                  <td style={{ padding: '16px 14px', fontWeight: 600, color: '#1e293b' }}>{w.itemName}</td>
                  <td style={{ padding: '16px 14px', color: '#64748b', fontWeight: 600 }}>{w.productName || '-'}</td>
                  <td style={{ padding: '16px 14px', fontWeight: 600, color: '#1e293b' }}>{w.orderId || '-'}</td>
                  <td style={{ padding: '16px 14px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: stockStatus === 'low' ? '#ef4444' : '#10b981', padding: '4px 12px', borderRadius: 8, background: stockStatus === 'low' ? '#fef2f2' : '#ecfdf5' }}>
                      {w.stockQty.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 14px', textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{w.demandQty.toLocaleString()}</td>
                  <td style={{ padding: '16px 14px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{w.safetyStock.toLocaleString()}</td>
                  <td style={{ padding: '16px 14px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>{w.dueDate}</td>
                  <td style={{ padding: '16px 14px', color: '#1e293b', fontWeight: 600 }}>{w.supplier || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card style={{ marginTop: 20, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
        <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>
          📊 共检测到 <strong style={{ color: '#1e293b', fontSize: 18 }}>{warnings.length}</strong> 个预警项目，
          其中严重 <strong style={{ color: '#ef4444', fontSize: 16 }}>{stats.RED}</strong> 个，
          紧急 <strong style={{ color: '#f97316', fontSize: 16 }}>{stats.ORANGE}</strong> 个，
          预警 <strong style={{ color: '#eab308', fontSize: 16 }}>{stats.YELLOW}</strong> 个，
          关注 <strong style={{ color: '#3b82f6', fontSize: 16 }}>{stats.BLUE}</strong> 个
        </div>
      </Card>
    </div>
  );
};

// ============ App ============
export default function App() {
  const [page, setPage] = useState({ type: 'dashboard', data: null });
  const [history, setHistory] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const nav = useCallback((type, data) => { setHistory(h => [...h, page]); setPage({ type, data }); }, [page]);
  const back = useCallback(() => { if (history.length) { setPage(history[history.length - 1]); setHistory(h => h.slice(0, -1)); } }, [history]);

  // 从后端获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/data`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message || '网络请求失败，请检查后端服务是否运行');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 加载中
  if (loading) {
    return <LoadingScreen />;
  }

  // 加载失败
  if (error) {
    return <ErrorScreen error={error} onRetry={fetchData} />;
  }

  // 数据为空
  if (!data) {
    return <ErrorScreen error="未获取到数据" onRetry={fetchData} />;
  }

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', color: '#fff', padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 30px rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div onClick={() => { setPage({ type: 'dashboard', data: null }); setHistory([]); }} style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 4px 16px rgba(59,130,246,0.4)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>🏭</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>供应链预警中心</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Supply Chain Risk Dashboard</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {page.type === 'dashboard' && (
            <button onClick={() => nav('warnings', null)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.4)'; }}>
              <span style={{ fontSize: 18 }}>⚠️</span><span>库存预警</span>
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>实时同步</span>
          </div>
          <div style={{ fontSize: 14, background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 12, fontWeight: 600, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            📅 {new Date().toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>

      {/* 主内容区域 - 调整布局让内容更宽，更好利用屏幕空间 */}
      <div style={{ maxWidth: '95%', width: '100%', margin: '0 auto', padding: 28 }}>
        {page.type === 'dashboard' && <Dashboard {...sharedProps} onNav={nav} />}
        {page.type === 'order' && <OrderDetail {...sharedProps} id={page.data} onNav={nav} onBack={back} />}
        {page.type === 'product' && <ProductDetail {...sharedProps} code={page.data} onNav={nav} onBack={back} />}
        {page.type === 'material' && <MaterialDetail {...sharedProps} code={page.data} onBack={back} />}
        {page.type === 'warnings' && <WarningsPage onBack={back} />}
      </div>

      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #cbd5e1, #94a3b8); border-radius: 4px; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
      `}</style>
    </div>
  );
}