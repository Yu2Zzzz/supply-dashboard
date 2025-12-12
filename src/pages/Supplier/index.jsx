// src/pages/Supplier/index.jsx - 完整的供应商管理页面
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Building, Phone, Mail, MapPin, User } from 'lucide-react';

export default function SupplierManagementPage({ 
  Button, Input, Select, Modal, Card, EmptyState, LoadingScreen 
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        keyword: searchKeyword,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/suppliers?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setSuppliers(result.data?.list || result.data || []);
        setTotal(result.data?.pagination?.total || 0);
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, searchKeyword]);

  // 删除供应商
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个供应商吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/suppliers/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert('删除成功');
        fetchSuppliers();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除供应商失败:', error);
      alert('删除失败');
    }
  };

  // 保存供应商
  const handleSave = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingSupplier
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/suppliers/${editingSupplier.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/suppliers`;

      const response = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(editingSupplier ? '更新成功' : '创建成功');
        setIsModalOpen(false);
        setEditingSupplier(null);
        fetchSuppliers();
      } else {
        alert(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存供应商失败:', error);
      alert('保存失败');
    }
  };

  if (loading && suppliers.length === 0) {
    return LoadingScreen ? <LoadingScreen /> : (
      <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      {/* 标题 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
          供应商管理
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          管理供应商信息和合作关系
        </p>
      </div>

      {/* 操作栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        gap: '16px'
      }}>
        {/* 搜索框 */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          {Input ? (
            <Input
              placeholder="搜索供应商名称、编码..."
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
          ) : (
            <input
              type="text"
              placeholder="搜索供应商..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* 新建按钮 */}
        {Button ? (
          <Button
            icon={Plus}
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
          >
            新建供应商
          </Button>
        ) : (
          <button
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
            style={{
              padding: '11px 18px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} />
            新建供应商
          </button>
        )}
      </div>

      {/* 供应商列表 */}
      {Card ? (
        <Card>
          {suppliers.length === 0 ? (
            EmptyState ? (
              <EmptyState 
                icon={Building} 
                title="暂无供应商" 
                description="点击上方按钮添加供应商" 
              />
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <Building size={48} style={{ margin: '0 auto 16px' }} />
                <p>暂无供应商数据</p>
              </div>
            )
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={tableHeaderStyle}>供应商编码</th>
                    <th style={tableHeaderStyle}>供应商名称</th>
                    <th style={tableHeaderStyle}>联系人</th>
                    <th style={tableHeaderStyle}>电话</th>
                    <th style={tableHeaderStyle}>邮箱</th>
                    <th style={tableHeaderStyle}>地址</th>
                    <th style={tableHeaderStyle}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr 
                      key={supplier.id}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {supplier.supplierCode || supplier.supplier_code || '-'}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building size={16} style={{ color: '#64748b' }} />
                          <span style={{ fontWeight: 600 }}>
                            {supplier.name || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                          <User size={14} />
                          {supplier.contactPerson || supplier.contact_person || '-'}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                          <Phone size={14} />
                          {supplier.phone || '-'}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                          <Mail size={14} />
                          {supplier.email || '-'}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', maxWidth: '200px' }}>
                          <MapPin size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {supplier.address || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {Button ? (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={Edit}
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setIsModalOpen(true);
                                }}
                              >
                                编辑
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                icon={Trash2}
                                onClick={() => handleDelete(supplier.id)}
                              >
                                删除
                              </Button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setIsModalOpen(true);
                                }}
                                style={buttonStyle}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDelete(supplier.id)}
                                style={{...buttonStyle, background: '#ef4444'}}
                              >
                                删除
                              </button>
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
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
          {/* 无 Card 组件时的备用样式 */}
          <p>供应商列表加载中...</p>
        </div>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'center',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '8px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: page === 1 ? '#f8fafc' : '#fff',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            上一页
          </button>
          <span style={{ color: '#64748b', fontSize: '14px' }}>
            第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
          </span>
          <button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '8px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: page >= Math.ceil(total / pageSize) ? '#f8fafc' : '#fff',
              cursor: page >= Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer',
            }}
          >
            下一页
          </button>
        </div>
      )}

      {/* 编辑/新建 Modal */}
      {Modal && isModalOpen && (
        <SupplierModal
          Modal={Modal}
          Input={Input}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSupplier(null);
          }}
          onSave={handleSave}
          supplier={editingSupplier}
        />
      )}
    </div>
  );
}

// 供应商编辑 Modal 组件
function SupplierModal({ Modal, Input, isOpen, onClose, onSave, supplier }) {
  const [formData, setFormData] = useState({
    supplierCode: supplier?.supplierCode || supplier?.supplier_code || '',
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
  });

  const handleSubmit = () => {
    // 验证必填字段
    if (!formData.supplierCode || !formData.name) {
      alert('供应商编码和名称不能为空');
      return;
    }

    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? '编辑供应商' : '新建供应商'}
    >
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Input ? (
            <>
              <Input
                label="供应商编码"
                value={formData.supplierCode}
                onChange={(val) => setFormData({...formData, supplierCode: val})}
                placeholder="如: SUP-001"
                required
              />
              <Input
                label="供应商名称"
                value={formData.name}
                onChange={(val) => setFormData({...formData, name: val})}
                placeholder="如: XX供应商"
                required
              />
              <Input
                label="联系人"
                value={formData.contactPerson}
                onChange={(val) => setFormData({...formData, contactPerson: val})}
                placeholder="联系人姓名"
              />
              <Input
                label="电话"
                value={formData.phone}
                onChange={(val) => setFormData({...formData, phone: val})}
                placeholder="联系电话"
              />
              <Input
                label="邮箱"
                value={formData.email}
                onChange={(val) => setFormData({...formData, email: val})}
                placeholder="邮箱地址"
                type="email"
              />
              <Input
                label="地址"
                value={formData.address}
                onChange={(val) => setFormData({...formData, address: val})}
                placeholder="详细地址"
              />
            </>
          ) : (
            <p>表单组件未传入</p>
          )}
        </div>

        {/* 按钮 */}
        <div style={{ 
          marginTop: '24px', 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
  );
}

// 样式常量
const tableHeaderStyle = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableCellStyle = {
  padding: '16px',
  fontSize: '14px',
  color: '#374151'
};

const buttonStyle = {
  padding: '6px 12px',
  fontSize: '12px',
  border: 'none',
  borderRadius: '6px',
  background: '#3b82f6',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};
