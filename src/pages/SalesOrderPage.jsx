// src/pages/SalesOrderPage.jsx - 修复版（新增客户+状态按钮优化）
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Plus, Search, RefreshCw, Edit, Trash2, Save, FileText, ArrowRight, Package, X, UserPlus } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { SO_STATUS } from '../config/constants';
import { formatDate, formatDateInput } from '../utils/helpers';

// ============ 内置 UI 组件 ============
const Card = memo(({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', ...style }}>{children}</div>
));

const Button = memo(({ children, onClick, variant = 'primary', icon: Icon, size = 'md', disabled = false, style = {} }) => {
  const baseStyle = { display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, borderRadius: size === 'sm' ? '8px' : '12px', transition: 'all 0.2s', padding: size === 'sm' ? '8px 12px' : '12px 20px', fontSize: size === 'sm' ? '12px' : '14px', opacity: disabled ? 0.5 : 1, ...style };
  const variants = {
    primary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff' },
    secondary: { background: '#f1f5f9', color: '#374151' },
    danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff' },
    success: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' },
    warning: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' },
    info: { background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff' }
  };
  return <button style={{ ...baseStyle, ...variants[variant] }} onClick={onClick} disabled={disabled}>{Icon && <Icon size={size === 'sm' ? 14 : 18} />}{children}</button>;
});

const Input = memo(({ label, value, onChange, placeholder, type = 'text', required = false, disabled = false, step }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} step={step}
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

const StatusTag = memo(({ status, statusMap }) => {
  const info = statusMap[status] || { text: status, color: '#64748b', bgColor: '#f1f5f9' };
  return <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: info.color, background: info.bgColor }}>{info.text}</span>;
});

// ============ 业务订单页面 ============
const SalesOrderPage = memo(() => {
  const { request } = useApi();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLinesModal, setShowLinesModal] = useState(false);
  const [viewingOrderLines, setViewingOrderLines] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({ customerId: '', orderDate: '', deliveryDate: '', salesPerson: '', status: 'pending', remark: '', lines: [] });

  // ✨ 新增客户弹窗
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ customerCode: '', name: '', contact: '', phone: '', email: '', address: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      request('/api/sales-orders'),
      request('/api/customers'),
      request('/api/products')
    ]);
    if (ordersRes.success) setOrders(ordersRes.data?.list || ordersRes.data || []);
    if (customersRes.success) setCustomers(customersRes.data?.list || customersRes.data || []);
    if (productsRes.success) setProducts(productsRes.data?.list || productsRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDateForApi = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    const submitData = {
      customerId: parseInt(formData.customerId) || formData.customerId,
      orderDate: formatDateForApi(formData.orderDate),
      deliveryDate: formatDateForApi(formData.deliveryDate),
      salesPerson: formData.salesPerson || '',
      status: formData.status || 'pending',
      remark: formData.remark || ''
    };
    if (formData.lines.length > 0) {
      submitData.lines = formData.lines.map(line => ({
        productId: parseInt(line.productId), product_id: parseInt(line.productId),
        quantity: parseInt(line.quantity) || 1, unitPrice: parseFloat(line.unitPrice) || 0, unit_price: parseFloat(line.unitPrice) || 0
      }));
    }
    const endpoint = editingOrder ? `/api/sales-orders/${editingOrder.id}` : '/api/sales-orders';
    const method = editingOrder ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(submitData) });
    if (res.success) { setShowModal(false); alert('保存成功！'); await fetchData(); }
    else { alert(res.message || '操作失败'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该订单吗？')) return;
    const res = await request(`/api/sales-orders/${id}`, { method: 'DELETE' });
    if (res.success) { fetchData(); alert('删除成功！'); } else { alert(res.message || '删除失败'); }
  };

  const handleStatusChange = async (order, newStatus) => {
    const updateData = {
      customerId: parseInt(order.customerId || order.customer_id),
      orderDate: formatDateForApi(order.orderDate || order.order_date),
      deliveryDate: formatDateForApi(order.deliveryDate || order.delivery_date),
      salesPerson: order.salesPerson || order.sales_person || '',
      status: newStatus, remark: order.remark || ''
    };
    const res = await request(`/api/sales-orders/${order.id}`, { method: 'PUT', body: JSON.stringify(updateData) });
    if (res.success) { fetchData(); alert(`状态已更新为"${SO_STATUS[newStatus]?.text || newStatus}"`); }
    else { alert(res.message || '状态更新失败'); }
  };

  // ✨ 新增客户
  const handleAddCustomer = async () => {
    if (!customerForm.customerCode || !customerForm.name) { alert('客户编码和名称不能为空'); return; }
    const res = await request('/api/customers', { method: 'POST', body: JSON.stringify(customerForm) });
    if (res.success) {
      setShowCustomerModal(false);
      setCustomerForm({ customerCode: '', name: '', contact: '', phone: '', email: '', address: '' });
      const customersRes = await request('/api/customers');
      if (customersRes.success) setCustomers(customersRes.data?.list || customersRes.data || []);
      alert('客户添加成功！');
    } else { alert(res.message || '添加失败'); }
  };

  const openModal = (order = null) => {
    setEditingOrder(order);
    if (order) {
      setFormData({
        customerId: order.customerId || order.customer_id || '',
        orderDate: formatDateInput(order.orderDate || order.order_date),
        deliveryDate: formatDateInput(order.deliveryDate || order.delivery_date),
        salesPerson: order.salesPerson || order.sales_person || '',
        status: order.status || 'pending', remark: order.remark || '',
        lines: (order.lines || order.orderLines || []).map(line => ({
          productId: line.productId || line.product_id || '', quantity: line.quantity || 1, unitPrice: line.unitPrice || line.unit_price || 0
        }))
      });
    } else {
      setFormData({ customerId: '', orderDate: new Date().toISOString().split('T')[0], deliveryDate: '', salesPerson: user?.username || '', status: 'pending', remark: '', lines: [] });
    }
    setShowModal(true);
  };

  const viewOrderLines = (order) => { setViewingOrderLines(order); setShowLinesModal(true); };
  const addLine = () => { setFormData({ ...formData, lines: [...formData.lines, { productId: '', quantity: 1, unitPrice: 0 }] }); };
  const updateLine = (idx, field, value) => { const newLines = [...formData.lines]; newLines[idx][field] = value; setFormData({ ...formData, lines: newLines }); };
  const removeLine = (idx) => { setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== idx) }); };
  const getCustomerOptions = () => customers.map(c => ({ value: c.id, label: c.name }));
  const getProductOptions = () => products.map(p => ({ value: p.id, label: `${p.productCode || p.product_code || ''} - ${p.name}` }));
  const getProductName = (productId) => { const product = products.find(p => p.id == productId); return product ? product.name : `产品ID: ${productId}`; };
  const toNumber = (value) => { const num = parseFloat(value); return isNaN(num) ? 0 : num; };
  const filtered = orders.filter(o => { if (statusFilter !== 'all' && o.status !== statusFilter) return false; if (keyword && !o.orderNo?.includes(keyword) && !o.customerName?.includes(keyword)) return false; return true; });

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>业务订单管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理销售订单和状态流转</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>新增订单</Button>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="搜索订单号或客户..." value={keyword} onChange={(e) => setKeyword(e.target.value)} 
              style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'producing', 'shipped', 'completed'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} style={{
                padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                background: statusFilter === status ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9',
                color: statusFilter === status ? '#fff' : '#374151'
              }}>
                {status === 'all' ? '全部' : (SO_STATUS[status]?.text || status)}
              </button>
            ))}
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>刷新</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="暂无订单" description="点击新增订单按钮添加" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>订单号</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>客户</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>下单日期</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>交付日期</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>业务员</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>产品</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const statusInfo = SO_STATUS[order.status] || {};
                  const linesCount = (order.lines || order.orderLines || []).length;
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{order.orderNo}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.customerName}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{formatDate(order.orderDate)}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{formatDate(order.deliveryDate)}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{order.salesPerson || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {linesCount > 0 ? (<Button size="sm" variant="secondary" icon={Package} onClick={() => viewOrderLines(order)}>查看 ({linesCount})</Button>) : (<span style={{ fontSize: '12px', color: '#94a3b8' }}>暂无</span>)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}><StatusTag status={order.status} statusMap={SO_STATUS} /></td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* ✅ 状态流转按钮 */}
                          {statusInfo.next && (
                            <Button size="sm" variant="success" icon={ArrowRight} onClick={() => handleStatusChange(order, statusInfo.next)}>
                              {(SO_STATUS[statusInfo.next]?.text) || statusInfo.next}
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(order)}>编辑</Button>
                          {order.status === 'pending' && (<Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(order.id)}>删除</Button>)}
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

      {/* 查看订单明细 */}
      <Modal isOpen={showLinesModal} onClose={() => setShowLinesModal(false)} title={`订单明细 - ${viewingOrderLines?.orderNo}`} width="600px">
        {viewingOrderLines && (
          <div>
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>客户：</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{viewingOrderLines.customerName}</span></div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>业务员：</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{viewingOrderLines.salesPerson || '-'}</span></div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>下单日期：</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{formatDate(viewingOrderLines.orderDate)}</span></div>
                <div><span style={{ color: '#64748b', fontWeight: 600 }}>交付日期：</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{formatDate(viewingOrderLines.deliveryDate)}</span></div>
              </div>
            </div>
            {(viewingOrderLines.lines || []).length === 0 ? (<EmptyState icon={Package} title="暂无产品明细" description="此订单还没有添加产品" />) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(viewingOrderLines.lines || []).map((line, idx) => {
                  const quantity = toNumber(line.quantity); const unitPrice = toNumber(line.unitPrice || line.unit_price); const subtotal = quantity * unitPrice;
                  return (
                    <div key={idx} style={{ padding: '16px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{getProductName(line.productId || line.product_id)}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#fff', padding: '4px 8px', borderRadius: '6px' }}>#{idx + 1}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>数量：</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{quantity}</span></div>
                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>单价：</span><span style={{ color: '#10b981', fontWeight: 700 }}>¥{unitPrice.toFixed(2)}</span></div>
                        <div><span style={{ color: '#64748b', fontWeight: 600 }}>小计：</span><span style={{ color: '#3b82f6', fontWeight: 700 }}>¥{subtotal.toFixed(2)}</span></div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', border: '2px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#064e3b' }}>订单总额</span>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>¥{(viewingOrderLines.lines || []).reduce((sum, line) => sum + (toNumber(line.quantity) * toNumber(line.unitPrice || line.unit_price)), 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setShowLinesModal(false)}>关闭</Button></div>
          </div>
        )}
      </Modal>

      {/* 编辑/新增订单 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOrder ? '编辑订单' : '新增订单'} width="700px">
        {editingOrder && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>订单号</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{editingOrder.orderNo}</div>
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* ✨ 客户选择 + 新增客户按钮 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>客户<span style={{ color: '#ef4444' }}> *</span></label>
              <button onClick={() => setShowCustomerModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, background: '#dbeafe', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                <UserPlus size={12} /> 新增客户
              </button>
            </div>
            <select value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', cursor: 'pointer' }}>
              <option value="">请选择</option>
              {getCustomerOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <Input label="业务员" value={formData.salesPerson} onChange={v => setFormData({ ...formData, salesPerson: v })} />
          <Input label="下单日期" type="date" value={formData.orderDate} onChange={v => setFormData({ ...formData, orderDate: v })} required />
          <Input label="交付日期" type="date" value={formData.deliveryDate} onChange={v => setFormData({ ...formData, deliveryDate: v })} required />
        </div>
        
        {isAdmin && editingOrder && (
          <Select label="状态（仅管理员可修改）" value={formData.status} onChange={v => setFormData({ ...formData, status: v })} 
            options={Object.entries(SO_STATUS).map(([k, v]) => ({ value: k, label: v.text }))} />
        )}
        
        {/* 状态流转说明 */}
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>状态流转说明</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}>待确认</span><span>→</span>
            <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#3b82f6', borderRadius: '4px' }}>已确认</span><span>→</span>
            <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#f59e0b', borderRadius: '4px' }}>生产中</span><span>→</span>
            <span style={{ padding: '4px 8px', background: '#ede9fe', color: '#8b5cf6', borderRadius: '4px' }}>已发货</span><span>→</span>
            <span style={{ padding: '4px 8px', background: '#d1fae5', color: '#10b981', borderRadius: '4px' }}>已交付</span>
          </div>
          {!isAdmin && <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>* 请使用列表中的状态按钮推进订单状态</div>}
        </div>
        
        {/* 订单明细 */}
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>订单明细 {formData.lines.length > 0 && `(${formData.lines.length} 个产品)`}</h4>
            <Button size="sm" variant="secondary" icon={Plus} onClick={addLine}>添加产品</Button>
          </div>
          {formData.lines.length === 0 ? (<div style={{ padding: '24px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>暂无产品，请点击"添加产品"按钮</div>) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.lines.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ flex: 2 }}><Select label={`产品 ${idx + 1}`} value={line.productId} onChange={v => updateLine(idx, 'productId', v)} options={getProductOptions()} required /></div>
                  <div style={{ flex: 1 }}><Input label="数量" type="number" value={line.quantity} onChange={v => updateLine(idx, 'quantity', v)} required /></div>
                  <div style={{ flex: 1 }}><Input label="单价" type="number" value={line.unitPrice} onChange={v => updateLine(idx, 'unitPrice', v)} step="0.01" /></div>
                  <Button size="sm" variant="danger" icon={Trash2} onClick={() => removeLine(idx)} style={{ marginBottom: '16px' }}>删除</Button>
                </div>
              ))}
            </div>
          )}
          {formData.lines.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#064e3b', fontWeight: 600 }}>订单总额</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>¥{formData.lines.reduce((sum, line) => sum + (toNumber(line.quantity) * toNumber(line.unitPrice)), 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>

      {/* ✨ 新增客户弹窗 */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="新增客户" width="550px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="客户编码" value={customerForm.customerCode} onChange={v => setCustomerForm({ ...customerForm, customerCode: v })} required placeholder="如: CUST001" />
          <Input label="客户名称" value={customerForm.name} onChange={v => setCustomerForm({ ...customerForm, name: v })} required placeholder="如: 天猫国际" />
          <Input label="联系人" value={customerForm.contact} onChange={v => setCustomerForm({ ...customerForm, contact: v })} placeholder="联系人姓名" />
          <Input label="电话" value={customerForm.phone} onChange={v => setCustomerForm({ ...customerForm, phone: v })} placeholder="联系电话" />
          <Input label="邮箱" value={customerForm.email} onChange={v => setCustomerForm({ ...customerForm, email: v })} placeholder="电子邮箱" />
          <Input label="地址" value={customerForm.address} onChange={v => setCustomerForm({ ...customerForm, address: v })} placeholder="公司地址" />
        </div>
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleAddCustomer}>保存客户</Button>
        </div>
      </Modal>
    </div>
  );
});

export default SalesOrderPage;