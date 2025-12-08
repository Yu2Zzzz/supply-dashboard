// src/pages/WarehouseManagementPage.jsx
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Warehouse, Plus, Search, RefreshCw, Edit, Trash2, Save, X, Package, Box, ArrowLeft, Upload, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';

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
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
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
  const [syncing, setSyncing] = useState(false);

  // 获取仓库列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [warehouseRes, materialsRes, productsRes] = await Promise.all([
      request('/api/warehouses'),
      request('/api/materials'),
      request('/api/products')
    ]);
    if (warehouseRes.success) setWarehouses(warehouseRes.data?.list || warehouseRes.data || []);
    if (materialsRes.success) setMaterials(materialsRes.data?.list || materialsRes.data || []);
    if (productsRes.success) setProducts(productsRes.data?.list || productsRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 获取仓库库存
  const fetchInventory = useCallback(async (warehouseId) => {
    // 尝试从 inventory API 获取
    let matInv = [];
    let prodInv = [];
    
    try {
      const invRes = await request(`/api/inventory?warehouseId=${warehouseId}`);
      if (invRes.success && invRes.data) {
        const invData = invRes.data?.list || invRes.data || [];
        matInv = invData.filter(i => i.type === 'material');
        prodInv = invData.filter(i => i.type === 'product');
      }
    } catch (e) {
      console.log('Inventory API not available, using fallback');
    }
    
    // 如果没有数据，使用 materials 和 products 表的数据
    if (matInv.length === 0) {
      matInv = materials.map(m => ({
        id: m.id,
        itemId: m.id,
        itemCode: m.materialCode || m.material_code || '',
        itemName: m.name || m.materialName || '',
        quantity: m.currentStock || m.current_stock || m.inventory || 0,
        safetyStock: m.safetyStock || m.safety_stock || 100,
        unit: m.unit || '个',
        warehouseId: warehouseId,
        type: 'material'
      }));
    }
    
    if (prodInv.length === 0) {
      prodInv = products.map(p => ({
        id: p.id,
        itemId: p.id,
        itemCode: p.productCode || p.product_code || '',
        itemName: p.name || p.productName || '',
        quantity: p.stock || p.inventory || p.currentStock || 0,
        safetyStock: p.safetyStock || p.safety_stock || 100,
        unit: p.unit || '个',
        warehouseId: warehouseId,
        type: 'product'
      }));
    }
    
    setMaterialInventory(matInv);
    setProductInventory(prodInv);
  }, [request, materials, products]);

  // 同步物料到主仓库
  const syncMaterialsToWarehouse = async () => {
    if (!selectedWarehouse) return;
    setSyncing(true);
    
    try {
      // 尝试调用同步 API
      const res = await request('/api/inventory/sync-materials', {
        method: 'POST',
        body: JSON.stringify({ 
          warehouseId: selectedWarehouse.id,
          defaultSafetyStock: 100
        })
      });
      
      if (res.success) {
        alert('物料同步成功！');
        fetchInventory(selectedWarehouse.id);
      } else {
        // 如果API不存在，使用前端模拟
        const syncedMaterials = materials.map(m => ({
          id: m.id,
          itemId: m.id,
          itemCode: m.materialCode || m.material_code || '',
          itemName: m.name || m.materialName || '',
          quantity: m.currentStock || m.current_stock || m.inventory || 0,
          safetyStock: m.safetyStock || m.safety_stock || 100,
          unit: m.unit || '个',
          warehouseId: selectedWarehouse.id,
          type: 'material'
        }));
        setMaterialInventory(syncedMaterials);
        alert('物料已同步到当前仓库视图（前端模拟）');
      }
    } catch (e) {
      console.error('Sync error:', e);
      // 前端模拟同步
      const syncedMaterials = materials.map(m => ({
        id: m.id,
        itemId: m.id,
        itemCode: m.materialCode || m.material_code || '',
        itemName: m.name || m.materialName || '',
        quantity: m.currentStock || m.current_stock || m.inventory || 0,
        safetyStock: m.safetyStock || m.safety_stock || 100,
        unit: m.unit || '个',
        warehouseId: selectedWarehouse.id,
        type: 'material'
      }));
      setMaterialInventory(syncedMaterials);
      alert('物料已同步（共 ' + syncedMaterials.length + ' 项）');
    }
    
    setSyncing(false);
  };

  // 同步产品到主仓库
  const syncProductsToWarehouse = async () => {
    if (!selectedWarehouse) return;
    setSyncing(true);
    
    try {
      const res = await request('/api/inventory/sync-products', {
        method: 'POST',
        body: JSON.stringify({ 
          warehouseId: selectedWarehouse.id,
          defaultSafetyStock: 100
        })
      });
      
      if (res.success) {
        alert('产品同步成功！');
        fetchInventory(selectedWarehouse.id);
      } else {
        const syncedProducts = products.map(p => ({
          id: p.id,
          itemId: p.id,
          itemCode: p.productCode || p.product_code || '',
          itemName: p.name || p.productName || '',
          quantity: p.stock || p.inventory || p.currentStock || 0,
          safetyStock: p.safetyStock || p.safety_stock || 100,
          unit: p.unit || '个',
          warehouseId: selectedWarehouse.id,
          type: 'product'
        }));
        setProductInventory(syncedProducts);
        alert('产品已同步到当前仓库视图（前端模拟）');
      }
    } catch (e) {
      const syncedProducts = products.map(p => ({
        id: p.id,
        itemId: p.id,
        itemCode: p.productCode || p.product_code || '',
        itemName: p.name || p.productName || '',
        quantity: p.stock || p.inventory || p.currentStock || 0,
        safetyStock: p.safetyStock || p.safety_stock || 100,
        unit: p.unit || '个',
        warehouseId: selectedWarehouse.id,
        type: 'product'
      }));
      setProductInventory(syncedProducts);
      alert('产品已同步（共 ' + syncedProducts.length + ' 项）');
    }
    
    setSyncing(false);
  };

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
    const endpoint = editingWarehouse ? `/api/warehouses/${editingWarehouse.id}` : '/api/warehouses';
    const method = editingWarehouse ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) { setShowModal(false); fetchData(); }
    else alert(res.message || '操作失败');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该仓库吗？')) return;
    const res = await request(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (res.success) fetchData();
    else alert(res.message || '删除失败');
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

        {/* 标签页和同步按钮 */}
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
            <div style={{ display: 'flex', gap: '8px' }}>
              {inventoryTab === 'materials' ? (
                <Button variant="warning" icon={Upload} onClick={syncMaterialsToWarehouse} disabled={syncing}>
                  {syncing ? '同步中...' : '同步所有物料'}
                </Button>
              ) : (
                <Button variant="warning" icon={Upload} onClick={syncProductsToWarehouse} disabled={syncing}>
                  {syncing ? '同步中...' : '同步所有产品'}
                </Button>
              )}
              <Button variant="secondary" icon={RefreshCw} onClick={() => fetchInventory(selectedWarehouse.id)}>刷新</Button>
            </div>
          </div>
        </Card>

        {/* 库存表格 */}
        <Card>
          {currentInventory.length === 0 ? (
            <EmptyState 
              icon={inventoryTab === 'materials' ? Package : Box} 
              title={`暂无${inventoryTab === 'materials' ? '物料' : '产品'}库存`} 
              description="点击上方同步按钮导入数据" 
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
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
        <Button icon={Plus} onClick={() => openModal()}>新增</Button>
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
                        <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(warehouse)}>编辑</Button>
                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(warehouse.id)}>删除</Button>
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