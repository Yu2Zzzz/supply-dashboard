// src/api/materials.js
import apiClient from './client';

export const materialsApi = {
  getList: (params) => apiClient.get('/materials', { params }),
  getDetail: (id) => apiClient.get('/materials/' + id),
  create: (data) => apiClient.post('/materials', data),
  update: (id, data) => apiClient.put('/materials/' + id, data),
  delete: (id) => apiClient.delete('/materials/' + id),
};

export default materialsApi;
