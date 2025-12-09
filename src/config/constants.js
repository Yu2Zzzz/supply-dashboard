// src/config/constants.js - 修复版状态流程
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const BASE_URL = 'https://supply-backend-production.up.railway.app';

// 风险等级（要和 createRiskCalculator 里的 level 对得上）
export const RISK = {
  // 正常 / 安全
  ongoing: {
    text: '正常',
    color: '#10b981',
    bgColor: '#dcfce7',
    icon: CheckCircle,
    priority: 1,
  },
  // 库存吃紧、需要关注
  warning: {
    text: '预警',
    color: '#f97316',
    bgColor: '#ffedd5',
    icon: AlertTriangle,
    priority: 2,
  },
  // 严重缺料 / 高风险
  urgent: {
    text: '紧急',
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: XCircle,
    priority: 3,
  },
  // 交期已经被采购 /生产拖延
  overdue: {
    text: '逾期',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: AlertTriangle,
    priority: 3,
  },
  // 没有任何采购在途但有缺口 -> 需要立刻下单
  pending: {
    text: '待计划',
    color: '#64748b',
    bgColor: '#f1f5f9',
    icon: Clock,
    priority: 0,
  },
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