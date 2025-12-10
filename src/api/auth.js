// src/api/auth.js
import apiClient from './client';

export const authApi = {
  getList: (params) => apiClient.get('/auth', { params }),
  getDetail: (id) => apiClient.get('/auth/' + id),
  create: (data) => apiClient.post('/auth', data),
  update: (id, data) => apiClient.put('/auth/' + id, data),
  delete: (id) => apiClient.delete('/auth/' + id),
};

export default authApi;
