// src/api/inventory.js
import apiClient from './client';

export const inventoryApi = {
  getList: (params) => apiClient.get('/inventory', { params }),
  getDetail: (id) => apiClient.get('/inventory/' + id),
  create: (data) => apiClient.post('/inventory', data),
  update: (id, data) => apiClient.put('/inventory/' + id, data),
  delete: (id) => apiClient.delete('/inventory/' + id),
};

export default inventoryApi;
