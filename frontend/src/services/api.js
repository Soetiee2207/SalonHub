import axios from 'axios';

// Ưu tiên biến môi trường, nếu không có thì dùng thẳng link Render
const BASE_URL = import.meta.env.VITE_API_URL || 'https://salonhub-3cg8.onrender.com';

const api = axios.create({
  baseURL: BASE_URL.endsWith('/') ? `${BASE_URL}api` : `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Rất quan trọng để gửi kèm Token/Cookie
});


// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      // On login/register pages, just pass error through - don't redirect or clear
      if (path === '/login' || path === '/register') {
        return Promise.reject(error.response?.data || error);
      }
      // On other pages, clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error.response?.data || error);
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
