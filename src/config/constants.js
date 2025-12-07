// src/config/constants.js
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