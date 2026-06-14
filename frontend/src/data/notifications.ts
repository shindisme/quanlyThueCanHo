import type { Notification } from "../types";

// Du lieu gia thong bao
export const mockNotifications: Notification[] = [
  { id: 1, user_id: 1, title: "Hop dong sap het han", content: "Hop dong #3 cua Pham Minh Duc se het han vao ngay 01/12/2025.", type: "SYSTEM", is_read: false, created_at: "2026-06-09T08:00:00Z" },
  { id: 2, user_id: 1, title: "Hoa don qua han", content: "Hoa don INV-202506-004 cua Hoang Van Phuc da qua han thanh toan.", type: "INVOICE", is_read: false, created_at: "2026-06-09T07:00:00Z" },
  { id: 3, user_id: 1, title: "Yeu cau sua chua moi", content: "Tran Thi Bich da tao yeu cau sua chua: Ro ri nuoc nha tam.", type: "MAINTENANCE", is_read: true, created_at: "2026-06-07T14:30:00Z" },
  { id: 4, user_id: 1, title: "Thanh toan thanh cong", content: "Hoa don INV-202506-002 da duoc thanh toan thanh cong qua chuyen khoan.", type: "INVOICE", is_read: true, created_at: "2026-06-10T08:30:00Z" },
  { id: 5, user_id: 4, title: "Hoa don thang 6", content: "Hoa don thang 6/2026 cua ban da duoc tao. Vui long thanh toan truoc 15/06.", type: "INVOICE", is_read: false, created_at: "2026-06-01T00:00:00Z" },
  { id: 6, user_id: 4, title: "Yeu cau sua chua dang xu ly", content: "Yeu cau sua chua 'May lanh khong mat' cua ban dang duoc xu ly.", type: "MAINTENANCE", is_read: true, created_at: "2026-06-06T10:00:00Z" },
  { id: 7, user_id: 1, title: "Lich xem phong moi", content: "Khach Tran Minh Tuan dang ky xem can ho A-201 vao 12/06/2026.", type: "SYSTEM", is_read: false, created_at: "2026-06-08T00:00:00Z" },
  { id: 8, user_id: 2, title: "Chi so dien nuoc can cap nhat", content: "Da den ky ghi chi so dien nuoc thang 6/2026 cho toa YuKi Tower A.", type: "SYSTEM", is_read: false, created_at: "2026-06-01T00:00:00Z" },
];
