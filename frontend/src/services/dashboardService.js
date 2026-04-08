import api from './api';

export const dashboardService = {
  getOverview: () => api.get('/dashboard/overview'),
  getRevenue: (params) => api.get('/dashboard/revenue', { params }),
  getTopServices: () => api.get('/dashboard/top-services'),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getAppointmentStats: () => api.get('/dashboard/appointment-stats'),
  getNewCustomers: (params) => api.get('/dashboard/new-customers', { params }),
  getDailyRevenue: () => api.get('/dashboard/daily-revenue'),
  getTopBarbers: () => api.get('/dashboard/top-barbers'),
  getHourlyTraffic: (params) => api.get('/dashboard/hourly-traffic', { params }),
  getRevenueByBranch: (params) => api.get('/dashboard/revenue-by-branch', { params }),
  getAppointmentsByStaff: (params) => api.get('/dashboard/appointments-by-staff', { params }),
  getCommandCenter: () => api.get('/dashboard/command-center'),
};
