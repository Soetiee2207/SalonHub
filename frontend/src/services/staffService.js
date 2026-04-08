import api from './api';

export const staffService = {
  // Staff CRUD
  getAll: (params) => api.get('/staff', { params }),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),

  // Staff Status & Stats
  getStats: () => api.get('/staff/stats'),
  updateStatus: (status) => api.put('/staff/status', { status }),
  getCustomerHistory: (customerId) => api.get(`/staff/customer-history/${customerId}`),
  saveNote: (data) => api.post('/staff/customer-notes', data),
  
  // Schedule Management
  getSchedules: (staffId) => api.get(`/schedules/staff/${staffId}`),
  setSchedules: (staffId, data) => api.post(`/schedules/staff/${staffId}`, data),

  // Appointment specific tactics
  checkIn: (id) => api.post(`/appointments/${id}/check-in`),
  updateUpsell: (id, products) => api.put(`/appointments/${id}/upsell`, { products }),
  checkout: (id, data) => api.post(`/appointments/${id}/checkout`, data),
};
