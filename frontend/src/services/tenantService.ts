import api from "../lib/api";
import type { Tenant } from "../types";

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
  const res = await api.post("/tenants", data);
  return res.data.data || res.data;
}

export async function updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
  const res = await api.put(`/tenants/${id}`, data);
  return res.data.data || res.data;
}

export async function deleteTenant(id: number): Promise<void> {
  await api.delete(`/tenants/${id}`);
}
