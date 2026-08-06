import api from "../lib/api";
import type { ApiPagination, Reservation, ReservationQuery, ReservationStatus, CreateReservationPayload } from "../types";

export type { Reservation, ReservationStatus, ReservationQuery, CreateReservationPayload };

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