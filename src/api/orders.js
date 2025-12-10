// src/api/orders.js
import apiClient from './client';

export const ordersApi = {
  getList: (params) => apiClient.get('/orders', { params }),
  getDetail: (id) => apiClient.get('/orders/' + id),
  create: (data) => apiClient.post('/orders', data),
  update: (id, data) => apiClient.put('/orders/' + id, data),
  delete: (id) => apiClient.delete('/orders/' + id),
};

export default ordersApi;
