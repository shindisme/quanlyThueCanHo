import type { ScheduleStatus } from "../constants/enums";
import type { Apartment } from "./apartment";

export interface ViewingSchedule {
  id: number;
  apartment_id: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  schedule_time: string;
  status: ScheduleStatus;
  created_at: string;
  apartment?: Apartment;
}

export interface ScheduleData {
  id: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  apartment_id: number;
  schedule_time: string;
  status: string;
  created_at: string;
  temp_locked_until: string | null;
  apartment?: {
    id: number;
    room_number: string;
    floor: number;
    building_id: number;
  };
}

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

