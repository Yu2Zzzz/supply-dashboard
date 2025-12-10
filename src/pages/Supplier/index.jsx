// src/pages/Supplier/index.jsx
import React, { useState, useEffect } from 'react';

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 调用 API 获取供应商数据
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ padding: '40px' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '20px' }}>供应商管理</h1>
      <p style={{ color: '#64748b' }}>供应商管理页面开发中...</p>
      
      {/* TODO: 添加供应商列表、搜索、新增等功能 */}
    </div>
  );
}