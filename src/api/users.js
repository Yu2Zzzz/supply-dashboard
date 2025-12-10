// src/api/users.js
import apiClient from './client';

export const usersApi = {
  getList: (params) => apiClient.get('/users', { params }),
  getDetail: (id) => apiClient.get('/users/' + id),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put('/users/' + id, data),
  delete: (id) => apiClient.delete('/users/' + id),
};

export default usersApi;
