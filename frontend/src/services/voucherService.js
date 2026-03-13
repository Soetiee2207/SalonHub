import api from './api';

export const voucherService = {
  getAll: () => api.get('/vouchers'),
  checkCode: (code) => api.get(`/vouchers/check/${code}`),
  validate: (data) => api.post('/vouchers/validate', data),
  create: (data) => api.post('/vouchers', data),
  update: (id, data) => api.put(`/vouchers/${id}`, data),
  delete: (id) => api.delete(`/vouchers/${id}`),
};
