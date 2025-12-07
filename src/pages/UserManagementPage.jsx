// src/pages/UserManagementPage.jsx
import React, { memo, useState, useCallback, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Save, Users } from 'lucide-react';
import { useApi } from '../hooks/useApi';

const UserManagementPage = memo(({
  // 临时props：从App.jsx传入UI组件
  Button,
  Input,
  Select,
  Modal,
  Card,
  EmptyState,
  LoadingScreen
}) => {
  const { request } = useApi();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', realName: '', email: '', phone: '', roleId: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([request('/api/users'), request('/api/roles')]);
    if (usersRes.success) setUsers(usersRes.data?.list || []);
    if (rolesRes.success) setRoles(rolesRes.data || []);
    setLoading(false);
  }, [request]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const endpoint = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    const res = await request(endpoint, { method, body: JSON.stringify(formData) });
    if (res.success) { setShowModal(false); fetchData(); }
    else alert(res.message || '操作失败');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该用户吗？')) return;
    const res = await request(`/api/users/${id}`, { method: 'DELETE' });
    if (res.success) fetchData();
    else alert(res.message || '删除失败');
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('请输入新密码（至少6位）：');
    if (!newPassword || newPassword.length < 6) { alert('密码至少6位'); return; }
    const res = await request(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
    if (res.success) alert('密码重置成功');
    else alert(res.message || '重置失败');
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    setFormData(user ? { username: user.username, realName: user.realName || '', email: user.email || '', phone: user.phone || '', roleId: user.roleId, password: '' } : { username: '', password: '', realName: '', email: '', phone: '', roleId: roles[0]?.id || '' });
    setShowModal(true);
  };

  const getRoleName = (roleId) => roles.find(r => r.id === roleId)?.role_name || '-';

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
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>角色</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>状态</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{user.username}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{user.realName || '-'}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{user.email || '-'}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: '#eff6ff', color: '#3b82f6' }}>{getRoleName(user.roleId)}</span></td>
                    <td style={{ padding: '16px', textAlign: 'center' }}><span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: user.isActive ? '#dcfce7' : '#fee2e2', color: user.isActive ? '#16a34a' : '#dc2626' }}>{user.isActive ? '启用' : '停用'}</span></td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Button size="sm" variant="secondary" icon={Edit} onClick={() => openModal(user)}>编辑</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleResetPassword(user.id)}>重置密码</Button>
                        <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(user.id)}>删除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? '编辑用户' : '新增用户'}>
        <Input label="用户名" value={formData.username} onChange={v => setFormData({ ...formData, username: v })} required disabled={!!editingUser} />
        {!editingUser && <Input label="密码" type="password" value={formData.password} onChange={v => setFormData({ ...formData, password: v })} required />}
        <Input label="姓名" value={formData.realName} onChange={v => setFormData({ ...formData, realName: v })} />
        <Input label="邮箱" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
        <Input label="电话" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} />
        <Select label="角色" value={formData.roleId} onChange={v => setFormData({ ...formData, roleId: v })} required options={roles.map(r => ({ value: r.id, label: r.role_name }))} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
          <Button icon={Save} onClick={handleSubmit}>保存</Button>
        </div>
      </Modal>
    </div>
  );
});

export default UserManagementPage;