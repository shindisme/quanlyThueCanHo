import api from "../lib/api";
import { getAllStaff } from "./staffService";
import type { Staff } from "../types";

export interface BuildingData {
  id: number;
  name: string;
  address_old: string;
  address_new: string;
  total_floors: number;
  total_apartments: number;
  description: string | null;
  status: string;
  branch_name: string;
  thumbnail_url: string | null;
  created_at: string;
  _count?: { apartments: number };
  manager_id?: number | null;
  manager?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  } | null;
}

export interface BuildingPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RawBuildingData {
  id: number;
  name: string;
  address_old: string;
  address_new: string;
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

function mapBuildingWithManager(building: RawBuildingData, staff: Staff | undefined): BuildingData {
  return {
    ...building,
    manager_id: staff ? staff.id : null,
    manager: staff ? {
      id: staff.id,
      username: staff.user?.username || staff.full_name,
      fullName: staff.full_name,
      role: staff.user?.role || "MANAGER",
    } : null,
  };
}

export async function getAllBuildings(params?: {
  search?: string;
  branch_name?: string;
  page?: number;
  limit?: number;
  managerId?: number;
  status?: string;
}): Promise<{ data: BuildingData[]; pagination: BuildingPagination }> {
  interface BuildingsResponse {
    data: RawBuildingData[];
    meta?: {
      pagination?: BuildingPagination;
    };
    pagination?: BuildingPagination;
  }

  // Tải danh sách tòa nhà raw từ API
  const res = await api.get<BuildingsResponse>("/buildings", { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };

  // get quản lý để phân công
  const staffListRes = await getAllStaff().catch(() => ({ data: [] }));
  const staffList = staffListRes.data || [];

  // ghép dữ liệu nhân viên quản lý vào từng tòa nhà
  const mappedData = rawData.map((b: RawBuildingData) => {
    const staff = staffList.find(
      (s) => s.building_id === b.id && (s.position === "Quản lý" || s.user?.role === "MANAGER")
    );
    return mapBuildingWithManager(b, staff);
  });

  return { data: mappedData, pagination };
}

export async function getBuildingById(id: number): Promise<BuildingData> {
  const res = await api.get<{ data: RawBuildingData }>(`/buildings/${id}`);
  const b = res.data.data;

  // get quản lý để phân công
  const staffListRes = await getAllStaff({ building_id: id }).catch(() => ({ data: [] }));
  const staff = staffListRes.data.find(
    (s) => s.position === "Quản lý" || s.user?.role === "MANAGER"
  );

  return mapBuildingWithManager(b, staff);
}

export async function createBuilding(data: FormData | Partial<BuildingData>) {
  const headers: Record<string, string> = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }
  const res = await api.post("/buildings", data, { headers });
  return res.data;
}

export async function updateBuilding(id: number, data: FormData | Partial<BuildingData>) {
  const headers: Record<string, string> = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }
  const res = await api.put(`/buildings/${id}`, data, { headers });
  return res.data;
}

export async function deleteBuilding(id: number) {
  const res = await api.delete(`/buildings/${id}`);
  return res.data;
}
