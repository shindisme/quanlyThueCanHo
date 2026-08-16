import api from "../lib/api";
import type { ScheduleData, ScheduleFilters, BookViewingPayload, ApiPagination } from "../types";
export type { ScheduleData, ScheduleFilters, BookViewingPayload };
import { fetchAllPages } from "./apiHelper";

export interface ViewingAvailability {
  apartment_id: number;
  building_id: number;
  date: string;
  capacity: number;
  booked: number;
  remaining: number;
  is_full: boolean;
}
const SCHEDULE_API = "/schedules";

export async function bookViewing(data: BookViewingPayload): Promise<unknown> {
  const res = await api.post(`${SCHEDULE_API}/book`, data);
  return res.data;
}

export async function getViewingAvailability(apartmentId: number, date: string): Promise<ViewingAvailability> {
  const res = await api.get<{ data: ViewingAvailability }>(
    `${SCHEDULE_API}/availability`,
    { params: { apartment_id: apartmentId, date } },
  );
  return res.data.data;
}

export async function getAll(params?: ScheduleFilters): Promise<{ data: ScheduleData[]; pagination?: ApiPagination }> {
  const res = await api.get<{ data: ScheduleData[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(SCHEDULE_API, { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination;
  return { data: rawData, pagination };
}

export async function getAllPage(params?: Omit<ScheduleFilters, "page" | "limit">): Promise<{ data: ScheduleData[] }> {
  return fetchAllPages<ScheduleData, ScheduleFilters>(getAll, params);
}

export async function confirm(id: number): Promise<unknown> {
  const res = await api.put(`${SCHEDULE_API}/${id}/confirm`, { status: "CONFIRMED" });
  return res.data;
}

export async function cancel(id: number, cancelReason?: string): Promise<unknown> {
  const res = await api.put(`${SCHEDULE_API}/${id}/cancel`, { cancel_reason: cancelReason });
  return res.data;
}

export async function remove(id: number): Promise<unknown> {
  const res = await api.delete(`${SCHEDULE_API}/${id}`);
  return res.data;
}

export async function markAttended(id: number): Promise<unknown> {
  const res = await api.put(`${SCHEDULE_API}/${id}/attended`);
  return res.data;
}

export async function markAbsent(id: number): Promise<unknown> {
  const res = await api.put(`${SCHEDULE_API}/${id}/absent`);
  return res.data;
}

export const scheduleService = {
  bookViewing,
  getViewingAvailability,
  getAll,
  getAllPage,
  confirm,
  cancel,
  markAttended,
  markAbsent,
  remove,
};

