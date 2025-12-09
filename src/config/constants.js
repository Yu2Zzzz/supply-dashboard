// src/config/constants.js - 修复版状态流程
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const BASE_URL = 'https://supply-backend-production.up.railway.app';

// 风险等级（包含icon和priority）
export const RISK = {
  low: { label: '低', color: '#10b981', bg: '#d1fae5', icon: CheckCircle, priority: 1 },
  medium: { label: '中', color: '#f59e0b', bg: '#fef3c7', icon: AlertTriangle, priority: 2 },
  high: { label: '高', color: '#ef4444', bg: '#fee2e2', icon: XCircle, priority: 3 },
  pending: { label: '待定', color: '#64748b', bg: '#f1f5f9', icon: Clock, priority: 0 }
};

// ✅ 采购订单状态：草稿 → 已确认 → 已发货 → 已到货（去掉生产中）
export const PO_STATUS = {
  draft: { 
    text: '草稿', 
    color: '#64748b', 
    bgColor: '#f1f5f9',
    next: 'confirmed'
  },
  confirmed: { 
    text: '已确认', 
    color: '#3b82f6', 
    bgColor: '#dbeafe',
    next: 'shipped'
  },
  shipped: { 
    text: '已发货', 
    color: '#8b5cf6', 
    bgColor: '#ede9fe',
    next: 'arrived'
  },
  arrived: { 
    text: '已到货', 
    color: '#10b981', 
    bgColor: '#d1fae5',
    next: null
  }
};

// ✅ 业务订单状态：待确认 → 已确认 → 生产中 → 已发货 → 已交付
export const SO_STATUS = {
  pending: { 
    text: '待确认', 
    color: '#64748b', 
    bgColor: '#f1f5f9',
    next: 'confirmed'
  },
  confirmed: { 
    text: '已确认', 
    color: '#3b82f6', 
    bgColor: '#dbeafe',
    next: 'producing'
  },
  producing: { 
    text: '生产中', 
    color: '#f59e0b', 
    bgColor: '#fef3c7',
    next: 'shipped'
  },
  shipped: { 
    text: '已发货', 
    color: '#8b5cf6', 
    bgColor: '#ede9fe',
    next: 'completed'
  },
  completed: { 
    text: '已交付', 
    color: '#10b981', 
    bgColor: '#d1fae5',
    next: null
  }
};