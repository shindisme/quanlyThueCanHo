import type { ScheduleStatus, AttendanceStatus } from "../constants/enums";
import type { Apartment } from "./apartment";

export interface ViewingSchedule {
  id: number;
  apartment_id: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  note?: string | null;
  schedule_time: string;
  status: ScheduleStatus;
  attendance_status?: AttendanceStatus;
  cancel_reason?: string | null;
  created_at: string;
  apartment?: Pick<Apartment, "id" | "room_number" | "floor" | "building_id">;
}

export type ScheduleData = ViewingSchedule;

export interface ScheduleFilters {
  building_id?: number;
  apartment_id?: number;
  status?: string;
  date?: string;
  guestName?: string;
  page?: number;
  limit?: number;
}

export interface BookViewingPayload {
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  apartment_id: number;
  schedule_time: string;
  note?: string;
}
