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
