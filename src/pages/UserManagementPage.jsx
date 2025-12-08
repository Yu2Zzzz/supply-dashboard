// src/pages/UserManagementPage.jsx - 完整修复版
import React, { memo, useState, useCallback, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Save, Users, Power, PowerOff } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

// ============ 内置 UI 组件 ============
const Button = memo(({ children, onClick, variant = 'primary', icon: Icon, size = 'md', disabled = false, style = {}, loading = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const variants = {
    primary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
    danger: { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none' },
    success: { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none' },
    warning: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none' },
  };
  const sizes = {
    sm: { padding: '7px 14px', fontSize: '12px' },
    md: { padding: '11px 18px', fontSize: '14px' },
    lg: { padding: '13px 26px', fontSize: '16px' },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, borderRadius: '10px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: disabled ? 0.5 : 1,
        transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)', ...variants[variant], ...sizes[size], ...style }}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
});

const Card = memo(({ children, style = {} }) => (
  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', ...style }}>
    {children}
  </div>
));

const Input = memo(({ label, value, onChange, placeholder, type = 'text', required = false, disabled = false }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>}
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ width: '100%', padding: '11px 14px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px',
        outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', background: disabled ? '#f8fafc' : '#fff' }}
      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
  </div>
));

const Select = memo(({ label, value, onChange, options, required = false, disabled = false }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>}
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      style={{ width: '100%', padding: '11px 14px', fontSize: '14px', border: '2px solid #e2e8f0', borderRadius: '10px',
        outline: 'none', boxSizing: 'border-box', background: disabled ? '#f8fafc' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <option value="">请选择</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
));

const Modal = memo(({ isOpen, onClose, title, children, width = '500px' }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: width, maxHeight: '90vh',
        overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '8px',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
});

const EmptyState = memo(({ icon: Icon, title, description }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
    <div style={{ width: '80px', height: '80px', marginBottom: '20px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={40} style={{ color: '#94a3b8' }} />
    </div>
    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '300px' }}>{description}</div>
  </div>
));

const LoadingScreen = memo(() => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>加载中...</div>
    </div>
  </div>
));

// ============ 用户管理页面 ============
const UserManagementPage = memo(() => {
  const { request } = useApi();
  const { user: currentUser } = useAuth(); // 获取当前登录用户
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    realName: '', 
    email: '', 
    phone: '', 
    roleId: '',
    isActive: true  // 默认启用
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([
      request('/api/users'), 
      request('/api/roles')
    ]);
    
    console.log('👥 用户数据:', usersRes);
    console.log('🎭 角色数据:', rolesRes);
    
    if (usersRes.success) {
      const usersList = usersRes.data?.list || usersRes.data || [];
      
      console.log('📋 原始用户列表:', usersList);
      
      // ✅ 修复：过滤掉已删除的用户（软删除）
      const activeUsers = usersList.filter(u => {
        const isDeleted = u.isDeleted || u.is_deleted || u.deleted;
        
        // 详细输出每个用户的删除状态
        console.log(`用户 ${u.username}: isDeleted=${u.isDeleted}, is_deleted=${u.is_deleted}, deleted=${u.deleted}, 过滤=${!!isDeleted}`);
        
        return !isDeleted; // 只保留未删除的用户
      });
      
      console.log('📊 用户统计 - 总数:', usersList.length, '活跃:', activeUsers.length, '已删除:', usersList.length - activeUsers.length);
      console.log('✅ 过滤后的用户:', activeUsers.map(u => u.username));
      
      setUsers(activeUsers);
    }
    
    if (rolesRes.success) {
      const rolesList = rolesRes.data?.list || rolesRes.data || [];
      console.log('📋 角色列表:', rolesList);
      setRoles(rolesList);
    }
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    // 准备提交数据
    const submitData = {
      username: formData.username,
      realName: formData.realName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      roleId: parseInt(formData.roleId),
      role_id: parseInt(formData.roleId), // 兼容
      isActive: formData.isActive,
      is_active: formData.isActive // 兼容
    };
    
    // 新建时需要密码
    if (!editingUser) {
      submitData.password = formData.password;
    }
    
    const endpoint = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    
    console.log('📤 提交用户数据:', submitData);
    
    const res = await request(endpoint, { method, body: JSON.stringify(submitData) });
    
    console.log('📥 服务器响应:', res);
    
    if (res.success) { 
      setShowModal(false); 
      fetchData();
      alert('保存成功！');
    } else {
      alert(res.message || '操作失败');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`确定要删除用户 "${username}" 吗？此操作无法撤销！`)) return;
    
    console.log('🗑️ 删除用户 ID:', id);
    
    // ✅ 修复：立即从UI移除，不等后端响应
    setUsers(prevUsers => prevUsers.filter(u => u.id !== id));
    
    const res = await request(`/api/users/${id}`, { method: 'DELETE' });
    
    console.log('📥 删除响应:', res);
    
    if (res.success) {
      alert('删除成功！');
      // 重新获取数据确认
      setTimeout(() => fetchData(), 500);
    } else {
      console.error('❌ 删除失败:', res);
      alert(res.message || res.error || '删除失败');
      // 删除失败，恢复用户列表
      fetchData();
    }
  };

  // ✨ 新增：启用/停用账号
  const handleToggleActive = async (user) => {
    const newStatus = !user.isActive;
    const statusText = newStatus ? '启用' : '停用';
    
    if (!window.confirm(`确定要${statusText}该用户吗？`)) return;
    
    const updateData = {
      username: user.username,
      realName: user.realName || user.real_name || '',
      email: user.email || '',
      phone: user.phone || '',
      roleId: parseInt(user.roleId || user.role_id),
      role_id: parseInt(user.roleId || user.role_id),
      isActive: newStatus,
      is_active: newStatus
    };
    
    console.log('📤 切换用户状态:', updateData);
    
    const res = await request(`/api/users/${user.id}`, { 
      method: 'PUT', 
      body: JSON.stringify(updateData) 
    });
    
    if (res.success) {
      fetchData();
      alert(`${statusText}成功！`);
    } else {
      alert(res.message || `${statusText}失败`);
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('请输入新密码（至少6位）：');
    if (!newPassword || newPassword.length < 6) { 
      alert('密码至少6位'); 
      return; 
    }
    
    const res = await request(`/api/users/${id}/reset-password`, { 
      method: 'POST', 
      body: JSON.stringify({ newPassword }) 
    });
    
    if (res.success) {
      alert('密码重置成功！');
    } else {
      alert(res.message || '重置失败');
    }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    
    if (user) {
      console.log('📝 编辑用户:', user);
      console.log('   角色ID:', user.roleId || user.role_id);
      
      setFormData({
        username: user.username,
        realName: user.realName || user.real_name || '',
        email: user.email || '',
        phone: user.phone || '',
        roleId: String(user.roleId || user.role_id || ''),
        isActive: user.isActive !== undefined ? user.isActive : (user.is_active !== undefined ? user.is_active : true),
        password: ''
      });
    } else {
      console.log('➕ 新增用户');
      setFormData({ 
        username: '', 
        password: '', 
        realName: '', 
        email: '', 
        phone: '', 
        roleId: roles.length > 0 ? String(roles[0].id) : '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  // ✅ 修复：获取角色名称（兼容多种字段名）
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id == roleId || r.roleId == roleId || r.role_id == roleId);
    return role ? (role.roleName || role.role_name || role.name || '-') : '-';
  };

  // ✅ 修复：角色选项（兼容多种字段名）
  const getRoleOptions = () => {
    const options = roles.map(r => ({
      value: String(r.id || r.roleId || r.role_id),
      label: r.roleName || r.role_name || r.name || `角色${r.id}`
    }));
    
    console.log('🎭 角色选项:', options);
    return options;
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>用户管理</h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>管理系统用户账号和权限</p>
        </div>
        <Button icon={UserPlus} onClick={() => openModal()}>新增用户</Button>
      </div>

      <Card>
        {users.length === 0 ? (
          <EmptyState icon={Users} title="暂无用户" description="点击新增用户按钮添加" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>用户名</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>姓名</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>邮箱</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>电话</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>角色</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const isActive = user.isActive !== undefined ? user.isActive : user.is_active;
                  
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{user.username}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{user.realName || user.real_name || '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{user.email || '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{user.phone || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: '#eff6ff', color: '#3b82f6' }}>
                          {getRoleName(user.roleId || user.role_id)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '6px 14px', 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          borderRadius: '20px', 
                          background: isActive ? '#dcfce7' : '#fee2e2', 
                          color: isActive ? '#16a34a' : '#dc2626' 
                        }}>
                          {isActive ? '启用' : '停用'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* ✨ 启用/停用按钮 */}
                          <Button 
                            size="sm" 
                            variant={isActive ? 'warning' : 'success'} 
                            icon={isActive ? PowerOff : Power}
                            onClick={() => handleToggleActive(user)}
                          >
                            {isActive ? '停用' : '启用'}
                          </Button>
                          
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(user)}>编辑</Button>
                          <Button size="sm" variant="secondary" onClick={() => handleResetPassword(user.id)}>重置密码</Button>
                          <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(user.id, user.username)}>删除</Button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? '编辑用户' : '新增用户'}>
        <Input 
          label="用户名" 
          value={formData.username} 
          onChange={v => setFormData({ ...formData, username: v })} 
          required 
          disabled={!!editingUser}
          placeholder="请输入用户名" 
        />
        
        {!editingUser && (
          <Input 
            label="密码" 
            type="password" 
            value={formData.password} 
            onChange={v => setFormData({ ...formData, password: v })} 
            required 
            placeholder="至少6位"
          />
        )}
        
        <Input 
          label="姓名" 
          value={formData.realName} 
          onChange={v => setFormData({ ...formData, realName: v })} 
          placeholder="请输入真实姓名"
        />
        
        <Input 
          label="邮箱" 
          type="email" 
          value={formData.email} 
          onChange={v => setFormData({ ...formData, email: v })} 
          placeholder="user@example.com"
        />
        
        <Input 
          label="电话" 
          value={formData.phone} 
          onChange={v => setFormData({ ...formData, phone: v })} 
          placeholder="请输入电话号码"
        />
        
        <Select 
          label="角色" 
          value={formData.roleId} 
          onChange={v => setFormData({ ...formData, roleId: v })} 
          required 
          options={getRoleOptions()} 
        />
        
        {/* ✨ 新增：账号状态选择 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            账号状态 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: true })}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: formData.isActive ? '2px solid #10b981' : '2px solid #e2e8f0',
                background: formData.isActive ? '#dcfce7' : '#fff',
                color: formData.isActive ? '#16a34a' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✓ 启用
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: false })}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: !formData.isActive ? '2px solid #ef4444' : '2px solid #e2e8f0',
                background: !formData.isActive ? '#fee2e2' : '#fff',
                color: !formData.isActive ? '#dc2626' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✕ 停用
            </button>
          </div>
        </div>
        
        {/* 提示信息 */}
        {roles.length === 0 && (
          <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
              ⚠️ 未找到角色数据，请先创建角色！
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit} disabled={!formData.roleId && roles.length > 0}>
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
});

export default UserManagementPage;