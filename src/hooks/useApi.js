// src/hooks/useApi.js
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../config/constants';

export const useApi = () => {
  const { token, logout } = useAuth();
  
  const request = useCallback(async (endpoint, options = {}) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });
      if (res.status === 401) {
        logout();
        return { success: false, message: '登录已过期' };
      }
      return await res.json();
    } catch (e) {
      return { success: false, message: '网络错误' };
    }
  }, [token, logout]);

  return { request };
};