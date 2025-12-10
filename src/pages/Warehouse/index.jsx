// src/pages/WarehouseManagementPage.jsx - 修复版（添加/删除库存功能）
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Warehouse, Plus, Search, RefreshCw, Edit, Trash2, Save, X, Package, Box, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

// ============ 内置 UI 组件 ============
const Card = memo(({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', ...style }}>{children}</div>
));

const Button = memo(({ children, onClick, variant = 'primary', icon: Icon, size = 'md', disabled = false, style = {} }) => {
  const baseStyle = { display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, borderRadius: size === 'sm' ? '8px' : '12px', transition: 'all 0.2s', padding: size === 'sm' ? '8px 12px' : '12px 20px', fontSize: size === 'sm' ? '12px' : '14px', opacity: disabled ? 0.5 : 1, ...style };
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
    <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={28} style={{ color: '#94a3b8' }} /></div>
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
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [formData, setFormData] = useState({ warehouseCode: '', name: '', location: '', capacity: 0, manager: '' });
  
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

  // ✨ 添加库存弹窗
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [addInventoryType, setAddInventoryType] = useState('material');
  const [addInventoryForm, setAddInventoryForm] = useState({ itemId: '', quantity: 0, safetyStock: 100 });

  // 初始化库存状态
  const [syncing, setSyncing] = useState(false);

  // 获取仓库列表
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [whRes, matRes, prodRes] = await Promise.all([
      request('/api/warehouses'),
      request('/api/materials'),
      request('/api/products')
    ]);
    if (whRes.success) setWarehouses(whRes.data?.list || whRes.data || []);
    if (matRes.success) setMaterials(matRes.data?.list || matRes.data || []);
    if (prodRes.success) setProducts(prodRes.data?.list || prodRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 获取仓库库存
  const fetchInventory = useCallback(async (warehouseId) => {
    setInventoryLoading(true);
    
    try {
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
    if (res.success) { setShowModal(false); fetchData(); alert('保存成功！'); }
    else { alert(res.message || '操作失败'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该仓库吗？')) return;
    const res = await request(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (res.success) { fetchData(); alert('删除成功！'); }
    else { alert(res.message || '删除失败'); }
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
    setInventoryForm({ quantity: item.quantity || 0, safetyStock: item.safetyStock || 0 });
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

  // ✨ 删除库存
  const handleDeleteInventory = async (item) => {
    if (!window.confirm(`确定要删除"${item.itemName}"的库存记录吗？`)) return;
    
    const res = await request(`/api/inventory/${item.id}?type=${item.type}`, { method: 'DELETE' });
    if (res.success) {
      fetchInventory(selectedWarehouse.id);
      alert('库存删除成功！');
    } else {
      alert(res.message || '删除失败');
    }
  };

  // ✨ 打开添加库存弹窗
  const openAddInventory = (type) => {
    setAddInventoryType(type);
    setAddInventoryForm({ itemId: '', quantity: 0, safetyStock: 100 });
    setShowAddInventoryModal(true);
  };

  // ✨ 添加库存
  const handleAddInventory = async () => {
    if (!addInventoryForm.itemId) {
      alert('请选择物料/产品');
      return;
    }
    
    const res = await request('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({
        type: addInventoryType,
        itemId: parseInt(addInventoryForm.itemId),
        warehouseId: selectedWarehouse.id,
        quantity: parseFloat(addInventoryForm.quantity) || 0,
        safetyStock: parseFloat(addInventoryForm.safetyStock) || 100
      })
    });
    
    if (res.success) {
      setShowAddInventoryModal(false);
      fetchInventory(selectedWarehouse.id);
      alert('库存添加成功！');
    } else {
      alert(res.message || '添加失败（可能该项目已存在）');
    }
  };

  // 初始化物料库存
  const initMaterialInventory = async () => {
    if (!window.confirm('确定要初始化物料库存吗？这会为该仓库添加所有物料的库存记录（初始数量为0）')) return;
    
    setSyncing(true);
    let successCount = 0, skipCount = 0;
    
    for (const mat of materials) {
      const res = await request('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          type: 'material',
          itemId: mat.id,
          warehouseId: selectedWarehouse.id,
          quantity: 0,
          safetyStock: mat.safetyStock || mat.safety_stock || 100
        })
      });
      if (res.success) successCount++;
      else skipCount++;
    }
    
    alert(`物料库存初始化完成！\n新增: ${successCount} 条\n跳过（已存在）: ${skipCount} 条`);
    fetchInventory(selectedWarehouse.id);
    setSyncing(false);
  };

  // 初始化产品库存
  const initProductInventory = async () => {
    if (!window.confirm('确定要初始化产品库存吗？这会为该仓库添加所有产品的库存记录（初始数量为0）')) return;
    
    setSyncing(true);
    let successCount = 0, skipCount = 0;
    
    for (const prod of products) {
      const res = await request('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          type: 'product',
          itemId: prod.id,
          warehouseId: selectedWarehouse.id,
          quantity: 0,
          safetyStock: 100
        })
      });
      if (res.success) successCount++;
      else skipCount++;
    }
    
    alert(`产品库存初始化完成！\n新增: ${successCount} 条\n跳过（已存在）: ${skipCount} 条`);
    fetchInventory(selectedWarehouse.id);
    setSyncing(false);
  };

  const filtered = warehouses.filter(w => 
    !keyword || w.name?.includes(keyword) || w.warehouseCode?.includes(keyword) || w.location?.includes(keyword)
  );

  if (loading) return <LoadingScreen />;

  // 库存详情视图
  if (selectedWarehouse) {
    const currentInventory = inventoryTab === 'materials' ? materialInventory : productInventory;
    const lowStockCount = currentInventory.filter(i => i.quantity < i.safetyStock).length;
    
    // 获取未添加的物料/产品列表（用于添加弹窗）
    const existingMaterialIds = materialInventory.map(i => i.itemId);
    const existingProductIds = productInventory.map(i => i.itemId);
    const availableMaterials = materials.filter(m => !existingMaterialIds.includes(m.id));
    const availableProducts = products.filter(p => !existingProductIds.includes(p.id));
    
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Button variant="secondary" icon={ArrowLeft} onClick={handleBackToList}>返回</Button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{selectedWarehouse.name} - 库存管理</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{selectedWarehouse.location} | 容量: {(selectedWarehouse.capacity || 0).toLocaleString()}</p>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* ✨ 添加按钮 */}
              {canEdit && (
                <Button variant="success" icon={Plus} onClick={() => openAddInventory(inventoryTab === 'materials' ? 'material' : 'product')}>
                  添加{inventoryTab === 'materials' ? '物料' : '产品'}
                </Button>
              )}
              {/* 初始化按钮 */}
              {canEdit && inventoryTab === 'materials' && materialInventory.length === 0 && (
                <Button variant="warning" icon={Plus} onClick={initMaterialInventory} disabled={syncing}>
                  {syncing ? '初始化中...' : '初始化物料库存'}
                </Button>
              )}
              {canEdit && inventoryTab === 'products' && productInventory.length === 0 && (
                <Button variant="warning" icon={Plus} onClick={initProductInventory} disabled={syncing}>
                  {syncing ? '初始化中...' : '初始化产品库存'}
                </Button>
              )}
              <Button variant="secondary" icon={RefreshCw} onClick={() => fetchInventory(selectedWarehouse.id)}>刷新</Button>
            </div>
          </div>
        </Card>

        {/* 库存表格 */}
        <Card>
          {inventoryLoading ? (
            <LoadingScreen />
          ) : currentInventory.length === 0 ? (
            <EmptyState icon={inventoryTab === 'materials' ? Package : Box} title={`暂无${inventoryTab === 'materials' ? '物料' : '产品'}库存`} description="点击上方按钮添加或初始化库存" />
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
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: isLow ? '#ef4444' : '#0f172a', textAlign: 'right' }}>{(item.quantity || 0).toLocaleString()}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', textAlign: 'right' }}>{(item.safetyStock || 0).toLocaleString()}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {isCritical ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}><AlertTriangle size={14} /> 严重不足</span>
                          ) : isLow ? (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#fef3c7', color: '#f59e0b' }}>库存不足</span>
                          ) : (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#d1fae5', color: '#10b981' }}>正常</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {canEdit && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <Button size="sm" variant="secondary" icon={Edit} onClick={() => openInventoryEdit(item)}>编辑</Button>
                              <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDeleteInventory(item)}>删除</Button>
                            </div>
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
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>编码：</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{editingInventory.itemCode}</span></div>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>名称：</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{editingInventory.itemName}</span></div>
                </div>
              </div>
              <Input label="当前库存数量" type="number" value={inventoryForm.quantity} onChange={v => setInventoryForm({ ...inventoryForm, quantity: v })} required />
              <Input label="安全库存" type="number" value={inventoryForm.safetyStock} onChange={v => setInventoryForm({ ...inventoryForm, safetyStock: v })} />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setShowInventoryModal(false)}>取消</Button>
                <Button icon={Save} onClick={handleSaveInventory}>保存</Button>
              </div>
            </>
          )}
        </Modal>

        {/* ✨ 添加库存弹窗 */}
        <Modal isOpen={showAddInventoryModal} onClose={() => setShowAddInventoryModal(false)} title={`添加${addInventoryType === 'material' ? '物料' : '产品'}库存`} width="500px">
          <Select 
            label={addInventoryType === 'material' ? '选择物料' : '选择产品'} 
            value={addInventoryForm.itemId} 
            onChange={v => setAddInventoryForm({ ...addInventoryForm, itemId: v })} 
            required
            options={
              addInventoryType === 'material' 
                ? availableMaterials.map(m => ({ value: m.id, label: `${m.materialCode || m.material_code} - ${m.name}` }))
                : availableProducts.map(p => ({ value: p.id, label: `${p.productCode || p.product_code} - ${p.name}` }))
            }
          />
          <Input label="初始库存数量" type="number" value={addInventoryForm.quantity} onChange={v => setAddInventoryForm({ ...addInventoryForm, quantity: v })} />
          <Input label="安全库存" type="number" value={addInventoryForm.safetyStock} onChange={v => setAddInventoryForm({ ...addInventoryForm, safetyStock: v })} />
          
          {((addInventoryType === 'material' && availableMaterials.length === 0) || (addInventoryType === 'product' && availableProducts.length === 0)) && (
            <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', marginBottom: '16px', color: '#92400e', fontSize: '13px' }}>
              所有{addInventoryType === 'material' ? '物料' : '产品'}都已添加到该仓库
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowAddInventoryModal(false)}>取消</Button>
            <Button icon={Save} onClick={handleAddInventory} disabled={!addInventoryForm.itemId}>添加</Button>
          </div>
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
                  <tr key={warehouse.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => handleWarehouseClick(warehouse)}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{warehouse.warehouseCode || warehouse.warehouse_code}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Warehouse size={18} style={{ color: '#3b82f6' }} />{warehouse.name}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{warehouse.location}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{(warehouse.capacity || 0).toLocaleString()}</td>
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