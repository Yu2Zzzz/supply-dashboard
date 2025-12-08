// src/pages/ProductManagementPage.jsx - 完整版（包含BOM编辑）
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Package, Plus, Search, RefreshCw, Edit, Trash2, Save, X, Box, Settings } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

// ============ 内置 UI 组件 ============
const Card = memo(({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', ...style }}>
    {children}
  </div>
));

const Button = memo(({ children, onClick, variant = 'primary', icon: Icon, size = 'md', disabled = false, style = {} }) => {
  const baseStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, borderRadius: size === 'sm' ? '8px' : '12px', transition: 'all 0.2s',
    padding: size === 'sm' ? '8px 12px' : '12px 20px', fontSize: size === 'sm' ? '12px' : '14px',
    opacity: disabled ? 0.5 : 1, ...style
  };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' },
    secondary: { background: '#f1f5f9', color: '#374151' },
    danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' },
    success: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' },
    warning: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }
  };
  return <button style={{ ...baseStyle, ...variants[variant] }} onClick={onClick} disabled={disabled}>{Icon && <Icon size={size === 'sm' ? 14 : 18} />}{children}</button>;
});

const Input = memo(({ label, value, onChange, placeholder, type = 'text', required = false, disabled = false }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', background: disabled ? '#f8fafc' : '#fff' }} />
  </div>
));

const Select = memo(({ label, value, onChange, options, required = false, disabled = false }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', background: disabled ? '#f8fafc' : '#fff', cursor: 'pointer' }}>
      <option value="">请选择</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
));

const Modal = memo(({ isOpen, onClose, title, children, width = '500px' }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '0 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
});

const EmptyState = memo(({ icon: Icon, title, description }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={28} style={{ color: '#94a3b8' }} />
    </div>
    <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '14px', color: '#94a3b8' }}>{description}</div>
  </div>
));

const LoadingScreen = memo(() => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#64748b' }}>加载中...</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
));

// ============ 产品管理页面 ============
const ProductManagementPage = memo(() => {
  const { request } = useApi();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // 产品编辑弹窗
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    productCode: '', name: '', category: '', description: '', unit: 'PCS', status: 'active'
  });
  
  // BOM编辑弹窗
  const [showBomModal, setShowBomModal] = useState(false);
  const [bomProduct, setBomProduct] = useState(null);
  const [bomItems, setBomItems] = useState([]);
  const [bomLoading, setBomLoading] = useState(false);

  // 获取产品列表
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await request(`/api/products?page=${page}&pageSize=10&keyword=${keyword}`);
    if (res.success) {
      setProducts(res.data?.list || res.data || []);
      setTotal(res.data?.pagination?.total || 0);
    }
    setLoading(false);
  }, [request, page, keyword]);

  // 获取物料列表（用于BOM选择）
  const fetchMaterials = useCallback(async () => {
    const res = await request('/api/materials');
    if (res.success) {
      setMaterials(res.data?.list || res.data || []);
    }
  }, [request]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  // 打开产品编辑弹窗
  const openProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setFormData({
        productCode: product.productCode || product.product_code || '',
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        unit: product.unit || 'PCS',
        status: product.status || 'active'
      });
    } else {
      setFormData({ productCode: '', name: '', category: '', description: '', unit: 'PCS', status: 'active' });
    }
    setShowModal(true);
  };

  // 保存产品
  const handleSaveProduct = async () => {
    if (!formData.productCode || !formData.name) {
      alert('产品编码和名称不能为空');
      return;
    }
    
    const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) {
      setShowModal(false);
      fetchProducts();
      alert('保存成功！');
    } else {
      alert(res.message || '保存失败');
    }
  };

  // 删除产品
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该产品吗？')) return;
    const res = await request(`/api/products/${id}`, { method: 'DELETE' });
    if (res.success) {
      fetchProducts();
      alert('删除成功！');
    } else {
      alert(res.message || '删除失败');
    }
  };

  // 打开BOM编辑弹窗
  const openBomModal = async (product) => {
    setBomProduct(product);
    setBomLoading(true);
    setShowBomModal(true);
    
    // 获取产品详情（包含BOM）
    const res = await request(`/api/products/${product.id}`);
    if (res.success && res.data) {
      const items = res.data.bomItems || [];
      setBomItems(items.map(item => ({
        materialId: item.materialId || item.material_id,
        materialCode: item.materialCode || item.material_code,
        materialName: item.materialName || item.material_name,
        quantity: item.quantity || 1
      })));
    } else {
      setBomItems([]);
    }
    setBomLoading(false);
  };

  // 添加BOM物料
  const addBomItem = () => {
    setBomItems([...bomItems, { materialId: '', materialCode: '', materialName: '', quantity: 1 }]);
  };

  // 更新BOM物料
  const updateBomItem = (index, field, value) => {
    const newItems = [...bomItems];
    newItems[index][field] = value;
    
    // 如果选择了物料，自动填充名称
    if (field === 'materialId') {
      const material = materials.find(m => m.id == value);
      if (material) {
        newItems[index].materialCode = material.materialCode || material.material_code;
        newItems[index].materialName = material.name;
      }
    }
    
    setBomItems(newItems);
  };

  // 删除BOM物料
  const removeBomItem = (index) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  // 保存BOM
  const handleSaveBom = async () => {
    // 过滤掉未选择物料的项
    const validItems = bomItems.filter(item => item.materialId);
    
    const res = await request(`/api/products/${bomProduct.id}/bom`, {
      method: 'PUT',
      body: JSON.stringify({
        bomItems: validItems.map(item => ({
          materialId: parseInt(item.materialId),
          quantity: parseFloat(item.quantity) || 1
        }))
      })
    });
    
    if (res.success) {
      setShowBomModal(false);
      fetchProducts();
      alert('BOM保存成功！');
    } else {
      alert(res.message || 'BOM保存失败');
    }
  };

  // 过滤产品
  const filtered = products;

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>产品管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理产品信息和BOM物料清单</p>
        </div>
        {isAdmin && <Button icon={Plus} onClick={() => openProductModal()}>新增产品</Button>}
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="搜索产品编码或名称..." value={keyword} 
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }} 
              style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchProducts}>刷新</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="暂无产品" description="点击新增产品按钮添加" />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>产品编码</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>产品名称</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>类别</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>单位</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>BOM物料数</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {product.productCode || product.product_code}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Package size={18} style={{ color: '#3b82f6' }} />
                          {product.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{product.category || '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>{product.unit || 'PCS'}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '13px', 
                          fontWeight: 600, 
                          background: (product.materialCount || 0) > 0 ? '#dbeafe' : '#f1f5f9',
                          color: (product.materialCount || 0) > 0 ? '#3b82f6' : '#94a3b8'
                        }}>
                          {product.materialCount || 0} 个物料
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 600,
                          background: product.status === 'active' ? '#d1fae5' : '#fee2e2',
                          color: product.status === 'active' ? '#10b981' : '#ef4444'
                        }}>
                          {product.status === 'active' ? '启用' : '停用'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Button size="sm" variant="warning" icon={Settings} onClick={() => openBomModal(product)}>
                            BOM
                          </Button>
                          {isAdmin && (
                            <>
                              <Button size="sm" variant="secondary" icon={Edit} onClick={() => openProductModal(product)}>编辑</Button>
                              <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(product.id)}>删除</Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>共 {total} 条记录</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>上一页</Button>
                <span style={{ padding: '8px 12px', fontSize: '14px' }}>第 {page} 页</span>
                <Button size="sm" variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page * 10 >= total}>下一页</Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 产品编辑弹窗 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? '编辑产品' : '新增产品'} width="550px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="产品编码" value={formData.productCode} onChange={v => setFormData({ ...formData, productCode: v })} required placeholder="如: P001" />
          <Input label="产品名称" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required placeholder="如: 户外折叠椅" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="类别" value={formData.category} onChange={v => setFormData({ ...formData, category: v })} placeholder="如: 家具" />
          <Select label="单位" value={formData.unit} onChange={v => setFormData({ ...formData, unit: v })} 
            options={[
              { value: 'PCS', label: '件' },
              { value: 'SET', label: '套' },
              { value: 'BOX', label: '箱' },
              { value: 'KG', label: '千克' }
            ]} />
        </div>
        <Input label="描述" value={formData.description} onChange={v => setFormData({ ...formData, description: v })} placeholder="产品描述..." />
        <Select label="状态" value={formData.status} onChange={v => setFormData({ ...formData, status: v })} 
          options={[
            { value: 'active', label: '启用' },
            { value: 'inactive', label: '停用' }
          ]} />
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSaveProduct}>保存</Button>
        </div>
      </Modal>

      {/* BOM编辑弹窗 */}
      <Modal isOpen={showBomModal} onClose={() => setShowBomModal(false)} title={`编辑BOM - ${bomProduct?.name || ''}`} width="700px">
        {bomLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>加载中...</div>
        ) : (
          <>
            {/* 产品信息 */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>产品编码：</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{bomProduct?.productCode || bomProduct?.product_code}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>产品名称：</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{bomProduct?.name}</span>
                </div>
              </div>
            </div>

            {/* BOM物料列表 */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                BOM物料清单 {bomItems.length > 0 && `(${bomItems.length} 项)`}
              </h4>
              <Button size="sm" variant="secondary" icon={Plus} onClick={addBomItem}>添加物料</Button>
            </div>

            {bomItems.length === 0 ? (
              <div style={{ padding: '32px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                <Box size={32} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
                <div>暂无物料，点击"添加物料"按钮</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {bomItems.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', gap: '12px', alignItems: 'center', 
                    padding: '12px', background: '#f8fafc', borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ flex: 3 }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>物料 #{idx + 1}</label>
                      <select 
                        value={item.materialId} 
                        onChange={e => updateBomItem(idx, 'materialId', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                      >
                        <option value="">选择物料...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.materialCode || m.material_code} - {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>数量</label>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateBomItem(idx, 'quantity', e.target.value)}
                        min="0.01"
                        step="0.01"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => removeBomItem(idx)} style={{ marginTop: '18px' }} />
                  </div>
                ))}
              </div>
            )}

            {/* 汇总信息 */}
            {bomItems.length > 0 && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#064e3b', fontWeight: 600 }}>物料总数</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{bomItems.filter(i => i.materialId).length} 种物料</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowBomModal(false)}>取消</Button>
              <Button icon={Save} onClick={handleSaveBom}>保存BOM</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
});

export default ProductManagementPage;