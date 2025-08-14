// src/services/api.js
import axios from "axios";

/**
 * 后端基址：优先 REACT_APP_API_BASE，其次 REACT_APP_API_URL。
 * 都没设置时为 ""（方便本地用 CRA proxy）。
 * 并去掉末尾多余的 /，避免 //auth/login 之类。
 */
const RAW_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_URL ||
  "";
const API_BASE_URL = RAW_BASE.replace(/\/+$/, ""); // e.g. https://chigo8000-....azurewebsites.net

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,              // 如果不走 Cookie，可先改成 false
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// 请求拦截（带上本地 token）
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// 响应拦截（401 统一跳登录）
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// 健康检查（可用于自测）
export const healthAPI = {
  ping: () => api.get("/healthz"),
};

export default api;
