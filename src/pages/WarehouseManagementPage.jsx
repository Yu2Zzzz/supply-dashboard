// src/pages/WarehouseManagementPage.jsx - 完整版（包含库存编辑）
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Warehouse, Plus, Search, RefreshCw, Edit, Trash2, Save, X, Package, Box, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

// ============ 内置 UI 组件 ============
const Card = memo(({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ 
    background: '#fff', borderRadius: '16px', padding: '24px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s',
    ...style 
  }}>
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

// ============ 仓库管理页面 ============
const WarehouseManagementPage = memo(() => {
  const { request } = useApi();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'purchaser';
  
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [formData, setFormData] = useState({
    warehouseCode: '', name: '', location: '', capacity: 0, manager: ''
  });
  
  // 库存查看状态
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [inventoryTab, setInventoryTab] = useState('materials');
  const [materialInventory, setMaterialInventory] = useState([]);
  const [productInventory, setProductInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  
  // 库存编辑弹窗
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [inventoryForm, setInventoryForm] = useState({ quantity: 0, safetyStock: 0 });

  // 获取仓库列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await request('/api/warehouses');
    if (res.success) setWarehouses(res.data?.list || res.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 获取仓库库存
  const fetchInventory = useCallback(async (warehouseId) => {
    setInventoryLoading(true);
    
    try {
      // 获取物料库存
      const matRes = await request(`/api/inventory?warehouseId=${warehouseId}&type=material`);
      if (matRes.success) {
        const list = matRes.data?.list || matRes.data || [];
        setMaterialInventory(list.map(item => ({
          id: item.id,
          itemId: item.materialId || item.material_id,
          itemCode: item.materialCode || item.material_code,
          itemName: item.materialName || item.material_name,
          quantity: item.quantity || 0,
          safetyStock: item.safetyStock || item.safety_stock || 0,
          unit: item.unit || '个',
          type: 'material'
        })));
      }
      
      // 获取产品库存
      const prodRes = await request(`/api/inventory?warehouseId=${warehouseId}&type=product`);
      if (prodRes.success) {
        const list = prodRes.data?.list || prodRes.data || [];
        setProductInventory(list.map(item => ({
          id: item.id,
          itemId: item.productId || item.product_id,
          itemCode: item.productCode || item.product_code,
          itemName: item.productName || item.product_name,
          quantity: item.quantity || 0,
          safetyStock: item.safetyStock || item.safety_stock || 0,
          unit: item.unit || '个',
          type: 'product'
        })));
      }
    } catch (e) {
      console.error('获取库存失败:', e);
    }
    
    setInventoryLoading(false);
  }, [request]);

  // 选择仓库查看库存
  const handleWarehouseClick = (warehouse) => {
    setSelectedWarehouse(warehouse);
    fetchInventory(warehouse.id);
  };

  // 返回仓库列表
  const handleBackToList = () => {
    setSelectedWarehouse(null);
    setMaterialInventory([]);
    setProductInventory([]);
  };

  // 仓库 CRUD
  const handleSubmit = async () => {
    if (!formData.warehouseCode || !formData.name) {
      alert('仓库编码和名称不能为空');
      return;
    }
    
    const endpoint = editingWarehouse ? `/api/warehouses/${editingWarehouse.id}` : '/api/warehouses';
    const method = editingWarehouse ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) { 
      setShowModal(false); 
      fetchData(); 
      alert('保存成功！');
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该仓库吗？')) return;
    const res = await request(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (res.success) {
      fetchData();
      alert('删除成功！');
    } else {
      alert(res.message || '删除失败');
    }
  };

  const openModal = (warehouse = null) => {
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

  // 打开库存编辑弹窗
  const openInventoryEdit = (item) => {
    setEditingInventory(item);
    setInventoryForm({
      quantity: item.quantity || 0,
      safetyStock: item.safetyStock || 0
    });
    setShowInventoryModal(true);
  };

  // 保存库存
  const handleSaveInventory = async () => {
    const res = await request(`/api/inventory/${editingInventory.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity: parseFloat(inventoryForm.quantity) || 0,
        safetyStock: parseFloat(inventoryForm.safetyStock) || 0,
        type: editingInventory.type
      })
    });
    
    if (res.success) {
      setShowInventoryModal(false);
      fetchInventory(selectedWarehouse.id);
      alert('库存更新成功！');
    } else {
      alert(res.message || '库存更新失败');
    }
  };

  const filtered = warehouses.filter(w => 
    !keyword || w.name?.includes(keyword) || w.warehouseCode?.includes(keyword) || w.location?.includes(keyword)
  );

  if (loading) return <LoadingScreen />;

  // 库存详情视图
  if (selectedWarehouse) {
    const currentInventory = inventoryTab === 'materials' ? materialInventory : productInventory;
    const lowStockCount = currentInventory.filter(i => i.quantity < i.safetyStock).length;
    
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Button variant="secondary" icon={ArrowLeft} onClick={handleBackToList}>返回</Button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              {selectedWarehouse.name} - 库存管理
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {selectedWarehouse.location} | 容量: {(selectedWarehouse.capacity || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <Card style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>物料种类</div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>{materialInventory.length}</div>
          </Card>
          <Card style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>产品种类</div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>{productInventory.length}</div>
          </Card>
          <Card style={{ background: lowStockCount > 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #64748b 0%, #475569 100%)', color: '#fff' }}>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>库存预警</div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>{lowStockCount}</div>
          </Card>
        </div>

        {/* 标签页 */}
        <Card style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setInventoryTab('materials')} style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
                background: inventoryTab === 'materials' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9',
                color: inventoryTab === 'materials' ? '#fff' : '#64748b'
              }}>
                <Package size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                物料库存 ({materialInventory.length})
              </button>
              <button onClick={() => setInventoryTab('products')} style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
                background: inventoryTab === 'products' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9',
                color: inventoryTab === 'products' ? '#fff' : '#64748b'
              }}>
                <Box size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                产品库存 ({productInventory.length})
              </button>
            </div>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchInventory(selectedWarehouse.id)}>刷新</Button>
          </div>
        </Card>

        {/* 库存表格 */}
        <Card>
          {inventoryLoading ? (
            <LoadingScreen />
          ) : currentInventory.length === 0 ? (
            <EmptyState 
              icon={inventoryTab === 'materials' ? Package : Box} 
              title={`暂无${inventoryTab === 'materials' ? '物料' : '产品'}库存`} 
              description="该仓库暂无库存记录" 
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>编码</th>
                    <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>名称</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>当前库存</th>
                    <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>安全库存</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>单位</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInventory.map((item, idx) => {
                    const isLow = item.quantity < item.safetyStock;
                    const isCritical = item.quantity < item.safetyStock * 0.5;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: isLow ? '#fef2f2' : 'transparent' }}>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{item.itemCode}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{item.itemName}</td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: isLow ? '#ef4444' : '#0f172a', textAlign: 'right' }}>
                          {(item.quantity || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', textAlign: 'right' }}>
                          {(item.safetyStock || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {isCritical ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
                              <AlertTriangle size={14} /> 严重不足
                            </span>
                          ) : isLow ? (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#fef3c7', color: '#f59e0b' }}>
                              库存不足
                            </span>
                          ) : (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#d1fae5', color: '#10b981' }}>
                              正常
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {canEdit && (
                            <Button size="sm" variant="secondary" icon={Edit} onClick={() => openInventoryEdit(item)}>
                              编辑
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 库存编辑弹窗 */}
        <Modal isOpen={showInventoryModal} onClose={() => setShowInventoryModal(false)} title="编辑库存" width="450px">
          {editingInventory && (
            <>
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>编码：</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{editingInventory.itemCode}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>名称：</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{editingInventory.itemName}</span>
                  </div>
                </div>
              </div>

              <Input 
                label="当前库存数量" 
                type="number" 
                value={inventoryForm.quantity} 
                onChange={v => setInventoryForm({ ...inventoryForm, quantity: v })} 
                required 
              />
              <Input 
                label="安全库存" 
                type="number" 
                value={inventoryForm.safetyStock} 
                onChange={v => setInventoryForm({ ...inventoryForm, safetyStock: v })} 
              />

              {/* 库存变化提示 */}
              {editingInventory.quantity !== parseFloat(inventoryForm.quantity) && (
                <div style={{ 
                  padding: '12px 16px', 
                  background: parseFloat(inventoryForm.quantity) > editingInventory.quantity ? '#f0fdf4' : '#fef2f2', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  border: `1px solid ${parseFloat(inventoryForm.quantity) > editingInventory.quantity ? '#10b981' : '#ef4444'}`
                }}>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>库存变化</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: parseFloat(inventoryForm.quantity) > editingInventory.quantity ? '#10b981' : '#ef4444' }}>
                    {editingInventory.quantity} → {inventoryForm.quantity || 0}
                    <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                      ({parseFloat(inventoryForm.quantity) > editingInventory.quantity ? '+' : ''}{(parseFloat(inventoryForm.quantity) || 0) - editingInventory.quantity})
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowInventoryModal(false)}>取消</Button>
                <Button icon={Save} onClick={handleSaveInventory}>保存</Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    );
  }

  // 仓库列表视图
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>仓库管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理仓库信息和库存</p>
        </div>
        {isAdmin && <Button icon={Plus} onClick={() => openModal()}>新增</Button>}
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="搜索..." value={keyword} onChange={(e) => setKeyword(e.target.value)} 
              style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>刷新</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={Warehouse} title="暂无仓库" description="点击新增按钮添加仓库" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>仓库编码</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>仓库名称</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>位置</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>容量</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>管理员</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(warehouse => (
                  <tr key={warehouse.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} 
                      onClick={() => handleWarehouseClick(warehouse)}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {warehouse.warehouseCode || warehouse.warehouse_code}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Warehouse size={18} style={{ color: '#3b82f6' }} />
                        {warehouse.name}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{warehouse.location}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                      {(warehouse.capacity || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{warehouse.manager || '-'}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button size="sm" variant="success" icon={Box} onClick={() => handleWarehouseClick(warehouse)}>库存</Button>
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(warehouse)}>编辑</Button>
                            <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(warehouse.id)}>删除</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingWarehouse ? '编辑仓库' : '新增仓库'}>
        <Input label="仓库编码" value={formData.warehouseCode} onChange={v => setFormData({ ...formData, warehouseCode: v })} required placeholder="如: WH001" />
        <Input label="仓库名称" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required placeholder="如: 主仓库" />
        <Input label="位置" value={formData.location} onChange={v => setFormData({ ...formData, location: v })} placeholder="如: 上海市浦东新区" />
        <Input label="容量" type="number" value={formData.capacity} onChange={v => setFormData({ ...formData, capacity: parseInt(v) || 0 })} />
        <Input label="管理员" value={formData.manager} onChange={v => setFormData({ ...formData, manager: v })} placeholder="负责人姓名" />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

export default WarehouseManagementPage;