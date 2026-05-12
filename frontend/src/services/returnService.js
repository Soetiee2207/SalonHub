import api from './api';

export const returnService = {
  requestReturn: async (data) => {
    return await api.post('/returns/request', data);
  },

  getMyReturns: async () => {
    return await api.get('/returns/my');
  },

  getAllReturns: async (status) => {
    const params = status ? { status } : {};
    return await api.get('/returns/all', { params });
  },

  updateReturnStatus: async (id, data) => {
    return await api.patch(`/returns/${id}/status`, data);
  }
};
