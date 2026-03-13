import api from './api';

export const paymentService = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  refund: (id) => api.post(`/payments/${id}/refund`),
};
