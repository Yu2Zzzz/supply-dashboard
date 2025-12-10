// src/api/client.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

console.log('='.repeat(50));
console.log('🔗 API Configuration:');
console.log('   Base URL:', API_BASE_URL);
console.log('   Full Path:', API_BASE_URL + '/api');
console.log('='.repeat(50));

const apiClient = axios.create({
  baseURL: API_BASE_URL + '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    console.log('📤 Request:', config.method.toUpperCase(), config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 Success:', response.status, response.config.url);
    return response.data;
  },
  (error) => {
    console.error('❌ Error:', error.response?.status, error.config?.baseURL + error.config?.url);
    console.error('   Message:', error.response?.data?.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    }
    return Promise.reject({
      status: error.response?.status || 0,
      message: error.response?.data?.message || 'Request failed',
    });
  }
);

export default apiClient;