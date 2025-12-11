// src/pages/PurchaseOrderPage.jsx - 修复版（添加关联销售订单）
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Plus, Search, RefreshCw, Edit, Trash2, Save, ShoppingCart, ArrowRight, X, FileText } from 'lucide-react';
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { PO_STATUS } from "@/config/constants";
import { formatDate, formatDateInput } from "@/utils/helpers";

// ============ 内置 UI 组件 ============
const Card = memo(({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', ...style }}>{children}</div>
));

const Button = memo(({ children, onClick, variant = 'primary', icon: Icon, size = 'md', disabled = false, style = {} }) => {
  const baseStyle = { display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, borderRadius: size === 'sm' ? '8px' : '12px', transition: 'all 0.2s', padding: size === 'sm' ? '8px 12px' : '12px 20px', fontSize: size === 'sm' ? '12px' : '14px', opacity: disabled ? 0.5 : 1, ...style };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', color: '#fff' },
    secondary: { background: '#f1f5f9', color: '#374151' },
    danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' },
    success: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }
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
      <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', border: '4px solid #e2e8f0', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#64748b' }}>加载中...</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
));

const StatusTag = memo(({ status, statusMap }) => {
  const info = statusMap[status] || { text: status, color: '#64748b', bgColor: '#f1f5f9' };
  return <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: info.color, background: info.bgColor }}>{info.text}</span>;
});

// ============ 采购订单页面 ============
const PurchaseOrderPage = memo(() => {
  const { request } = useApi();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]); // ✨ 销售订单列表
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // ✨ 添加 salesOrderId 字段
  const [formData, setFormData] = useState({ 
    materialId: '', supplierId: '', salesOrderId: '', 
    quantity: 0, unitPrice: 0, orderDate: '', expectedDate: '', 
    status: 'draft', remark: '' 
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, materialsRes, suppliersRes, salesOrdersRes] = await Promise.all([
      request('/api/purchase-orders'),
      request('/api/materials'),
      request('/api/suppliers'),
      request('/api/sales-orders') // ✨ 获取销售订单
    ]);
    if (ordersRes.success) setOrders(ordersRes.data?.list || ordersRes.data || []);
    if (materialsRes.success) setMaterials(materialsRes.data?.list || materialsRes.data || []);
    if (suppliersRes.success) setSuppliers(suppliersRes.data?.list || suppliersRes.data || []);
    if (salesOrdersRes.success) setSalesOrders(salesOrdersRes.data?.list || salesOrdersRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const submitData = {
      materialId: parseInt(formData.materialId), 
      supplierId: parseInt(formData.supplierId),
      salesOrderId: formData.salesOrderId ? parseInt(formData.salesOrderId) : null, // ✨ 关联销售订单
      quantity: parseInt(formData.quantity) || 0, 
      unitPrice: parseFloat(formData.unitPrice) || 0,
      orderDate: formData.orderDate, 
      expectedDate: formData.expectedDate,
      status: formData.status || 'draft', 
      remark: formData.remark || ''
    };
    const endpoint = editingOrder ? `/api/purchase-orders/${editingOrder.id}` : '/api/purchase-orders';
    const method = editingOrder ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(submitData) });
    if (res.success) { setShowModal(false); fetchData(); alert('保存成功！'); }
    else { alert(res.message || '操作失败'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该采购单吗？')) return;
    const res = await request(`/api/purchase-orders/${id}`, { method: 'DELETE' });
    if (res.success) { fetchData(); alert('删除成功！'); } else { alert(res.message || '删除失败'); }
  };

  const handleStatusChange = async (order, newStatus) => {
    const updateData = {
      materialId: parseInt(order.materialId || order.material_id),
      supplierId: parseInt(order.supplierId || order.supplier_id),
      salesOrderId: order.salesOrderId || order.sales_order_id || null, // ✨ 保留关联
      quantity: parseInt(order.quantity) || 0,
      unitPrice: parseFloat(order.unitPrice || order.unit_price) || 0,
      orderDate: formatDateInput(order.orderDate || order.order_date),
      expectedDate: formatDateInput(order.expectedDate || order.expected_date),
      status: newStatus, 
      remark: order.remark || ''
    };
    const res = await request(`/api/purchase-orders/${order.id}`, { method: 'PUT', body: JSON.stringify(updateData) });
    if (res.success) { fetchData(); alert(`状态已更新为"${PO_STATUS[newStatus]?.text || newStatus}"`); }
    else { alert(res.message || '状态更新失败'); }
  };

  const openModal = (order = null) => {
    setEditingOrder(order);
    if (order) {
      setFormData({
        materialId: order.materialId || order.material_id || '',
        supplierId: order.supplierId || order.supplier_id || '',
        salesOrderId: order.salesOrderId || order.sales_order_id || '', // ✨ 关联销售订单
        quantity: order.quantity || 0, 
        unitPrice: order.unitPrice || order.unit_price || 0,
        orderDate: formatDateInput(order.orderDate || order.order_date),
        expectedDate: formatDateInput(order.expectedDate || order.expected_date),
        status: order.status || 'draft', 
        remark: order.remark || ''
      });
    } else {
      setFormData({ 
        materialId: '', supplierId: '', salesOrderId: '', 
        quantity: 0, unitPrice: 0, 
        orderDate: new Date().toISOString().split('T')[0], expectedDate: '', 
        status: 'draft', remark: '' 
      });
    }
    setShowModal(true);
  };

  // ✨ 获取销售订单名称
  const getSalesOrderName = (salesOrderId) => {
    if (!salesOrderId) return '-';
    const so = salesOrders.find(s => s.id == salesOrderId);
    return so ? `${so.orderNo} (${so.customerName || '未知客户'})` : `SO#${salesOrderId}`;
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
            <input type="text" placeholder="搜索采购单号或物料..." value={keyword} onChange={(e) => setKeyword(e.target.value)} 
              style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'draft', 'confirmed', 'shipped', 'arrived'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} style={{ 
                padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                background: statusFilter === status ? 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' : '#f1f5f9', 
                color: statusFilter === status ? '#fff' : '#64748b' 
              }}>
                {status === 'all' ? '全部' : (PO_STATUS[status]?.text || status)}
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
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>采购单号</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>物料</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>供应商</th>
                  {/* ✨ 新增关联销售订单列 */}
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>关联销售单</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>数量</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>金额</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>预计到货</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const statusInfo = PO_STATUS[order.status] || {};
                  const salesOrderId = order.salesOrderId || order.sales_order_id;
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.poNo}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.materialName || '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{order.supplierName || '-'}</td>
                      {/* ✨ 显示关联销售订单 */}
                      <td style={{ padding: '16px', fontSize: '13px' }}>
                        {salesOrderId ? (
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', background: '#fff7ed', color: '#f97316', 
                            borderRadius: '6px', fontWeight: 600, fontSize: '12px'
                          }}>
                            <FileText size={12} />
                            {getSalesOrderName(salesOrderId)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>通用采购</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{(order.quantity || 0).toLocaleString()}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#10b981', textAlign: 'right' }}>¥{(order.totalAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{formatDate(order.expectedDate)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}><StatusTag status={order.status} statusMap={PO_STATUS} /></td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {statusInfo.next && (
                            <Button size="sm" variant="success" icon={ArrowRight} onClick={() => handleStatusChange(order, statusInfo.next)}>
                              {PO_STATUS[statusInfo.next]?.text || statusInfo.next}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOrder ? '编辑采购单' : '新增采购单'} width="600px">
        {editingOrder && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>采购单号</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{editingOrder.poNo}</div>
          </div>
        )}
        
        {/* ✨ 关联销售订单选择 */}
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '12px', color: '#f97316', marginBottom: '8px', fontWeight: 600 }}>📋 关联销售订单（可选）</div>
          <select 
            value={formData.salesOrderId} 
            onChange={e => setFormData({ ...formData, salesOrderId: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '2px solid #93c5fd', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">不关联（通用采购）</option>
            {salesOrders.map(so => (
              <option key={so.id} value={so.id}>
                {so.orderNo} - {so.customerName || '未知客户'}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            选择销售订单后，此采购将记录为该订单的物料采购
          </div>
        </div>
        
        <Select label="物料" value={formData.materialId} onChange={v => setFormData({ ...formData, materialId: v })} required
          options={materials.map(m => ({ value: m.id, label: `${m.materialCode || m.material_code} - ${m.name}` }))} />
        <Select label="供应商" value={formData.supplierId} onChange={v => setFormData({ ...formData, supplierId: v })} required
          options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="数量" type="number" value={formData.quantity} onChange={v => setFormData({ ...formData, quantity: v })} required />
          <Input label="单价" type="number" value={formData.unitPrice} onChange={v => setFormData({ ...formData, unitPrice: v })} required />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="订单日期" type="date" value={formData.orderDate} onChange={v => setFormData({ ...formData, orderDate: v })} required />
          <Input label="预计到货" type="date" value={formData.expectedDate} onChange={v => setFormData({ ...formData, expectedDate: v })} required />
        </div>

        {isAdmin && editingOrder && (
          <Select label="状态（仅管理员可修改）" value={formData.status} onChange={v => setFormData({ ...formData, status: v })} 
            options={Object.entries(PO_STATUS).map(([k, v]) => ({ value: k, label: v.text }))} />
        )}

        {/* 状态流转说明 */}
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>状态流转说明</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}>草稿</span><span>→</span>
            <span style={{ padding: '4px 8px', background: '#ffedd5', color: '#f97316', borderRadius: '4px' }}>已确认</span><span>→</span>
            <span style={{ padding: '4px 8px', background: '#ede9fe', color: '#8b5cf6', borderRadius: '4px' }}>已发货</span><span>→</span>
            <span style={{ padding: '4px 8px', background: '#d1fae5', color: '#10b981', borderRadius: '4px' }}>已到货</span>
          </div>
        </div>

        <Input label="备注" value={formData.remark} onChange={v => setFormData({ ...formData, remark: v })} placeholder="备注信息..." />
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

export default PurchaseOrderPage;

