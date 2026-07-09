import type { User } from "./user";
import type { RentalContract } from "./contract";
import type { Invoice } from "./invoice";
import type { MaintenanceRequest } from "./maintenance";

export interface TenantOccupant {
  id: number;
  tenant_id: number;
  full_name: string;
  citizen_id: string;
  date_of_birth: string | null;
  phone: string | null;
  created_at: string;
}

export interface Tenant {
  id: number;
  user_id: number | null;
  full_name: string;
  citizen_id: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;

  user?: User;
  contracts?: RentalContract[];
  invoices?: Invoice[];
  maintenance_requests?: MaintenanceRequest[];
  occupants?: TenantOccupant[];
}