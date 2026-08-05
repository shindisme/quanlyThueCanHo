import api from "../lib/api";
import type { Occupant, CreateOccupantPayload } from "../types";
export type { Occupant, CreateOccupantPayload };


const OCCUPANT_API = "/occupants";

export async function getAll(params?: { tenant_id?: number }): Promise<{ data: Occupant[] }> {
  const res = await api.get<{ data: Occupant[] }>(OCCUPANT_API, { params });
  return res.data;
}

export async function create(payload: CreateOccupantPayload): Promise<{ data: Occupant }> {
  const res = await api.post<{ data: Occupant }>(OCCUPANT_API, payload);
  return res.data;
}

export async function update(id: number, payload: Partial<CreateOccupantPayload>): Promise<{ data: Occupant }> {
  const res = await api.put<{ data: Occupant }>(`${OCCUPANT_API}/${id}`, payload);
  return res.data;
}

export async function remove(id: number): Promise<{ success: boolean }> {
  const res = await api.delete<{ success: boolean }>(`${OCCUPANT_API}/${id}`);
  return res.data;
}

export const occupantService = {
  getAll,
  create,
  update,
  remove,
};
