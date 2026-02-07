import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5001/api");
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth APIs
export const login = (studentId, password) => {
  return api.post('/auth/login', { studentId, password });
};

export const register = (studentData) => {
  return api.post('/auth/register', studentData);
};

export const adminLogin = (studentId, password) => {
  return api.post('/auth/admin/login', { studentId, password });
};

export const logout = () => {
  return api.post('/auth/logout');
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

// Document APIs
export const uploadDocument = (formData) => {
  return api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getMyDocuments = (page = 1, limit = 10, search = '', category = '') => {
  return api.get('/documents/my-documents', {
    params: { page, limit, search, category }
  });
};

export const getDocumentStats = () => {
  return api.get('/documents/stats');
};

export const getCategories = () => {
  return api.get('/documents/categories');
};

export const viewDocument = (id) => {
  return api.get(`/documents/view/${id}`, {
    responseType: 'blob'
  });
};

export const downloadDocument = (id) => {
  return api.get(`/documents/download/${id}`, {
    responseType: 'blob'
  });
};

export const deleteDocument = (id) => {
  return api.delete(`/documents/${id}`);
};

// Admin APIs
export const getAllDocuments = (page = 1, limit = 10, search = '', category = '', studentId = '') => {
  return api.get('/admin/documents', {
    params: { page, limit, search, category, studentId }
  });
};

export const deleteAnyDocument = (id) => {
  return api.delete(`/admin/documents/${id}`);
};

export const resetPassword = (studentId, newPassword) => {
  return api.post('/admin/reset-password', { studentId, newPassword });
};

export const getStudents = (search = '') => {
  return api.get('/admin/students', {
    params: { search }
  });
};

export const createStudent = (studentData) => {
  return api.post('/admin/students', studentData);
};

export const deleteStudent = (id) => {
  return api.delete(`/admin/students/${id}`);
};

// Profile APIs
export const getProfile = () => {
  return api.get('/profile');
};

export const updateProfile = (data) => {
  return api.put('/profile', data);
};

export const uploadProfilePhoto = (formData) => {
  return api.post('/profile/photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getProfilePhoto = (studentId) => {
  return `${API_URL}/profile/photo/${studentId}?t=${Date.now()}`;
};

export default api;
