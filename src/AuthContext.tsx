// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// 类型定义
interface User {
  id: number;
  username: string;
  realName: string;
  email: string;
  role: 'admin' | 'sales' | 'purchaser';
  roleName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
  canAccess: (permission: string) => boolean;
}

// 权限配置
const PERMISSIONS = {
  // 页面访问权限
  'page:dashboard': ['admin', 'sales', 'purchaser'],
  'page:sales-orders': ['admin', 'sales'],
  'page:products': ['admin', 'purchaser'],
  'page:materials': ['admin', 'purchaser'],
  'page:suppliers': ['admin', 'purchaser'],
  'page:warehouses': ['admin', 'purchaser'],
  'page:purchase-orders': ['admin', 'purchaser'],
  'page:inventory': ['admin', 'purchaser'],
  'page:warnings': ['admin', 'sales', 'purchaser'],
  'page:users': ['admin'],
  
  // 操作权限
  'action:create-order': ['admin', 'sales'],
  'action:edit-order': ['admin', 'sales'],
  'action:create-product': ['admin'],
  'action:edit-product': ['admin'],
  'action:create-material': ['admin', 'purchaser'],
  'action:edit-material': ['admin', 'purchaser'],
  'action:create-po': ['admin', 'purchaser'],
  'action:edit-po': ['admin', 'purchaser'],
  'action:manage-users': ['admin'],
};

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // 验证 token 并获取用户信息
  const validateToken = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          setToken(storedToken);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // 登录
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true, message: '登录成功' };
      } else {
        return { success: false, message: data.message || '登录失败' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: '网络错误，请稍后重试' };
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // 检查角色
  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // 检查权限
  const canAccess = (permission: string) => {
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    hasRole,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
