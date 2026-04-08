import api from './api';

export const inventoryService = {
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  createImport: (data) => api.post('/inventory/import', data),
  createExport: (data) => api.post('/inventory/export', data),
  createAdjustment: (data) => api.post('/inventory/adjust', data),
  getProductStock: (id) => api.get(`/inventory/products/${id}/stock`),
  getLowStockProducts: (threshold) => api.get('/inventory/low-stock', { params: { threshold } }),
  getWarehouseStats: () => api.get('/inventory/stats'),
};
