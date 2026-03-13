import api from './api';

export const dashboardService = {
  getOverview: () => api.get('/dashboard/overview'),
  getRevenue: (params) => api.get('/dashboard/revenue', { params }),
  getTopServices: () => api.get('/dashboard/top-services'),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getAppointmentStats: () => api.get('/dashboard/appointment-stats'),
  getNewCustomers: (params) => api.get('/dashboard/new-customers', { params }),
};
