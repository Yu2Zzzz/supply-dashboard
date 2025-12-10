// src/api/warehouses.js
import apiClient from './client';

export const warehousesApi = {
  getList: (params) => apiClient.get('/warehouses', { params }),
  getDetail: (id) => apiClient.get('/warehouses/' + id),
  create: (data) => apiClient.post('/warehouses', data),
  update: (id, data) => apiClient.put('/warehouses/' + id, data),
  delete: (id) => apiClient.delete('/warehouses/' + id),
};

export default warehousesApi;
