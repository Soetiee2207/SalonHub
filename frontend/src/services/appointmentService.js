import api from './api';

export const appointmentService = {
  create: (data) => api.post('/appointments', data),
  getMyAppointments: (params) => api.get('/appointments/my-appointments', { params }),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  getStaffAppointments: (params) => api.get('/appointments/staff-appointments', { params }),
  getAvailableSlots: (params) => api.get('/appointments/available-slots', { params }),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
};
