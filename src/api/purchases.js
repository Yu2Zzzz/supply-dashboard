// src/api/purchases.js
import apiClient from './client';

export const purchasesApi = {
  getList: (params) => apiClient.get('/purchases', { params }),
  getDetail: (id) => apiClient.get('/purchases/' + id),
  create: (data) => apiClient.post('/purchases', data),
  update: (id, data) => apiClient.put('/purchases/' + id, data),
  delete: (id) => apiClient.delete('/purchases/' + id),
};

export default purchasesApi;
