import api from "../lib/api";
import type { MaintenanceRequest } from "../types";

export interface MaintenancePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllMaintenanceRequests(params?: {
  status?: string;
  priority?: string;
  building_id?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: MaintenanceRequest[]; pagination: MaintenancePagination }> {
  const res = await api.get<{ data: MaintenanceRequest[]; pagination?: MaintenancePagination; meta?: { pagination?: MaintenancePagination } }>("/maintenance", { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };
  return { data: rawData, pagination };
}

export async function getMaintenanceRequestById(id: number): Promise<MaintenanceRequest> {
  const res = await api.get<{ data: MaintenanceRequest }>(`/maintenance/${id}`);
  return res.data.data;
}

export async function createMaintenanceRequest(data: {
  apartment_id: number;
  title: string;
  description: string;
  priority: string;
  image_url?: string;
}): Promise<MaintenanceRequest> {
  const res = await api.post<{ data: MaintenanceRequest }>("/maintenance", data);
  return res.data.data;
}

export async function cancelMaintenanceRequest(id: number): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`/maintenance/${id}/cancel`);
  return res.data.data;
}

export async function confirmMaintenanceRequest(
  id: number,
  data: { assigned_staff_id: number; scheduled_at: string }
): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`/maintenance/${id}/confirm`, data);
  return res.data.data;
}

export async function unableMaintenanceRequest(
  id: number,
  data: { reason: string }
): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`/maintenance/${id}/unable`, data);
  return res.data.data;
}

export async function completeMaintenanceRequest(id: number): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`/maintenance/${id}/complete`);
  return res.data.data;
}
