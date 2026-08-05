import api from "../lib/api";
import type { Staff, StaffQuery, CreateStaffRequest, UpdateStaffRequest, ApiPagination } from "../types";
export type { StaffQuery, CreateStaffRequest, UpdateStaffRequest };
import { fetchAllPages } from "./apiHelper";

const STAFF_API = "/staff";

export async function getAll(params?: StaffQuery): Promise<{ data: Staff[]; pagination?: ApiPagination }> {
  const res = await api.get<{ data: Staff[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(STAFF_API, { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination;
  return { data: rawData, pagination };
}

export async function getAllPage(params?: Omit<StaffQuery, "page" | "limit">): Promise<{ data: Staff[] }> {
  return fetchAllPages<Staff, StaffQuery>(getAll, params);
}

export async function create(data: CreateStaffRequest | Partial<Staff>): Promise<Staff> {
  const res = await api.post<{ data: Staff }>(STAFF_API, data);
  return res.data.data || (res.data as unknown as Staff);
}

export async function update(
  id: number,
  data: UpdateStaffRequest | Partial<Pick<Staff, "full_name" | "phone" | "position" | "building_id">>,
): Promise<Staff> {
  const res = await api.put<{ data: Staff }>(`${STAFF_API}/${id}`, data);
  return res.data.data || (res.data as unknown as Staff);
}

export async function remove(id: number): Promise<void> {
  await api.delete(`${STAFF_API}/${id}`);
}

export const staffService = {
  getAll,
  getAllPage,
  create,
  update,
  remove,
};
