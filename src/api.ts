// frontend/src/services/api.ts

const BASE_URL = "https://supply-backend-g3gm.onrender.com";

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    // Token 过期处理
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return { success: false, message: '登录已过期，请重新登录' };
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
}

// ==================== 认证 API ====================
export const authApi = {
  login: (username: string, password: string) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getCurrentUser: () => request('/api/auth/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

// ==================== 用户管理 API ====================
export const userApi = {
  getUsers: (params?: { page?: number; pageSize?: number; keyword?: string; roleId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/users?${query}`);
  },

  createUser: (data: {
    username: string;
    password: string;
    realName?: string;
    email?: string;
    phone?: string;
    roleId: number;
  }) =>
    request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: number, data: any) =>
    request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  resetPassword: (id: number, newPassword: string) =>
    request(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  deleteUser: (id: number) =>
    request(`/api/users/${id}`, { method: 'DELETE' }),

  getRoles: () => request('/api/roles'),
};

// ==================== 产品管理 API ====================
export const productApi = {
  getProducts: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/products?${query}`);
  },

  getProductById: (id: number) => request(`/api/products/${id}`),

  createProduct: (data: {
    productCode: string;
    name: string;
    category?: string;
    description?: string;
    unit?: string;
  }) =>
    request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: any) =>
    request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: number) =>
    request(`/api/products/${id}`, { method: 'DELETE' }),

  updateBom: (id: number, bomItems: { materialId: number; quantity: number }[]) =>
    request(`/api/products/${id}/bom`, {
      method: 'PUT',
      body: JSON.stringify({ bomItems }),
    }),
};

// ==================== 业务订单 API ====================
export const orderApi = {
  getOrders: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    salesPerson?: string;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/sales-orders?${query}`);
  },

  getOrderById: (id: number) => request(`/api/sales-orders/${id}`),

  createOrder: (data: {
    orderNo: string;
    customerId: number;
    orderDate: string;
    deliveryDate: string;
    salesPerson?: string;
    remark?: string;
    lines: { productId: number; quantity: number; unitPrice?: number; remark?: string }[];
  }) =>
    request('/api/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrder: (id: number, data: any) =>
    request(`/api/sales-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteOrder: (id: number) =>
    request(`/api/sales-orders/${id}`, { method: 'DELETE' }),

  getSalesPersons: () => request('/api/sales-orders/sales-persons'),
};

// ==================== 客户 API ====================
export const customerApi = {
  getCustomers: () => request('/api/customers'),

  createCustomer: (data: {
    customerCode: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) =>
    request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== 供应商 API ====================
export const supplierApi = {
  getSuppliers: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/suppliers?${query}`);
  },

  getSupplierById: (id: number) => request(`/api/suppliers/${id}`),

  createSupplier: (data: {
    supplierCode: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    onTimeRate?: number;
    qualityRate?: number;
    remark?: string;
  }) =>
    request('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSupplier: (id: number, data: any) =>
    request(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSupplier: (id: number) =>
    request(`/api/suppliers/${id}`, { method: 'DELETE' }),
};

// ==================== 仓库 API ====================
export const warehouseApi = {
  getWarehouses: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/warehouses?${query}`);
  },

  getWarehouseById: (id: number) => request(`/api/warehouses/${id}`),

  createWarehouse: (data: {
    warehouseCode: string;
    name: string;
    location?: string;
    capacity?: number;
    manager?: string;
    remark?: string;
  }) =>
    request('/api/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWarehouse: (id: number, data: any) =>
    request(`/api/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWarehouse: (id: number) =>
    request(`/api/warehouses/${id}`, { method: 'DELETE' }),
};

// ==================== 物料 API ====================
export const materialApi = {
  getMaterials: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    buyer?: string;
    category?: string;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/materials?${query}`);
  },

  getMaterialById: (id: number) => request(`/api/materials/${id}`),

  createMaterial: (data: {
    materialCode: string;
    name: string;
    spec?: string;
    unit?: string;
    price?: number;
    safeStock?: number;
    leadTime?: number;
    buyer?: string;
    category?: string;
  }) =>
    request('/api/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMaterial: (id: number, data: any) =>
    request(`/api/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMaterial: (id: number) =>
    request(`/api/materials/${id}`, { method: 'DELETE' }),

  getBuyers: () => request('/api/materials/buyers'),

  updateInventory: (id: number, warehouseId: number, quantity: number, operation?: 'set' | 'add' | 'subtract') =>
    request(`/api/materials/${id}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ warehouseId, quantity, operation }),
    }),
};

// ==================== 采购订单 API ====================
export const purchaseApi = {
  getPurchaseOrders: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    supplierId?: string;
    materialId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/api/purchase-orders?${query}`);
  },

  getPurchaseOrderById: (id: number) => request(`/api/purchase-orders/${id}`),

  createPurchaseOrder: (data: {
    poNo: string;
    materialId: number;
    supplierId: number;
    quantity: number;
    unitPrice?: number;
    orderDate: string;
    expectedDate: string;
    remark?: string;
  }) =>
    request('/api/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePurchaseOrder: (id: number, data: any) =>
    request(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePurchaseOrder: (id: number) =>
    request(`/api/purchase-orders/${id}`, { method: 'DELETE' }),

  confirmPurchaseOrder: (id: number) =>
    request(`/api/purchase-orders/${id}/confirm`, { method: 'POST' }),

  generatePoNo: () => request('/api/purchase-orders/generate-no'),
};

// ==================== 预警 API ====================
export const warningApi = {
  getWarnings: () => request('/api/warnings'),
};

// ==================== 仪表板数据 API ====================
export const dashboardApi = {
  getData: () => request('/api/data'),
};
