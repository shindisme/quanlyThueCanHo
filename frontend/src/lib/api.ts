import axios from "axios";

// ============================================================
// API CLIENT - Cấu hình axios để gọi backend
// ============================================================
//
// TẠI SAO CẦN TẠO INSTANCE RIÊNG?
// - Thay vì gọi axios.get("http://localhost:3000/buildings") mỗi lần,
//   ta tạo 1 instance có sẵn baseURL, rồi chỉ cần gọi api.get("/buildings")
// - Giảm lặp code, dễ thay đổi URL sau này (ví dụ: từ localhost → production)
//
// INTERCEPTOR LÀ GÌ?
// - Interceptor = "bộ chặn" chạy trước khi request được gửi đi
// - Ở đây ta dùng để tự động gắn token JWT vào header mỗi request
// - Giúp không cần viết { headers: { Authorization: "Bearer ..." } } thủ công
// ============================================================

const API_BASE_URL = "http://localhost:3000";

// Tạo instance axios với baseURL mặc định
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Tự động gắn token vào header
// Mỗi khi gọi api.get(), api.post()... interceptor này chạy trước
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (đã lưu khi login)
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.state?.token;
        if (token) {
          // Gắn token vào header Authorization
          // Format: "Bearer <token>" - đây là chuẩn JWT
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Nếu parse lỗi thì bỏ qua, không gắn token
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi chung
// Chạy sau khi nhận response từ server
api.interceptors.response.use(
  // Nếu thành công (status 2xx) → trả response bình thường
  (response) => response,

  // Nếu lỗi → kiểm tra và xử lý
  (error) => {
    // 401 = Token hết hạn hoặc không hợp lệ → buộc logout (NGOẠI TRỪ api login)
    if (error.response?.status === 401 && !error.config.url?.includes("/auth/login")) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/system/login";
    }
    return Promise.reject(error);
  }
);

export default api;
