import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to role select on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/select-role';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  return api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password });

export const devSession = (role) =>
  api.post('/auth/dev-session', { role });

// ─── Contracts ────────────────────────────────────────────────────────────────
export const uploadContract = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/contracts/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => e
  });
};

export const listContracts = () => api.get('/contracts/');
export const getContract = (id) => api.get(`/contracts/${id}`);
export const getContractStatus = (id) => api.get(`/contracts/${id}/status`);


// ─── Analysis ─────────────────────────────────────────────────────────────────
export const runAnalysis = (contractId) => api.post(`/analysis/run/${contractId}`);
export const getAnalysis = (contractId) => api.get(`/analysis/${contractId}`);
export const exportAnalysisJson = (contractId) =>
  api.get(`/analysis/${contractId}/export/json`, { responseType: 'blob' });
export const exportAnalysisCsv = (contractId) =>
  api.get(`/analysis/${contractId}/export/csv`, { responseType: 'blob' });
export const exportAnalysisPdf = (contractId) =>
  api.get(`/analysis/${contractId}/export/pdf`, { responseType: 'blob' });
export const compareContracts = (id1, id2) =>
  api.get(`/analysis/compare/${id1}/${id2}`);

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const askLegalQuestion = (question) =>
  api.post('/chat/ask', { question });
export const getChatHistory = (limit = 50, offset = 0) =>
  api.get(`/chat/history?limit=${limit}&offset=${offset}`);
export const deleteChatEntry = (id) => api.delete(`/chat/history/${id}`);
export const getContractChatHistory = (contractId) =>
  api.get(`/contracts/${contractId}/chat/history`);
export const askContractQuestion = (contractId, question) =>
  api.post(`/contracts/${contractId}/chat`, { question });

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalyticsSummary = () => api.get('/analytics/summary');
export const getRiskDistribution = (contractType) =>
  api.get(`/analytics/risk-distribution${contractType ? `?contract_type=${contractType}` : ''}`);
export const getScoreTrend = (limit = 30) =>
  api.get(`/analytics/score-trend?limit=${limit}`);
export const getBiasDistribution = () => api.get('/analytics/bias-distribution');
export const getMissingClausesFrequency = () =>
  api.get('/analytics/missing-clauses-frequency');

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminGetSummary = () => api.get('/analytics/admin/summary');
export const adminListUsers = () => api.get('/admin/users');
export const adminToggleUser = (userId) =>
  api.patch(`/admin/users/${userId}/toggle-active`);
export const adminSetRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role?role=${role}`);
export const adminGetUserContracts = (userId) =>
  api.get(`/admin/users/${userId}/contracts`);

export default api;
