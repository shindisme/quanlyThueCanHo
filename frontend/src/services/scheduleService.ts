import api from "../lib/api";

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

export async function getSchedules(): Promise<ScheduleData[]> {
  const res = await api.get<any>("/schedules");
  return res.data.data || res.data;
}

export async function confirmSchedule(id: number) {
  const res = await api.put(`/schedules/${id}/confirm`, { status: "CONFIRMED" });
  return res.data;
}

export async function cancelSchedule(id: number) {
  const res = await api.put(`/schedules/${id}/cancel`);
  return res.data;
}

export async function deleteSchedule(id: number) {
  const res = await api.delete(`/schedules/${id}`);
  return res.data;
}
