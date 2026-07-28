import type { InvoiceStatus } from "../constants/enums";
import type { RentalContract } from "./contract";
import type { Tenant } from "./tenant";
import type { Payment } from "./payment";
import type { Apartment } from "./apartment";

export type InvoiceTenant = Pick<Tenant, "id" | "user_id" | "full_name" | "phone" | "email"> & {
  user?: Tenant["user"];
};

export interface InvoiceReservation {
  id: number;
  apartment_id: number;
  tenant_id: number;
  contract_id: number | null;
  deposit_amount: number;
  reserved_at: string;
  expires_at: string;
  status: string;
  apartment?: (Pick<Apartment, "id" | "floor" | "room_number"> &
    Partial<Pick<Apartment, "building_id" | "area" | "rental_price" | "status">> & {
      building?: Apartment["building"] | null;
    }) | null;
  tenant?: InvoiceTenant | null;
}

export interface Invoice {
  id: number;
  invoice_code: string;
  contract_id: number | null;
  reservation_id?: number | null;
  tenant_id: number;
  due_date: string;
  total_amount: number;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
  contract?: RentalContract | null;
  tenant?: InvoiceTenant | null;
  reservation?: InvoiceReservation | null;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  description: string | null;
  utility_type?: "ELECTRIC" | "WATER";
  tier_details?: InvoiceElectricTierDetail[];
  electric_tier_details?: InvoiceElectricTierDetail[];
  water_tier_details?: InvoiceElectricTierDetail[];
}

export interface InvoiceElectricTierDetail {
  tier: number;
  label: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoiceFilters {
  status?: string;
  tenant_id?: number;
  contract_id?: number;
  apartment_id?: number;
  building_id?: number;
  month?: number;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GenerateMonthlyInvoicesPayload {
  month?: number;
  year?: number;
  building_id?: number;
  due_date?: string;
  management_fee_per_m2?: number;
  electric_tier_prices?: number[];
  water_tier_prices?: number[];
  internet_fee?: number;
  notify?: boolean;
}