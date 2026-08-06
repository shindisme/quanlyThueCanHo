import type { ReservationStatus } from "../constants/enums";
import type { Tenant } from "./tenant";
import type { Apartment } from "./apartment";

export type { ReservationStatus };

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
