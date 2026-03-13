import api from './api';

export const staffService = {
  getAll: () => api.get('/staff'),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
  getSchedules: (id) => api.get(`/staff/${id}/schedules`),
  setSchedules: (id, data) => api.post(`/staff/${id}/schedules`, data),
  addSkill: (id, data) => api.post(`/staff/${id}/skills`, data),
  removeSkill: (id, serviceId) => api.delete(`/staff/${id}/skills/${serviceId}`),
};
