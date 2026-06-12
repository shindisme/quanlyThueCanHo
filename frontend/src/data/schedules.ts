import type { ViewingSchedule } from "../types";

// Du lieu gia lich xem phong
export const mockViewingSchedules: ViewingSchedule[] = [
  { id: 1, apartment_id: 3, guest_name: "Tran Minh Tuan", guest_phone: "0933000001", guest_email: "tuan.tm@gmail.com", schedule_time: "2026-06-12T09:00:00Z", status: "CONFIRMED", created_at: "2026-06-08T00:00:00Z" },
  { id: 2, apartment_id: 5, guest_name: "Le Thi Ngoc", guest_phone: "0933000002", guest_email: "ngoc.lt@gmail.com", schedule_time: "2026-06-12T14:00:00Z", status: "PENDING", created_at: "2026-06-09T00:00:00Z" },
  { id: 3, apartment_id: 8, guest_name: "Phan Van Son", guest_phone: "0933000003", guest_email: null, schedule_time: "2026-06-13T10:00:00Z", status: "PENDING", created_at: "2026-06-09T00:00:00Z" },
  { id: 4, apartment_id: 10, guest_name: "Nguyen Hoang Yen", guest_phone: "0933000004", guest_email: "yen.nh@gmail.com", schedule_time: "2026-06-14T15:00:00Z", status: "CONFIRMED", created_at: "2026-06-07T00:00:00Z" },
  { id: 5, apartment_id: 13, guest_name: "Dang Quoc Bao", guest_phone: "0933000005", guest_email: "bao.dq@gmail.com", schedule_time: "2026-06-11T09:30:00Z", status: "DONE", created_at: "2026-06-05T00:00:00Z" },
  { id: 6, apartment_id: 16, guest_name: "Vu Thi Dao", guest_phone: "0933000006", guest_email: null, schedule_time: "2026-06-15T11:00:00Z", status: "PENDING", created_at: "2026-06-09T00:00:00Z" },
  { id: 7, apartment_id: 19, guest_name: "Cao Hoai Nam", guest_phone: "0933000007", guest_email: "nam.ch@gmail.com", schedule_time: "2026-06-10T16:00:00Z", status: "CANCELLED", created_at: "2026-06-06T00:00:00Z" },
];
