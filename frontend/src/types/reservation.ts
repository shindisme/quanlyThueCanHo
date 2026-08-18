import type { ReservationStatus } from "../constants/enums";
import type { Tenant } from "./tenant";
import type { Apartment } from "./apartment";

export type { ReservationStatus };

type CreateReservationPayloadBase = {
  apartment_id: number;
  deposit_amount: number;
  payment_method: "VNPAY" | "CASH";
  move_in_date: string;
};

export type CreateReservationPayload = CreateReservationPayloadBase & (
  | {
      tenant_id: number;
      tenant?: never;
    }
  | {
      tenant: {
        full_name: string;
        phone?: string | null;
        email: string;
        date_of_birth?: string | null;
        citizen_id: string;
        address?: string | null;
      };
      tenant_id?: never;
    }
);

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
  tenant?: Pick<Tenant, "id" | "user_id" | "full_name" | "phone" | "email" | "citizen_id" | "is_verified"> & {
    address?: string | null;
    date_of_birth?: string | null;
    user?: {
      username: string;
      role: string;
      status: string;
    } | null;
  };
  apartment?: Pick<Apartment, "id" | "building_id" | "floor" | "room_number" | "status"> & {
    rental_price?: number | string;
    building?: {
      id: number;
      branch_name: string;
      address: string;
    };
  };
  invoices?: Array<{
    id: number;
    invoice_code: string;
    total_amount: number | string;
    status: string;
    due_date?: string | null;
    paid_at?: string | null;
    type?: string;
  }>;
}

export interface ReservationQuery {
  status?: ReservationStatus;
  tenant_id?: number;
  apartment_id?: number;
  page?: number;
  limit?: number;
}