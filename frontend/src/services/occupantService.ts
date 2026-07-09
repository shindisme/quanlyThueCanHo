import api from "../lib/api";

export interface Occupant {
  id: number;
  tenant_id: number;
  full_name: string;
  phone?: string | null;
  citizen_id: string;
  date_of_birth?: string | Date | null;
  created_at?: string;
}

export interface CreateOccupantPayload {
  full_name: string;
  phone?: string | null;
  citizen_id: string;
  date_of_birth?: string | Date | null;
}

export async function getOccupants(params?: { tenant_id?: number }): Promise<{ data: Occupant[] }> {
  const res = await api.get<{ data: Occupant[] }>("/occupants", { params });
  return res.data;
}

export async function createOccupant(payload: CreateOccupantPayload): Promise<{ data: Occupant }> {
  const res = await api.post<{ data: Occupant }>("/occupants", payload);
  return res.data;
}

export async function updateOccupant(id: number, payload: Partial<CreateOccupantPayload>): Promise<{ data: Occupant }> {
  const res = await api.put<{ data: Occupant }>(`/occupants/${id}`, payload);
  return res.data;
}

export async function deleteOccupant(id: number): Promise<{ success: boolean }> {
  const res = await api.delete<{ success: boolean }>(`/occupants/${id}`);
  return res.data;
}
