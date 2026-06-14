import api from "../lib/api";

// ============================================================
// SCHEDULES SERVICE - Quản lý lịch xem phòng
// ============================================================

export interface ScheduleData {
  id: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  apartment_id: number;
  schedule_time: string;
  status: string; // PENDING | CONFIRMED | CANCELLED
  note: string | null;
  created_at: string;
  temp_locked_until: string | null;
}

// Đặt lịch xem phòng - POST /schedules/book (public, không cần login)
export async function bookViewing(data: {
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  apartment_id: number;
  schedule_time: string;
  note?: string;
}) {
  const res = await api.post("/schedules/book", data);
  return res.data;
}

// Lấy danh sách lịch - GET /schedules (cần quyền ADMIN)
export async function getSchedules(): Promise<ScheduleData[]> {
  const res = await api.get<ScheduleData[]>("/schedules");
  return res.data;
}

// Xác nhận lịch - PATCH /schedules/confirm/:id
export async function confirmSchedule(id: number) {
  const res = await api.patch(`/schedules/confirm/${id}`);
  return res.data;
}

// Hủy lịch - PATCH /schedules/cancel/:id
export async function cancelSchedule(id: number) {
  const res = await api.patch(`/schedules/cancel/${id}`);
  return res.data;
}

// Xóa lịch - DELETE /schedules/:id
export async function deleteSchedule(id: number) {
  const res = await api.delete(`/schedules/${id}`);
  return res.data;
}
