// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BASE_URL } from "@/config/constants";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;
    const roleCode = typeof rawUser.role === 'object'
      ? (rawUser.role.code || rawUser.role.name || '').toLowerCase()
      : (rawUser.role || '').toLowerCase();
    return { ...rawUser, roleCode };
  };

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(normalizeUser(data.data));
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
          }
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('token');
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        setUser(normalizeUser(data.data.user));
        return { success: true };
      }
      return { success: false, message: data.message || '登录失败' };
    } catch (e) {
      return { success: false, message: '网络错误' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    const roleVal = user.roleCode || user.role || "";
    return roles.map(r => String(r).toLowerCase()).includes(String(roleVal).toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

