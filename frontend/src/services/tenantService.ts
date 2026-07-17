import api from "../lib/api";
import type { Tenant, TenantOccupant, TenantQuery, OccupantForm, ApiPagination } from "../types";
export type { TenantQuery, OccupantForm, ApiPagination };
import { fetchAllPages } from "./apiHelper";

const TENANT_API = "/tenants";

function occupantPayload(data: OccupantForm) {
  return {
    full_name: data.name,
    citizen_id: data.cccd,
    date_of_birth: data.dob ? data.dob.slice(0, 10) : null,
    phone: data.phone || null,
  };
}

export async function getAll(params?: TenantQuery): Promise<{ data: Tenant[]; pagination?: ApiPagination }> {
  const res = await api.get<{
    success?: boolean;
    data?: Tenant[];
    meta?: { pagination?: ApiPagination };
  }>(TENANT_API, { params });

  if (res.data.success && Array.isArray(res.data.data)) {
    return {
      data: res.data.data,
      pagination: res.data.meta?.pagination,
    };
  }
  return { data: Array.isArray(res.data) ? (res.data as unknown as Tenant[]) : [] };
}

export async function getAllPage(params?: Omit<TenantQuery, "page" | "limit">): Promise<{ data: Tenant[] }> {
  return fetchAllPages<Tenant, TenantQuery>(getAll, params);
}

export async function create(data: Partial<Tenant>): Promise<Tenant> {
  const payload = {
    ...data,
    date_of_birth: data.date_of_birth?.slice(0, 10) ?? null,
  };
  delete payload.user_id;
  const res = await api.post<{ data: Tenant }>(TENANT_API, payload);
  return res.data.data || (res.data as unknown as Tenant);
}

export async function getById(id: number): Promise<Tenant> {
  const res = await api.get<{ success?: boolean; data?: Tenant }>(`${TENANT_API}/${id}`);
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  return res.data as unknown as Tenant;
}

export async function update(id: number, data: Partial<Tenant>): Promise<Tenant> {
  const res = await api.put<{ data: Tenant }>(`${TENANT_API}/${id}`, data);
  return res.data.data || (res.data as unknown as Tenant);
}

export async function deleteTenant(id: number): Promise<void> {
  await api.delete(`${TENANT_API}/${id}`);
}

export async function getMyOccupants(): Promise<TenantOccupant[]> {
  const res = await api.get<{ success?: boolean; data?: TenantOccupant[] }>(`${TENANT_API}/me/occupants`);
  if (res.data.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return Array.isArray(res.data) ? (res.data as unknown as TenantOccupant[]) : [];
}

export async function createMyOccupant(data: OccupantForm): Promise<TenantOccupant> {
  const res = await api.post<{ data: TenantOccupant }>(`${TENANT_API}/me/occupants`, occupantPayload(data));
  return res.data.data || (res.data as unknown as TenantOccupant);
}

export async function updateMyOccupant(id: number, data: OccupantForm): Promise<TenantOccupant> {
  const res = await api.put<{ data: TenantOccupant }>(`${TENANT_API}/me/occupants/${id}`, occupantPayload(data));
  return res.data.data || (res.data as unknown as TenantOccupant);
}

export async function deleteMyOccupant(id: number): Promise<void> {
  await api.delete(`${TENANT_API}/me/occupants/${id}`);
}

export const getAllTenants = getAll;
export const getAllTenantsPage = getAllPage;
export const createTenant = create;
export const getTenantById = getById;
export const updateTenant = update;

export const tenantService = {
  getAll,
  getAllPage,
  create,
  getById,
  update,
  delete: deleteTenant,
  getMyOccupants,
  createMyOccupant,
  updateMyOccupant,
  deleteMyOccupant,
};