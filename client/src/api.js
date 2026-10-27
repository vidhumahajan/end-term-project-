import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sprintboard_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(r => r, error => {
  if (error.response?.status === 401 && localStorage.getItem('sprintboard_token')) {
    localStorage.removeItem('sprintboard_token');
    localStorage.removeItem('sprintboard_user');
    if (!window.location.pathname.startsWith('/auth')) window.location.href = '/auth';
  }
  return Promise.reject(error);
});
export const messageOf = error => error?.response?.data?.message || 'Something went wrong. Please try again.';
export default api;
