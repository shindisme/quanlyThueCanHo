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
  tenant?: Tenant;
  managedBuildingId?: number;
  managed_building?: Building;
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

export interface LoginResponse {
  token: string;
  role: string;
}

export interface UserData {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
  tenant?: Tenant | null;
  tenant_profile?: Tenant | null;
  managed_building?: {
    id: number;
    branch_name: string;
    address_new: string;
  } | null;
}

export interface CreateUserResponse extends UserData {
  initial_password?: string;
}

export interface CreateUserRequest {
  username: string;
  role: string;
}

export interface UpdateUserRequest {
  username?: string;
  role?: string;
  status?: string;
}

export interface StaffQuery {
  building_id?: number;
  position?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateStaffRequest {
  full_name: string;
  phone?: string | null;
  position: string;
  building_id?: number | null;
}

export type UpdateStaffRequest = Partial<CreateStaffRequest>;


