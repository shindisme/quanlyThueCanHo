import api from "../lib/api";
import type { Tenant, TenantOccupant } from "../types";

type OccupantForm = {
  name: string;
  cccd: string;
  dob?: string | null;
  phone?: string | null;
};

function occupantPayload(data: OccupantForm) {
  return {
    full_name: data.name,
    citizen_id: data.cccd,
    date_of_birth: data.dob ? data.dob.slice(0, 10) : null,
    phone: data.phone || null,
  };
}

export async function getAllTenants(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Tenant[] }> {
  const res = await api.get<{ success?: boolean; data?: Tenant[] }>("/tenants", { params });
  if (res.data.success && Array.isArray(res.data.data)) {
    return { data: res.data.data };
  }
  return { data: Array.isArray(res.data) ? res.data : [] };
}

export async function createTenant(data: Partial<Tenant>): Promise<Tenant> {
  const payload = {
    ...data,
    date_of_birth: data.date_of_birth?.slice(0, 10) ?? null,
  };
  delete payload.user_id;
  const res = await api.post("/tenants", payload);
  return res.data.data || res.data;
}

export async function getTenantById(id: number): Promise<Tenant> {
  const res = await api.get<{ success?: boolean; data?: Tenant }>(`/tenants/${id}`);
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  return res.data as unknown as Tenant;
}

export async function updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
  const res = await api.put(`/tenants/${id}`, data);
  return res.data.data || res.data;
}

export async function deleteTenant(id: number): Promise<void> {
  await api.delete(`/tenants/${id}`);
}

export async function getMyOccupants(): Promise<TenantOccupant[]> {
  const res = await api.get<{ success?: boolean; data?: TenantOccupant[] }>("/tenants/me/occupants");
  if (res.data.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function createMyOccupant(data: OccupantForm): Promise<TenantOccupant> {
  const res = await api.post("/tenants/me/occupants", occupantPayload(data));
  return res.data.data || res.data;
}

export async function updateMyOccupant(id: number, data: OccupantForm): Promise<TenantOccupant> {
  const res = await api.put(`/tenants/me/occupants/${id}`, occupantPayload(data));
  return res.data.data || res.data;
}

export async function deleteMyOccupant(id: number): Promise<void> {
  await api.delete(`/tenants/me/occupants/${id}`);
}