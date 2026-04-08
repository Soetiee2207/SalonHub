import api from './api';

export const accountantService = {
  getStats: (params) => api.get('/accountant/stats', { params }),
  
  getCashFlow: (params) => api.get('/accountant/cash-flow', { params }),
  createCashFlow: (data) => api.post('/accountant/cash-flow', data),
  
  getReconciliation: () => api.get('/accountant/reconciliation'),
  reconcile: (id) => api.post(`/accountant/reconciliation/${id}`),
  
  getRefunds: () => api.get('/accountant/refunds'),
  processRefund: (id, data) => api.post(`/accountant/refunds/${id}/process`, data),
  
  getReferenceDetail: (type, id) => api.get(`/accountant/reference-detail/${type}/${id}`),
};
