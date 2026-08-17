import type { Apartment } from "./apartment";

export interface Building {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  status: string;
  total_floors: number;
  total_apartments: number;
  branch_name: string;
  thumbnail_url: string | null;
  created_at: string;
  apartments?: Apartment[];
  _count?: { apartments: number };
  manager_id?: number | null;
  manager?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  } | null;
}

export type BuildingData = Building;

export interface RawBuildingData {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  total_floors: number;
  total_apartments: number;
  description: string | null;
  status: string;
  branch_name: string;
  thumbnail_url: string | null;
  created_at: string;
  _count?: { apartments: number };
  assigned_staff?: {
    id: number;
    full_name: string;
    user?: {
      username: string;
      role: string;
    };
  }[];
}

export interface BuildingQuery {
  search?: string;
  branch_name?: string;
  page?: number;
  limit?: number;
  managerId?: number;
  status?: string;
}

export interface CreateBuildingRequest {
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  total_floors: number;
  total_apartments?: number;
  description?: string | null;
  status?: string;
  branch_name: string;
  thumbnail_url?: string | null;
}

export type UpdateBuildingRequest = Partial<CreateBuildingRequest>;
