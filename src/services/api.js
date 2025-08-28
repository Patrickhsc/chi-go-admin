// Unified API service with English comments, including image upload support

import axios from 'axios';

// --------- Read and normalize API base URL ---------
// Try to read from environment variables, fallback to empty for same-origin
const RAW_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_URL ||
  '';
const API_BASE_URL = RAW_BASE.replace(/\/+$/, ''); // Remove trailing slashes

// Helper: join two URL parts safely (avoiding double slashes)
const join = (a, b) =>
  [String(a || '').replace(/\/+$/, ''), String(b || '').replace(/^\/+/, '')]
    .filter(Boolean)
    .join('/');

console.log('[ADMIN] API_BASE =', API_BASE_URL);

// --------- Global axios instance for API requests ---------
const api = axios.create({
  baseURL: API_BASE_URL,          // e.g. https://your-api.com
  withCredentials: true,          // Set to false if you don't need cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: attach local token if available
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unified 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --------- Dedicated axios instance for /auth endpoints ---------
export const auth = axios.create({
  baseURL: join(API_BASE_URL, 'auth'),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach the same interceptors to auth instance
auth.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
auth.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --------- Standard API groups (organized by business domain) ---------

export const healthAPI = {
  ping: () => api.get('/healthz'),
};

// User authentication related API
export const authAPI = {
  login:      (c) => api.post('/auth/login', c),
  register:   (u) => api.post('/auth/register', u),
  logout:     ()  => api.post('/auth/logout'),
  getProfile: ()  => api.get('/auth/me'),
};

// Attractions API
export const attractionsAPI = {
  getAll:    ()           => api.get('/api/attractions'),
  getById:   (id)         => api.get(`/api/attractions/${id}`),
  create:    (data)       => api.post('/api/attractions', data),
  update:    (id, data)   => api.put(`/api/attractions/${id}`, data),
  delete:    (id)         => api.delete(`/api/attractions/${id}`),
};

// Restaurants API
export const restaurantsAPI = {
  getAll:    ()           => api.get('/api/restaurants'),
  getById:   (id)         => api.get(`/api/restaurants/${id}`),
  create:    (data)       => api.post('/api/restaurants', data),
  update:    (id, data)   => api.put(`/api/restaurants/${id}`, data),
  delete:    (id)         => api.delete(`/api/restaurants/${id}`),
};

// Checklist API
export const checklistAPI = {
  get:    (userId)                   => api.get(`/api/checklists/${userId}`),
  add:    (userId, item)             => api.post(`/api/checklists/${userId}/add`, item),
  remove: (userId, itemId, itemType) =>
    api.delete(`/api/checklists/${userId}/remove`, {
      data: { itemId, itemType },
      headers: { 'Content-Type': 'application/json' },
    }),
};

// Community posts API
export const communityAPI = {
  getPosts:    ()           => api.get('/api/posts'),
  getPost:     (id)         => api.get(`/api/posts/${id}`),
  createPost:  (data)       => api.post('/api/posts', data),
  updatePost:  (id, data)   => api.put(`/api/posts/${id}`, data),
  deletePost:  (id)         => api.delete(`/api/posts/${id}`),
};

// Admin API for attractions, restaurants, posts, users
export const adminAPI = {
  createAttraction: (data)     => api.post('/admin/attractions', data),
  updateAttraction: (id, data) => api.put(`/admin/attractions/${id}`, data),
  deleteAttraction: (id)       => api.delete(`/admin/attractions/${id}`),

  createRestaurant: (data)     => api.post('/admin/restaurants', data),
  updateRestaurant: (id, data) => api.put(`/admin/restaurants/${id}`, data),
  deleteRestaurant: (id)       => api.delete(`/admin/restaurants/${id}`),

  getAllPosts:      ()         => api.get('/admin/posts'),
  deletePost:       (id)       => api.delete(`/admin/posts/${id}`),

  getAllUsers:      ()         => api.get('/admin/users'),
  updateUser:       (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser:       (id)       => api.delete(`/admin/users/${id}`),

  // Image upload for admin (returns image URL)
  uploadImage: async (file) => {
    // Use FormData to send file in POST request
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // Assume backend returns { url: '/uploads/xxxx.png' }
    return res.data.url;
  },
};

export default api;
