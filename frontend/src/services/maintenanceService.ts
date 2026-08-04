import api from "../lib/api";
import type { MaintenanceRequest, MaintenanceFilters, CreateMaintenanceRequestPayload, ConfirmMaintenanceRequestPayload, UnableMaintenanceRequestPayload, ApiPagination } from "../types";
export type { MaintenanceFilters, CreateMaintenanceRequestPayload, ConfirmMaintenanceRequestPayload, UnableMaintenanceRequestPayload };


const MAINTENANCE_API = "/maintenance";

export async function getAll(params?: MaintenanceFilters): Promise<{ data: MaintenanceRequest[]; pagination: ApiPagination }> {
  const res = await api.get<{ data: MaintenanceRequest[]; pagination?: ApiPagination; meta?: { pagination?: ApiPagination } }>(MAINTENANCE_API, { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };
  return { data: rawData, pagination };
}

export async function getById(id: number): Promise<MaintenanceRequest> {
  const res = await api.get<{ data: MaintenanceRequest }>(`${MAINTENANCE_API}/${id}`);
  return res.data.data;
}

export async function create(data: CreateMaintenanceRequestPayload): Promise<MaintenanceRequest> {
  const res = await api.post<{ data: MaintenanceRequest }>(MAINTENANCE_API, data);
  return res.data.data;
}

export async function cancel(id: number): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`${MAINTENANCE_API}/${id}/cancel`);
  return res.data.data;
}

export async function confirm(id: number, data: ConfirmMaintenanceRequestPayload): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`${MAINTENANCE_API}/${id}/confirm`, data);
  return res.data.data;
}

export async function unable(id: number, data: UnableMaintenanceRequestPayload): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`${MAINTENANCE_API}/${id}/unable`, data);
  return res.data.data;
}

export async function complete(id: number, data?: { charge_tenant: boolean; repair_fee?: number }): Promise<MaintenanceRequest> {
  const res = await api.put<{ data: MaintenanceRequest }>(`${MAINTENANCE_API}/${id}/complete`, data);
  return res.data.data;
}

export const maintenanceService = {
  getAll,
  getById,
  create,
  cancel,
  confirm,
  unable,
  complete,
};
