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
