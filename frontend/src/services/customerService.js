import api from './api';

export const customerService = {
  getAll: (search = '') => api.get(`/customers?search=${search}`),
  getById: (id) => api.get(`/customers/${id}`),
  update: (id, data) => api.put(`/customers/${id}`, data),
  toggleStatus: (id) => api.patch(`/customers/${id}/toggle-status`),
  delete: (id) => api.delete(`/customers/${id}`),
  bulkDelete: (ids) => api.post(`/customers/bulk-delete`, { ids }),
};
