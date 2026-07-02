import type { Role, UserStatus } from "../constants/enums";
import type { Tenant } from "./tenant";
import type { Building } from "./building";

export interface User {
  id: number;
  email: string;
  username?: string;
  phone: string | null;
  password_hash: string;
  role: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  tenant_profile?: Tenant;
  managedBuildingId?: number;
}

export interface Staff {
  id: number;
  user_id: number | null;
  building_id: number | null;
  full_name: string;
  phone: string | null;
  position: string;
  created_at: string;
  user?: User;
  building?: Building;
}
