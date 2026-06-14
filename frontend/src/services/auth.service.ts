import api from "../lib/api";

// ============================================================
// AUTH SERVICE - Các hàm gọi API xác thực người dùng
// ============================================================
//
// TẠI SAO ĐẶT Ở SERVICES/ MÀ KHÔNG PHẢI LIB/?
// - services/ = nơi chứa các hàm gọi API (giao tiếp với backend)
// - lib/ = nơi chứa utility/config (axios instance, helper functions)
// - Giống cách backend tách: controllers/ gọi → services/ xử lý logic
// - Frontend cũng vậy: components gọi → services/ gọi API
//
// FLOW: Component → Service → API (axios) → Backend
// Ví dụ: Login.tsx → authService.login() → api.post("/auth/login") → Backend
// ============================================================

// Interface mô tả dữ liệu trả về khi login
export interface LoginResponse {
  token: string;  // JWT token để xác thực các request sau
  role: string;   // Role: ADMIN | MANAGER | TENANT
}

// Interface mô tả thông tin user
export interface UserData {
  id: number;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
}

// Đăng nhập - POST /auth/login
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", { email, password });
  return res.data;
}

// Lấy danh sách tất cả users - GET /auth/users (cần quyền ADMIN)
export async function getAllUsers(): Promise<UserData[]> {
  const res = await api.get<UserData[]>("/auth/users");
  return res.data;
}

// Tạo user mới - POST /auth/create-user (cần quyền ADMIN)
export async function createUser(data: {
  email: string;
  role: string;
  phone?: string;
}) {
  const res = await api.post("/auth/create-user", data);
  return res.data;
}

// Cập nhật user - PUT /auth/users/:id
export async function updateUser(
  id: number,
  data: { email?: string; phone?: string; role?: string }
) {
  const res = await api.put(`/auth/users/${id}`, data);
  return res.data;
}

// Xóa user - DELETE /auth/delete-user/:id
export async function deleteUser(id: number) {
  const res = await api.delete(`/auth/delete-user/${id}`);
  return res.data;
}

// Reset password - POST /auth/reset-password/:id
export async function resetPassword(id: number) {
  const res = await api.post(`/auth/reset-password/${id}`);
  return res.data;
}

// Đổi password - POST /auth/change-password
export async function changePassword(oldPass: string, newPass: string) {
  const res = await api.post("/auth/change-password", { oldPass, newPass });
  return res.data;
}
