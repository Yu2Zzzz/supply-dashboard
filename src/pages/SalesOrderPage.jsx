// src/pages/SalesOrderPage.jsx - 完全修复版（修复404和toFixed错误）
import React, { memo, useState, useCallback, useEffect } from 'react';
import { Plus, Search, RefreshCw, Edit, Trash2, Save, FileText, ArrowRight, Eye, Package } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { SO_STATUS } from '../config/constants';
import { formatDate, formatDateInput } from '../utils/helpers';

const SalesOrderPage = memo(({
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
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLinesModal, setShowLinesModal] = useState(false);
  const [viewingOrderLines, setViewingOrderLines] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    customerId: '', orderDate: '', deliveryDate: '', salesPerson: '', status: 'pending', remark: '', lines: []
  });

  // ✅ 修复：不调用不存在的 /lines API
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      request('/api/sales-orders'),
      request('/api/customers'),
      request('/api/products')
    ]);
    
    // 直接使用订单对象中的lines字段，不额外请求
    if (ordersRes.success) {
      const ordersList = ordersRes.data?.list || ordersRes.data || [];
      console.log('📦 获取到订单:', ordersList.length, '个');
      setOrders(ordersList);
    }
    
    if (customersRes.success) setCustomers(customersRes.data?.list || customersRes.data || []);
    if (productsRes.success) setProducts(productsRes.data?.list || productsRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const submitData = {
      customerId: parseInt(formData.customerId) || formData.customerId,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      salesPerson: formData.salesPerson || '',
      status: formData.status || 'pending',
      remark: formData.remark || ''
    };
    
    // 新建和编辑都发送 lines
    if (formData.lines.length > 0) {
      submitData.lines = formData.lines.map(line => ({
        productId: parseInt(line.productId),
        product_id: parseInt(line.productId),
        quantity: parseInt(line.quantity) || 1,
        unitPrice: parseFloat(line.unitPrice) || 0,
        unit_price: parseFloat(line.unitPrice) || 0
      }));
    }

    const endpoint = editingOrder ? `/api/sales-orders/${editingOrder.id}` : '/api/sales-orders';
    const method = editingOrder ? 'PUT' : 'POST';
    
    console.log('📤 提交数据:', JSON.stringify(submitData, null, 2));
    
    const res = await request(endpoint, { method, body: JSON.stringify(submitData) });
    
    console.log('📥 服务器响应:', res);
    
    if (res.success) { 
      setShowModal(false); 
      alert('保存成功！');
      await fetchData(); // 重新获取数据
    } else {
      console.error('❌ 保存失败:', res);
      alert(res.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该订单吗？')) return;
    const res = await request(`/api/sales-orders/${id}`, { method: 'DELETE' });
    if (res.success) {
      fetchData();
      alert('删除成功！');
    } else {
      alert(res.message || '删除失败');
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    const updateData = {
      customerId: parseInt(order.customerId || order.customer_id),
      orderDate: order.orderDate || order.order_date,
      deliveryDate: order.deliveryDate || order.delivery_date,
      salesPerson: order.salesPerson || order.sales_person || '',
      status: newStatus,
      remark: order.remark || ''
    };
    
    const res = await request(`/api/sales-orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    if (res.success) {
      fetchData();
      alert('状态更新成功！');
    } else {
      alert(res.message || '状态更新失败');
    }
  };

  const openModal = (order = null) => {
    setEditingOrder(order);
    if (order) {
      console.log('📝 编辑订单:', order);
      console.log('   订单明细:', order.lines || order.orderLines || '无');
      
      setFormData({
        customerId: order.customerId || order.customer_id || '', 
        orderDate: formatDateInput(order.orderDate || order.order_date), 
        deliveryDate: formatDateInput(order.deliveryDate || order.delivery_date),
        salesPerson: order.salesPerson || order.sales_person || '', 
        status: order.status || 'pending', 
        remark: order.remark || '', 
        lines: order.lines || order.orderLines || []
      });
    } else {
      setFormData({ 
        customerId: '', 
        orderDate: new Date().toISOString().split('T')[0], 
        deliveryDate: '', 
        salesPerson: '', 
        status: 'pending', 
        remark: '', 
        lines: [] 
      });
    }
    setShowModal(true);
  };

  // ✅ 修复：查看订单产品明细
  const viewOrderLines = (order) => {
    console.log('👀 查看订单明细:', order.orderNo);
    console.log('   明细数据:', order.lines || order.orderLines);
    
    // 从订单对象中获取明细（不调用API）
    const lines = order.lines || order.orderLines || [];
    
    setViewingOrderLines({ ...order, lines });
    setShowLinesModal(true);
  };

  const addLine = () => {
    setFormData({ 
      ...formData, 
      lines: [...formData.lines, { productId: '', quantity: 1, unitPrice: 0 }] 
    });
  };

  const updateLine = (idx, field, value) => {
    const newLines = [...formData.lines];
    newLines[idx][field] = value;
    setFormData({ ...formData, lines: newLines });
  };

  const removeLine = (idx) => {
    setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== idx) });
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (keyword && !o.orderNo?.includes(keyword) && !o.customerName?.includes(keyword)) return false;
    return true;
  });

  const getProductOptions = () => products.map(p => ({
    value: p.id || p.productId || p.productCode,
    label: p.name || p.productName || `${p.productCode} - ${p.name}`
  }));

  const getCustomerOptions = () => customers.map(c => ({
    value: c.id || c.customerId,
    label: c.name || c.customerName
  }));

  // ✅ 修复：安全地获取产品名称
  const getProductName = (productId) => {
    const product = products.find(p => 
      p.id == productId || p.productId == productId || p.productCode == productId
    );
    return product ? (product.name || product.productName) : `产品ID: ${productId}`;
  };

  // ✅ 修复：安全地转换为数字
  const toNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

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
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>订单号</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>客户</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>下单日期</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>交付日期</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>业务员</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>产品</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
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
                      
                      {/* 产品明细列 */}
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {linesCount > 0 ? (
                          <Button size="sm" variant="secondary" icon={Package} onClick={() => viewOrderLines(order)}>
                            查看 ({linesCount})
                          </Button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>暂无</span>
                        )}
                      </td>
                      
                      <td style={{ padding: '16px', textAlign: 'center' }}><StatusTag status={order.status} statusMap={SO_STATUS} /></td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {statusInfo.next && (
                            <Button size="sm" variant="success" icon={ArrowRight} onClick={() => handleStatusChange(order, statusInfo.next)}>
                              {(SO_STATUS[statusInfo.next]?.text) || statusInfo.next}
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(order)}>编辑</Button>
                          {order.status === 'pending' && (
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

      {/* ✅ 修复：查看产品明细模态框 - 修复 toFixed 错误 */}
      <Modal 
        isOpen={showLinesModal} 
        onClose={() => setShowLinesModal(false)} 
        title={`订单产品明细 - ${viewingOrderLines?.orderNo || ''}`}
        width="600px"
      >
        {viewingOrderLines && (
          <div>
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>客户：</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{viewingOrderLines.customerName}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>业务员：</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{viewingOrderLines.salesPerson || '-'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>下单日期：</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatDate(viewingOrderLines.orderDate)}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>交付日期：</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatDate(viewingOrderLines.deliveryDate)}</span>
                </div>
              </div>
            </div>

            {(viewingOrderLines.lines || []).length === 0 ? (
              <EmptyState icon={Package} title="暂无产品明细" description="此订单还没有添加产品" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(viewingOrderLines.lines || []).map((line, idx) => {
                  // ✅ 修复：安全地转换为数字
                  const quantity = toNumber(line.quantity);
                  const unitPrice = toNumber(line.unitPrice || line.unit_price);
                  const subtotal = quantity * unitPrice;
                  
                  return (
                    <div key={idx} style={{ 
                      padding: '16px', 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          {getProductName(line.productId || line.product_id)}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#fff', padding: '4px 8px', borderRadius: '6px' }}>
                          #{idx + 1}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>数量：</span>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>{quantity}</span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>单价：</span>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>¥{unitPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>小计：</span>
                          <span style={{ color: '#3b82f6', fontWeight: 700 }}>¥{subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* 总计 */}
                <div style={{ 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                  borderRadius: '12px',
                  border: '2px solid #10b981'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#064e3b' }}>订单总额</span>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                      ¥{(viewingOrderLines.lines || []).reduce((sum, line) => {
                        const qty = toNumber(line.quantity);
                        const price = toNumber(line.unitPrice || line.unit_price);
                        return sum + (qty * price);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowLinesModal(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 编辑/新增订单的模态框 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOrder ? '编辑订单' : '新增订单'} width="700px">
        {editingOrder && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>订单号</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{editingOrder.orderNo}</div>
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select label="客户" value={formData.customerId} onChange={v => setFormData({ ...formData, customerId: v })} required options={getCustomerOptions()} />
          <Input label="业务员" value={formData.salesPerson} onChange={v => setFormData({ ...formData, salesPerson: v })} />
          <Input label="下单日期" type="date" value={formData.orderDate} onChange={v => setFormData({ ...formData, orderDate: v })} required />
          <Input label="交付日期" type="date" value={formData.deliveryDate} onChange={v => setFormData({ ...formData, deliveryDate: v })} required />
        </div>
        <Select label="状态" value={formData.status} onChange={v => setFormData({ ...formData, status: v })} options={Object.entries(SO_STATUS).map(([k, v]) => ({ value: k, label: v.text }))} />
        
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>状态流转说明</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}>待确认</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#3b82f6', borderRadius: '4px' }}>已确认</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#f59e0b', borderRadius: '4px' }}>生产中</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: '#ede9fe', color: '#8b5cf6', borderRadius: '4px' }}>已发货</span>
            <span>→</span>
            <span style={{ padding: '4px 8px', background: '#d1fae5', color: '#10b981', borderRadius: '4px' }}>已完成</span>
          </div>
        </div>
        
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              订单明细 {formData.lines.length > 0 && `(${formData.lines.length} 个产品)`}
            </h4>
            <Button size="sm" variant="secondary" icon={Plus} onClick={addLine}>添加产品</Button>
          </div>
          
          {formData.lines.length === 0 ? (
            <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
              暂无产品，请点击"添加产品"按钮
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.lines.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ flex: 2 }}>
                    <Select 
                      label={`产品 ${idx + 1}`} 
                      value={line.productId} 
                      onChange={v => updateLine(idx, 'productId', v)} 
                      options={getProductOptions()} 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input 
                      label="数量" 
                      type="number" 
                      value={line.quantity} 
                      onChange={v => updateLine(idx, 'quantity', parseInt(v) || 1)} 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input 
                      label="单价" 
                      type="number" 
                      step="0.01"
                      value={line.unitPrice} 
                      onChange={v => updateLine(idx, 'unitPrice', parseFloat(v) || 0)} 
                    />
                  </div>
                  <Button variant="danger" icon={Trash2} onClick={() => removeLine(idx)} style={{ marginBottom: '16px' }}>删除</Button>
                </div>
              ))}
            </div>
          )}
          
          {/* 订单总额 */}
          {formData.lines.length > 0 && (
            <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#064e3b', fontWeight: 600 }}>订单总额</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                ¥{formData.lines.reduce((sum, line) => {
                  const qty = toNumber(line.quantity);
                  const price = toNumber(line.unitPrice);
                  return sum + (qty * price);
                }, 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
});

export default SalesOrderPage;