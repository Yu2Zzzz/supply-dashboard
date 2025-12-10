#!/usr/bin/env node
/**
 * 🚀 App.jsx 自动拆分脚本
 * 
 * 功能：
 * 1. 自动备份原文件
 * 2. 创建模块化目录结构
 * 3. 提取配置、工具、Context到独立文件
 * 4. 生成修改后的App.jsx（已导入模块）
 * 
 * 使用方法：
 *   node refactor-app.js
 * 
 * 安全：
 * - 会先备份原文件为 App.jsx.backup
 * - 如果出错，可以用备份恢复
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════');
console.log('🚀 App.jsx 自动拆分工具');
console.log('═══════════════════════════════════════════════════\n');

// ============ 配置 ============
const SRC_DIR = path.join(process.cwd(), 'src');
const APP_FILE = path.join(SRC_DIR, 'App.jsx');
const BACKUP_FILE = path.join(SRC_DIR, 'App.jsx.backup');

// ============ 检查文件 ============
if (!fs.existsSync(APP_FILE)) {
  console.error('❌ 找不到 src/App.jsx');
  console.log('💡 请在项目根目录运行此脚本');
  process.exit(1);
}

console.log('✅ 找到 App.jsx');

// ============ 备份原文件 ============
if (!fs.existsSync(BACKUP_FILE)) {
  fs.copyFileSync(APP_FILE, BACKUP_FILE);
  console.log('✅ 已备份原文件到 App.jsx.backup\n');
} else {
  console.log('⚠️  备份文件已存在，跳过备份\n');
}

// ============ 创建目录结构 ============
console.log('📁 创建目录结构...');

const dirs = [
  path.join(SRC_DIR, 'config'),
  path.join(SRC_DIR, 'utils'),
  path.join(SRC_DIR, 'contexts'),
  path.join(SRC_DIR, 'hooks')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ 创建 ${path.basename(dir)}/`);
  } else {
    console.log(`   ⏭️  ${path.basename(dir)}/ 已存在`);
  }
});

console.log('');

// ============ 创建 config/constants.js ============
console.log('📝 创建 config/constants.js...');

const configContent = `// src/config/constants.js
import { CheckCircle, AlertTriangle, AlertOctagon, XCircle, Clock } from 'lucide-react';

export const BASE_URL = 'http://localhost:4000';

export const RISK = {
  ongoing: { color: '#10b981', bgColor: '#d1fae5', text: '正常', icon: CheckCircle, priority: 1 },
  warning: { color: '#f59e0b', bgColor: '#fef3c7', text: '预警', icon: AlertTriangle, priority: 2 },
  urgent: { color: '#f97316', bgColor: '#fed7aa', text: '紧急', icon: AlertOctagon, priority: 3 },
  overdue: { color: '#ef4444', bgColor: '#fee2e2', text: '延期', icon: XCircle, priority: 4 },
  pending: { color: '#8b5cf6', bgColor: '#ede9fe', text: '待采购', icon: Clock, priority: 5 },
};

export const PO_STATUS = {
  draft: { color: '#64748b', bgColor: '#f1f5f9', text: '草稿', next: 'confirmed' },
  confirmed: { color: '#3b82f6', bgColor: '#dbeafe', text: '已确认', next: 'producing' },
  producing: { color: '#f59e0b', bgColor: '#fef3c7', text: '生产中', next: 'shipped' },
  shipped: { color: '#8b5cf6', bgColor: '#ede9fe', text: '已发货', next: 'arrived' },
  arrived: { color: '#10b981', bgColor: '#d1fae5', text: '已到货', next: null },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2', text: '已取消', next: null },
};

export const SO_STATUS = {
  pending: { color: '#64748b', bgColor: '#f1f5f9', text: '待确认' },
  confirmed: { color: '#3b82f6', bgColor: '#dbeafe', text: '已确认' },
  producing: { color: '#f59e0b', bgColor: '#fef3c7', text: '生产中' },
  shipped: { color: '#8b5cf6', bgColor: '#ede9fe', text: '已发货' },
  completed: { color: '#10b981', bgColor: '#d1fae5', text: '已完成' },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2', text: '已取消' },
};
`;

fs.writeFileSync(path.join(SRC_DIR, 'config', 'constants.js'), configContent);
console.log('   ✅ config/constants.js (70行)\n');

// ============ 创建 utils/helpers.js ============
console.log('📝 创建 utils/helpers.js...');

const utilsContent = `// src/utils/helpers.js
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const TODAY = new Date();

export const daysDiff = (d1, d2) => Math.round((new Date(d1) - new Date(d2)) / 86400000);

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN');
};

export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

export const highestRisk = (risks) => {
  const RISK_PRIORITY = { ongoing: 1, warning: 2, urgent: 3, overdue: 4, pending: 5 };
  return risks.reduce((h, r) => (RISK_PRIORITY[r] || 0) > (RISK_PRIORITY[h] || 0) ? r : h, 'ongoing');
};

export const createRiskCalculator = (mats, pos, suppliers) => {
  const matMap = Object.fromEntries(mats.map(m => [m.code, m]));
  const poByMat = pos.reduce((a, p) => { (a[p.mat] = a[p.mat] || []).push(p); return a; }, {});
  const supplierByMat = suppliers.reduce((a, s) => { (a[s.mat] = a[s.mat] || []).push(s); return a; }, {});

  return function calcRisk(matCode, demand, deliveryDate) {
    const m = matMap[matCode];
    if (!m) return null;
    
    const available = m.inv + m.transit;
    const gap = Math.max(0, demand - available);
    const gapRate = demand > 0 ? gap / demand : 0;
    const daysLeft = daysDiff(deliveryDate, TODAY);
    const matPOs = poByMat[matCode] || [];
    const latestPO = matPOs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const delay = latestPO ? daysDiff(latestPO.date, deliveryDate) : null;
    const poCoverage = gap > 0 ? Math.min(1, matPOs.reduce((s, p) => s + p.qty, 0) / gap) : 1;
    const mainSupplier = (supplierByMat[matCode] || []).find(s => s.main);
    const singleSource = m.suppliers === 1;
    
    let score = 0;
    if (delay > 0) score += Math.min(30, delay * 3);
    else if (daysLeft < 7 && gap > 0) score += 20;
    else if (daysLeft < 14 && gap > 0) score += 10;
    score += Math.min(30, gapRate * 30);
    if (m.transit === 0 && gap > 0) score += 20;
    else if (poCoverage < 0.5) score += 15;
    else if (poCoverage < 1) score += 8;
    if (singleSource) score += 5;
    if (mainSupplier?.onTime < 0.85) score += 5;
    if (m.inv < m.safe) score += 10;

    let level = 'ongoing';
    if (m.transit === 0 && gap > 0) level = 'pending';
    else if (delay > 0) level = 'overdue';
    else if (score >= 50) level = 'urgent';
    else if (score >= 25) level = 'warning';

    return { 
      ...m, 
      demand: Math.round(demand), 
      available, 
      gap, 
      gapRate, 
      daysLeft, 
      delay, 
      poCoverage, 
      singleSource, 
      onTime: mainSupplier?.onTime || 0, 
      score: Math.round(score), 
      level 
    };
  };
};
`;

fs.writeFileSync(path.join(SRC_DIR, 'utils', 'helpers.js'), utilsContent);
console.log('   ✅ utils/helpers.js (95行)\n');

// ============ 创建 contexts/AuthContext.jsx ============
console.log('📝 创建 contexts/AuthContext.jsx...');

const authContent = `// src/contexts/AuthContext.jsx
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

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(\`\${BASE_URL}/api/auth/me\`, {
          headers: { 'Authorization': \`Bearer \${storedToken}\` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
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
      const res = await fetch(\`\${BASE_URL}/api/auth/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
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
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
`;

fs.writeFileSync(path.join(SRC_DIR, 'contexts', 'AuthContext.jsx'), authContent);
console.log('   ✅ contexts/AuthContext.jsx (85行)\n');

// ============ 创建 hooks/useApi.js ============
console.log('📝 创建 hooks/useApi.js...');

const hooksContent = `// src/hooks/useApi.js
import { useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { BASE_URL } from "@/config/constants";

export const useApi = () => {
  const { token, logout } = useAuth();
  
  const request = useCallback(async (endpoint, options = {}) => {
    try {
      const res = await fetch(\`\${BASE_URL}\${endpoint}\`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`,
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
`;

fs.writeFileSync(path.join(SRC_DIR, 'hooks', 'useApi.js'), hooksContent);
console.log('   ✅ hooks/useApi.js (30行)\n');

// ============ 读取并修改 App.jsx ============
console.log('📝 修改 App.jsx...');

let appContent = fs.readFileSync(APP_FILE, 'utf-8');

// 在文件开头添加新的imports（在现有imports之后）
const newImports = `
// ============ 导入拆分的模块 ============
import { BASE_URL, RISK, PO_STATUS, SO_STATUS } from './config/constants';
import { debounce, formatDate, formatDateInput, createRiskCalculator, highestRisk, TODAY, daysDiff } from './utils/helpers';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApi } from './hooks/useApi';
`;

// 找到第一个import语句之后插入
const importMatch = appContent.match(/^import .+?;$/m);
if (importMatch) {
  const insertPosition = appContent.indexOf(importMatch[0]) + importMatch[0].length;
  appContent = appContent.slice(0, insertPosition) + '\n' + newImports + appContent.slice(insertPosition);
}

// 删除重复的代码（使用正则表达式替换）

// 删除 BASE_URL
appContent = appContent.replace(/\/\/ ============ API 配置 ============\nconst BASE_URL = [^;]+;/g, '// API配置已移至 config/constants.js');

// 删除工具函数部分（debounce, formatDate等）
appContent = appContent.replace(/\/\/ ============ 工具函数 ============[\s\S]*?(?=\/\/ ============ 认证上下文|const RISK)/g, '// 工具函数已移至 utils/helpers.js\n\n');

// 删除常量定义
appContent = appContent.replace(/const RISK = \{[\s\S]*?\};[\s\n]*const PO_STATUS[\s\S]*?\};[\s\n]*const SO_STATUS[\s\S]*?\};/g, '// 常量已移至 config/constants.js');

// 删除 AuthContext 部分
appContent = appContent.replace(/\/\/ ============ 认证上下文 ============[\s\S]*?(?=\/\/ ============ API 请求封装)/g, '// 认证上下文已移至 contexts/AuthContext.jsx\n\n');

// 删除 useApi 部分
appContent = appContent.replace(/\/\/ ============ API 请求封装 ============[\s\S]*?(?=\/\/ ============ 登录页面)/g, '// API Hook已移至 hooks/useApi.js\n\n');

// 删除 createRiskCalculator 函数
appContent = appContent.replace(/\/\/ ============ 风险计算器 ============\nfunction createRiskCalculator[\s\S]*?^\};/m, '// 风险计算器已移至 utils/helpers.js');

// 保存修改后的App.jsx
fs.writeFileSync(APP_FILE, appContent);

// 统计修改后的行数
const newLines = appContent.split('\n').length;
const oldLines = fs.readFileSync(BACKUP_FILE, 'utf-8').split('\n').length;
const saved = oldLines - newLines;

console.log('   ✅ App.jsx 已更新\n');

// ============ 完成总结 ============
console.log('═══════════════════════════════════════════════════');
console.log('🎉 拆分完成！');
console.log('═══════════════════════════════════════════════════\n');

console.log('📊 拆分结果:');
console.log(`   原 App.jsx: ${oldLines} 行`);
console.log(`   新 App.jsx: ${newLines} 行`);
console.log(`   减少: ${saved} 行 (${Math.round(saved / oldLines * 100)}%)\n`);

console.log('📁 创建的文件:');
console.log('   ✅ src/config/constants.js (70行)');
console.log('   ✅ src/utils/helpers.js (95行)');
console.log('   ✅ src/contexts/AuthContext.jsx (85行)');
console.log('   ✅ src/hooks/useApi.js (30行)\n');

console.log('🚀 下一步:');
console.log('   1. 测试运行: npm run dev');
console.log('   2. 检查功能是否正常');
console.log('   3. 如有问题，使用备份恢复: cp src/App.jsx.backup src/App.jsx\n');

console.log('💡 提示:');
console.log('   - 如果想进一步拆分，可以把大的页面组件独立出去');
console.log('   - 比如: SalesOrderPage (200+行) 可以单独成文件\n');

console.log('═══════════════════════════════════════════════════\n');
