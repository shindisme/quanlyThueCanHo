import api from "../lib/api";
import type { ApiPagination, Apartment, Tenant } from "../types";

export interface CreateReservationPayload {
  apartment_id: number;
  deposit_amount: number;
  move_in_date: string;
  tenant: {
    full_name: string;
    phone?: string | null;
    email: string;
    date_of_birth?: string | null;
    citizen_id: string;
    address?: string | null;
  };
}

export type ReservationStatus = "ACTIVE" | "CONVERTED" | "FORFEITED" | "CANCELLED" | "DEPOSITED";

export interface Reservation {
  id: number;
  apartment_id: number;
  tenant_id: number;
  contract_id: number | null;
  deposit_amount: number;
  reserved_at: string;
  expires_at: string;
  status: ReservationStatus;
  created_at: string;
  tenant?: Pick<Tenant, "id" | "user_id" | "full_name" | "phone" | "email" | "citizen_id" | "is_verified">;
  apartment?: Pick<Apartment, "id" | "building_id" | "floor" | "room_number" | "status">;
}

export interface ReservationQuery {
  status?: ReservationStatus;
  tenant_id?: number;
  apartment_id?: number;
  page?: number;
  limit?: number;
}

export async function getReservations(params?: ReservationQuery): Promise<{ data: Reservation[]; pagination?: ApiPagination }> {
  const res = await api.get<{
    success: boolean;
    data: Reservation[];
    meta?: { pagination?: ApiPagination };
    pagination?: ApiPagination;
  }>("/reservations", { params });

  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination,
  };
}

export async function createReservationDeposit(data: CreateReservationPayload) {
  const res = await api.post("/reservations", data);
  return res.data.data;
}

export async function expireReservations() {
  const res = await api.post("/reservations/expire");
  return res.data.data;
}