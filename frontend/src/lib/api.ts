import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// instance axios với baseURL mặc định
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Mỗi khi gọi api.get(), api.post()... interceptor này chạy trước
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch { /* empty */ }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi chung
// Chạy sau khi nhận response từ server
api.interceptors.response.use(
  (response) => response,

  // Nếu lỗi → kiểm tra và xử lý
  (error) => {
    if (typeof error.response?.data?.error?.message === "string") {
      error.message = error.response.data.error.message;
      error.response.data.error = error.message;
    }
    if (error.response?.status === 401 && !error.config.url?.includes("/auth/login")) {
      localStorage.removeItem("auth-storage");

      const publicPaths = ["/", "/apartments", "/buildings", "/about", "/contact", "/system/login", "/login"];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.includes(currentPath) ||
                           currentPath.startsWith("/apartments/") ||
                           currentPath.startsWith("/buildings/");

      if (!isPublicPath) {
        window.location.href = "/system/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
