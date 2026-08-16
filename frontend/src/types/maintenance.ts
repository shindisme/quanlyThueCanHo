import type { Priority, RequestStatus } from "../constants/enums";
import type { Tenant } from "./tenant";
import type { Apartment } from "./apartment";

export interface MaintenanceRequest {
  id: number;
  tenant_id: number;
  apartment_id: number;
  title: string;
  description: string;
  image_url: string | null;
  priority: Priority;
  status: RequestStatus;
  assigned_staff_id?: number | null;
  scheduled_at?: string | null;
  unable_reason?: string | null;
  charge_tenant?: boolean;
  repair_fee?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  apartment?: Apartment;
  assigned_staff?: {
    id: number;
    full_name: string;
    phone: string;
    position: string;
    building_id?: number | null;
  } | null;
}

export interface MaintenanceFilters {
  status?: string;
  priority?: string;
  building_id?: number;
  page?: number;
  limit?: number;
}

export interface CreateMaintenanceRequestPayload {
  apartment_id: number;
  title: string;
  description: string;
  priority: string;
  image_url?: string;
}

export interface ConfirmMaintenanceRequestPayload {
  assigned_staff_id: number;
  scheduled_at: string;
  priority?: Priority;
}

export interface UnableMaintenanceRequestPayload {
  reason: string;
}

