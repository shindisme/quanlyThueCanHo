import type { InvoiceStatus } from "../constants/enums";
import type { RentalContract } from "./contract";
import type { Tenant } from "./tenant";
import type { Payment } from "./payment";

export interface Invoice {
  id: number;
  invoice_code: string;
  contract_id: number;
  tenant_id: number;
  due_date: string;
  total_amount: number;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
  contract?: RentalContract;
  tenant?: Tenant;
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
  electric_tier_details?: InvoiceElectricTierDetail[];
}

export interface InvoiceElectricTierDetail {
  tier: number;
  label: string;
  quantity: number;
  unit_price: number;
  amount: number;
}