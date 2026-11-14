import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trustguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('trustguard_token')) {
        localStorage.removeItem('trustguard_token');
        localStorage.removeItem('trustguard_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  demoLogin: () => api.post('/auth/demo-login'),
  getMe: () => api.get('/auth/me'),
};

export const scanApi = {
  scanPrompt: (payload) => api.post('/scan', payload),
};

export const auditApi = {
  getLogs: (params) => api.get('/audit', { params }),
  getLogById: (id) => api.get(`/audit/${id}`),
  getExportUrl: () => `${baseURL}/audit/export/csv`,
};

export const policyApi = {
  getPolicy: () => api.get('/policies'),
  updatePolicy: (policyData) => api.put('/policies', policyData),
  resetPolicy: () => api.post('/policies/reset'),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: (params) => api.get('/dashboard/charts', { params }),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

export default api;
