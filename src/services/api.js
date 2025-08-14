// src/services/api.js
import axios from 'axios';

// ------- 统一读取 & 规范化基址 -------
const RAW_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_URL ||
  '';
const API_BASE_URL = RAW_BASE.replace(/\/+$/, ''); // 去掉尾部 '/'

// 小工具：拼路径，避免出现双斜杠
const join = (a, b) =>
  [String(a || '').replace(/\/+$/, ''), String(b || '').replace(/^\/+/, '')]
    .filter(Boolean)
    .join('/');

console.log('[ADMIN] API_BASE =', API_BASE_URL);

// ------- 通用 axios（不带前缀）-------
const api = axios.create({
  baseURL: API_BASE_URL,          // 例如 https://xxx.azurewebsites.net
  withCredentials: true,          // 不用 Cookie 可改为 false
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// 拦截器（带上本地 token、401 统一跳登录）
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

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

// ------- 专用：/auth 子路径的 axios 实例 -------
// 这样 Login 组件可以用 auth.post('/login') / auth.post('/register')
export const auth = axios.create({
  baseURL: join(API_BASE_URL, 'auth'),   // => https://.../auth
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// 给 auth 实例也加上同样的拦截器（可选）
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

// ------- 其它 API 分组（保持你现有写法）-------
export const healthAPI = {
  ping: () => api.get('/healthz'),
};

export const authAPI = {
  login:     (c) => api.post('/auth/login', c),
  register:  (u) => api.post('/auth/register', u),
  logout:    ()  => api.post('/auth/logout'),
  getProfile:()  => api.get('/auth/me'),
};

export const attractionsAPI = {
  getAll:   ()        => api.get('/api/attractions'),
  getById:  (id)      => api.get(`/api/attractions/${id}`),
  create:   (data)    => api.post('/api/attractions', data),
  update:   (id,data) => api.put(`/api/attractions/${id}`, data),
  delete:   (id)      => api.delete(`/api/attractions/${id}`),
};

export const restaurantsAPI = {
  getAll:   ()        => api.get('/api/restaurants'),
  getById:  (id)      => api.get(`/api/restaurants/${id}`),
  create:   (data)    => api.post('/api/restaurants', data),
  update:   (id,data) => api.put(`/api/restaurants/${id}`, data),
  delete:   (id)      => api.delete(`/api/restaurants/${id}`),
};

export const checklistAPI = {
  get:   (userId)                   => api.get(`/api/checklists/${userId}`),
  add:   (userId, item)             => api.post(`/api/checklists/${userId}/add`, item),
  remove:(userId, itemId, itemType) =>
    api.delete(`/api/checklists/${userId}/remove`, {
      data: { itemId, itemType },
      headers: { 'Content-Type': 'application/json' },
    }),
};

export const communityAPI = {
  getPosts:   ()        => api.get('/api/posts'),
  getPost:    (id)      => api.get(`/api/posts/${id}`),
  createPost: (data)    => api.post('/api/posts', data),
  updatePost: (id,data) => api.put(`/api/posts/${id}`, data),
  deletePost: (id)      => api.delete(`/api/posts/${id}`),
};

export const adminAPI = {
  createAttraction: (data)    => api.post('/admin/attractions', data),
  updateAttraction: (id,data) => api.put(`/admin/attractions/${id}`, data),
  deleteAttraction: (id)      => api.delete(`/admin/attractions/${id}`),

  createRestaurant: (data)    => api.post('/admin/restaurants', data),
  updateRestaurant: (id,data) => api.put(`/admin/restaurants/${id}`, data),
  deleteRestaurant: (id)      => api.delete(`/admin/restaurants/${id}`),

  getAllPosts: ()   => api.get('/admin/posts'),
  deletePost:  (id) => api.delete(`/admin/posts/${id}`),

  getAllUsers: ()   => api.get('/admin/users'),
  updateUser:  (id,data) => api.put(`/admin/users/${id}`, data),
  deleteUser:  (id) => api.delete(`/admin/users/${id}`),
};

export default api;
