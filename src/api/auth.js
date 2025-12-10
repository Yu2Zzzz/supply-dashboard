// src/api/auth.js
import apiClient from './client';

export const authApi = {
  // 登录
  login: (username, password) => 
    apiClient.post('/auth/login', { username, password }),
  
  // 获取当前用户
  getCurrentUser: () => 
    apiClient.get('/auth/me'),
  
  // 修改密码
  changePassword: (oldPassword, newPassword) => 
    apiClient.post('/auth/change-password', { oldPassword, newPassword }),
};

export default authApi;