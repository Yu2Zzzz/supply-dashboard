// src/constants/status.js
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_TEXT = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLOR = {
  pending: '#f39c12',
  confirmed: '#3498db',
  processing: '#9b59b6',
  completed: '#27ae60',
  cancelled: '#95a5a6',
};

export default ORDER_STATUS;
