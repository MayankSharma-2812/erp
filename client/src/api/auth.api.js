import api from './axios';

export const loginApi = (credentials) => api.post('/auth/login', credentials);
export const refreshApi = () => api.post('/auth/refresh');
export const logoutApi = () => api.post('/auth/logout');
