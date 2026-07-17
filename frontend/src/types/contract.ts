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

export interface RawContract {
  id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  monthly_rent: number;
  status: string;
  contract_file?: string | null;
  signed_at?: string | null;
  created_by?: number | null;
  created_at: string;
  tenant?: Tenant;
  apartment?: Apartment;
}

export interface ContractQuery {
  buildingId?: number;
  status?: string;
  search?: string;
  tenantId?: number;
  apartmentId?: number;
  page?: number;
  limit?: number;
}

export interface CreateContractRequest {
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  monthly_rent: number;
  signed_at?: string;
}

export type UpdateContractRequest = Partial<CreateContractRequest>;

