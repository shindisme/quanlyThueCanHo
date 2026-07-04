import api from "../lib/api";
import type { Staff } from "../types";

export async function getAllStaff(params?: {
  building_id?: number;
  position?: string;
}): Promise<{ data: Staff[] }> {
  const res = await api.get<{ success?: boolean; data?: Staff[] }>("/staff", { params });
  if (res.data.success && Array.isArray(res.data.data)) {
    return { data: res.data.data };
  }
  return { data: Array.isArray(res.data) ? res.data : [] };
}

export async function createStaff(data: Partial<Staff>): Promise<Staff> {
  const res = await api.post("/staff", data);
  return res.data.data || res.data;
}

export async function updateStaff(
  id: number,
  data: Partial<Pick<Staff, "full_name" | "phone" | "position" | "building_id">>,
): Promise<Staff> {
  const res = await api.put(`/staff/${id}`, data);
  return res.data.data || res.data;
}

export async function deleteStaff(id: number): Promise<void> {
  await api.delete(`/staff/${id}`);
}
