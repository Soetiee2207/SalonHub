import api from './api';
import axios from 'axios';

const PROVINCE_API = 'https://provinces.open-api.vn/api';

export const addressService = {
  getAll: () => api.get('/addresses'),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  remove: (id) => api.delete(`/addresses/${id}`),
  setDefault: (id) => api.put(`/addresses/${id}/default`),

  getProvinces: () => axios.get(`${PROVINCE_API}/p/`).then(res => res.data),
  getDistricts: (provinceCode) => axios.get(`${PROVINCE_API}/p/${provinceCode}?depth=2`).then(res => res.data.districts),
  getWards: (districtCode) => axios.get(`${PROVINCE_API}/d/${districtCode}?depth=2`).then(res => res.data.wards),
};
