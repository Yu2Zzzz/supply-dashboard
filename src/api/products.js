// src/api/products.js
import apiClient from './client';

export const productsApi = {
  getList: (params) => apiClient.get('/products', { params }),
  getDetail: (id) => apiClient.get('/products/' + id),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put('/products/' + id, data),
  delete: (id) => apiClient.delete('/products/' + id),
};

export default productsApi;
