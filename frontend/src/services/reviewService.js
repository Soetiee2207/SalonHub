import api from './api';

export const reviewService = {
  createServiceReview: (data) => api.post('/reviews/service', data),
  createProductReview: (data) => api.post('/reviews/product', data),
  getStaffReviews: (staffId) => api.get(`/reviews/staff/${staffId}`),
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  getAll: () => api.get('/reviews'),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};
