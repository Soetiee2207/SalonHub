import api from './api';

export const returnService = {
  // Khách hàng gửi yêu cầu trả hàng
  requestReturn: async (data) => {
    return await api.post('/returns/request', data);
  },

  // Khách hàng lấy danh sách yêu cầu trả của mình
  getMyReturns: async () => {
    return await api.get('/returns/my');
  },

  // Admin lấy tất cả yêu cầu trả
  getAllReturns: async (status) => {
    const params = status ? { status } : {};
    return await api.get('/returns/all', { params });
  },

  // Admin cập nhật trạng thái yêu cầu trả
  updateReturnStatus: async (id, data) => {
    return await api.patch(`/returns/${id}/status`, data);
  }
};
