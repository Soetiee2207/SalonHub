import api from './api';

export const serviceService = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (formData) => api.post('/services', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/services/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/services/${id}`),
  getCategories: () => api.get('/services/categories'),
  createCategory: (data) => api.post('/services/categories', data),
  updateCategory: (id, data) => api.put(`/services/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/services/categories/${id}`),
};
