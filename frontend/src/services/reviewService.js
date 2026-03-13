import api from './api';

export const reviewService = {
  createServiceReview: (data) => api.post('/reviews/service', data),
  createProductReview: (data) => api.post('/reviews/product', data),
  getStaffReviews: (staffId) => api.get(`/reviews/staff/${staffId}`),
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  delete: (id) => api.delete(`/reviews/${id}`),
};
