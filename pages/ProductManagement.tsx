// frontend/src/pages/ProductManagement.tsx
import React, { useState, useEffect } from 'react';
import { productApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: number;
  productCode: string;
  name: string;
  category: string;
  unit: string;
  status: string;
  materialCount: number;
}

const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const canEdit = user?.role === 'admin';

  const fetchProducts = async () => {
    setLoading(true);
    const res = await productApi.getProducts({ page, pageSize: 10, keyword }) as any;
    if (res.success) {
      setProducts(res.data.list);
      setTotal(res.data.pagination.total);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, keyword]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除该产品吗？')) return;
    const res = await productApi.deleteProduct(id);
    if (res.success) fetchProducts();
    else alert(res.message);
  };

  return (
    <div>
      {/* 搜索栏 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 24px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <input
          type="text"
          placeholder="搜索产品编码或名称..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          style={{ flex: 1, padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
        />
        {canEdit && (
          <button onClick={() => { setEditingProduct(null); setShowModal(true); }} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            + 新增产品
          </button>
        )}
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>产品编码</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>产品名称</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>类别</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>BOM物料数</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>状态</th>
              {canEdit && <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>加载中...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>暂无数据</td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.productCode}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{p.name}</td>
                <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{p.category || '-'}</td>
                <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>{p.materialCount}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, borderRadius: '4px', color: p.status === 'active' ? '#16a34a' : '#dc2626', background: p.status === 'active' ? '#dcfce7' : '#fee2e2' }}>
                    {p.status === 'active' ? '启用' : '停用'}
                  </span>
                </td>
                {canEdit && (
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button onClick={() => { setEditingProduct(p); setShowModal(true); }} style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginRight: '8px' }}>编辑</button>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>删除</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 分页 */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>共 {total} 条记录</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#94a3b8' : '#374151' }}>上一页</button>
            <span style={{ padding: '8px 12px', fontSize: '14px' }}>第 {page} 页</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: page * 10 >= total ? 'not-allowed' : 'pointer', color: page * 10 >= total ? '#94a3b8' : '#374151' }}>下一页</button>
          </div>
        </div>
      </div>

      {/* 弹窗 - 简化版 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600 }}>{editingProduct ? '编辑产品' : '新增产品'}</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>表单内容待实现...</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>取消</button>
              <button style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
