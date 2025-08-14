import axios from 'axios';

// 三个实例分别对应三个后端前缀（全部用相对路径，交给 SWA 重写）
export const auth  = axios.create({ baseURL: '/auth' });
export const apiV1 = axios.create({ baseURL: '/api' });
export const admin = axios.create({ baseURL: '/admin' });

// 可选：如果后端返回 token，你想自动带上：
function attachToken(cfg) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.token) cfg.headers.Authorization = `Bearer ${user.token}`;
  return cfg;
}
auth.interceptors.request.use(attachToken);
apiV1.interceptors.request.use(attachToken);
admin.interceptors.request.use(attachToken);
