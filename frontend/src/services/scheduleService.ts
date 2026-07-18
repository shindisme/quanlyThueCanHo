import api from "../lib/api";
import type { ScheduleData, ScheduleFilters, BookViewingPayload, ApiPagination } from "../types";
export type { ScheduleData, ScheduleFilters, BookViewingPayload };
import { fetchAllPages } from "./apiHelper";

const SCHEDULE_API = "/schedules";

export async function bookViewing(data: BookViewingPayload): Promise<unknown> {
  const res = await api.post(`${SCHEDULE_API}/book`, data);
  return res.data;
}

export async function getViewingAvailability(apartmentId: number, date: string): Promise<{ available_hours: number[] }> {
  const res = await api.get<{ data: { available_hours: number[] } }>(
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

export async function confirmSchedule(id: number): Promise<unknown> {
  const res = await api.put(`${SCHEDULE_API}/${id}/confirm`, { status: "CONFIRMED" });
  return res.data;
}

export async function cancelSchedule(id: number): Promise<unknown> {
  const res = await api.put(`${SCHEDULE_API}/${id}/cancel`);
  return res.data;
}

export async function deleteSchedule(id: number): Promise<unknown> {
  const res = await api.delete(`${SCHEDULE_API}/${id}`);
  return res.data;
}

export const getAllSchedules = getAll;
export const getAllSchedulesPage = getAllPage;

export const scheduleService = {
  bookViewing,
  getViewingAvailability,
  getAll,
  getAllPage,
  confirmSchedule,
  cancelSchedule,
  deleteSchedule,
};
