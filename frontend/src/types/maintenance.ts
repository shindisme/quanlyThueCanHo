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
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  apartment?: Apartment;
}
