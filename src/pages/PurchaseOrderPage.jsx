// src/pages/PurchaseOrderPage.jsx
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Plus, Search, RefreshCw, Edit, Trash2, Save, ShoppingCart, ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { PO_STATUS } from '../config/constants';
import { formatDate, formatDateInput } from '../utils/helpers';

const PurchaseOrderPage = memo(({
  // 临时props：从App.jsx传入UI组件
  Button,
  Input,
  Select,
  Modal,
  Card,
  EmptyState,
  LoadingScreen,
  StatusTag
}) => {
  const { request } = useApi();
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    materialId: '', supplierId: '', quantity: 0, unitPrice: 0, orderDate: '', expectedDate: '', remark: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, materialsRes, suppliersRes] = await Promise.all([
      request('/api/purchase-orders'),
      request('/api/materials'),
      request('/api/suppliers')
    ]);
    if (ordersRes.success) setOrders(ordersRes.data?.list || ordersRes.data || []);
    if (materialsRes.success) setMaterials(materialsRes.data?.list || materialsRes.data || []);
    if (suppliersRes.success) setSuppliers(suppliersRes.data?.list || suppliersRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const endpoint = editingOrder ? `/api/purchase-orders/${editingOrder.id}` : '/api/purchase-orders';
    const method = editingOrder ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify({ ...formData, totalAmount: formData.quantity * formData.unitPrice }) });
    if (res.success) { setShowModal(false); fetchData(); }
    else alert(res.message || '操作失败');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该采购订单吗？')) return;
    const res = await request(`/api/purchase-orders/${id}`, { method: 'DELETE' });
    if (res.success) fetchData();
    else alert(res.message || '删除失败');
  };

  const handleStatusChange = async (id, newStatus) => {
    const res = await request(`/api/purchase-orders/${id}/confirm`, { method: 'POST', body: JSON.stringify({ status: newStatus }) });
    if (res.success) fetchData();
    else alert(res.message || '状态更新失败');
  };

  const openModal = (order = null) => {
    setEditingOrder(order);
    if (order) {
      setFormData({
        materialId: order.materialId, supplierId: order.supplierId, quantity: order.quantity, unitPrice: order.unitPrice || 0,
        orderDate: formatDateInput(order.orderDate), expectedDate: formatDateInput(order.expectedDate), remark: order.remark || ''
      });
    } else {
      setFormData({ materialId: '', supplierId: '', quantity: 0, unitPrice: 0, orderDate: new Date().toISOString().split('T')[0], expectedDate: '', remark: '' });
    }
    setShowModal(true);
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
            <input type="text" placeholder="搜索采购单号或物料..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'draft', 'confirmed', 'producing', 'shipped', 'arrived'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', background: statusFilter === status ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9', color: statusFilter === status ? '#fff' : '#64748b', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                {status === 'all' ? '全部' : PO_STATUS[status]?.text}
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
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>采购单号</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>物料</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>供应商</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>数量</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>金额</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>预计到货</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const statusInfo = PO_STATUS[order.status];
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.poNo}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.materialName}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{order.supplierName}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{order.quantity?.toLocaleString()}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#10b981', textAlign: 'right' }}>¥{(order.totalAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{formatDate(order.expectedDate)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}><StatusTag status={order.status} statusMap={PO_STATUS} /></td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {statusInfo?.next && (
                            <Button size="sm" variant="success" icon={ArrowRight} onClick={() => handleStatusChange(order.id, statusInfo.next)}>
                              {PO_STATUS[statusInfo.next]?.text}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOrder ? '编辑采购单' : '新增采购单'}>
        <Select label="物料" value={formData.materialId} onChange={v => setFormData({ ...formData, materialId: v })} required options={materials.map(m => ({ value: m.id, label: `${m.materialCode} - ${m.name}` }))} />
        <Select label="供应商" value={formData.supplierId} onChange={v => setFormData({ ...formData, supplierId: v })} required options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="数量" type="number" value={formData.quantity} onChange={v => setFormData({ ...formData, quantity: parseInt(v) || 0 })} required />
          <Input label="单价" type="number" value={formData.unitPrice} onChange={v => setFormData({ ...formData, unitPrice: parseFloat(v) || 0 })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="下单日期" type="date" value={formData.orderDate} onChange={v => setFormData({ ...formData, orderDate: v })} required />
          <Input label="预计到货日期" type="date" value={formData.expectedDate} onChange={v => setFormData({ ...formData, expectedDate: v })} required />
        </div>
        <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>订单金额</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>¥{(formData.quantity * formData.unitPrice).toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

export default PurchaseOrderPage;