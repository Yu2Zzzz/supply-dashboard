// src/api/suppliers.js
import apiClient from './client';

export const suppliersApi = {
  getList: (params) => apiClient.get('/suppliers', { params }),
  getDetail: (id) => apiClient.get('/suppliers/' + id),
  create: (data) => apiClient.post('/suppliers', data),
  update: (id, data) => apiClient.put('/suppliers/' + id, data),
  delete: (id) => apiClient.delete('/suppliers/' + id),
};

export default suppliersApi;
