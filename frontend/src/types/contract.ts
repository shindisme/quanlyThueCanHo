import type { ContractStatus } from "../constants/enums";
import type { Apartment } from "./apartment";
import type { Tenant } from "./tenant";
import type { Invoice } from "./invoice";

export interface RentalContract {
  id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  monthly_rent: number;
  status: ContractStatus;
  contractFile: string | null;
  signedAt: string;
  createdBy: number;
  created_at: string;
  actual_occupants?: number;
  max_occupants?: number;
  apartment?: Apartment;
  tenant?: Tenant;
  invoices?: Invoice[];
}
