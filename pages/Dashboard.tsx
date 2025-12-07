// frontend/src/pages/Dashboard.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const cards = [
    { title: '待处理订单', value: '23', color: '#3b82f6', icon: '📋' },
    { title: '库存预警', value: '8', color: '#ef4444', icon: '⚠️' },
    { title: '在途物料', value: '156', color: '#f59e0b', icon: '🚚' },
    { title: '本月采购额', value: '¥128万', color: '#10b981', icon: '💰' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
          欢迎回来，{user?.realName || user?.username}
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          这是您的供应链管理控制台
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((card, idx) => (
          <div key={idx} style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>{card.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: card.color, padding: '4px 8px', background: `${card.color}10`, borderRadius: '4px' }}>
                查看详情 →
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{card.title}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>快速操作</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {user?.role === 'sales' || user?.role === 'admin' ? (
            <button style={{ padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              + 新建业务订单
            </button>
          ) : null}
          {user?.role === 'purchaser' || user?.role === 'admin' ? (
            <button style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              + 新建采购订单
            </button>
          ) : null}
          <button style={{ padding: '10px 16px', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            查看预警
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
