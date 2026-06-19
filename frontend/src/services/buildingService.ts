import api from "../lib/api";

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
    role: string;
  } | null;
}

export interface BuildingPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllBuildings(params?: {
  search?: string;
  branch_name?: string;
  page?: number;
  limit?: number;
  managerId?: number;
}): Promise<{ data: BuildingData[]; pagination: BuildingPagination }> {
  const res = await api.get<any>("/buildings", { params });
  if (res.data.data && res.data.pagination) {
    const mappedData = res.data.data.map((b: any) => {
      const staff = b.assigned_staff?.[0];
      return {
        ...b,
        manager_id: staff ? staff.id : null,
        manager: staff ? {
          id: staff.id,
          username: staff.user?.username || staff.full_name,
          role: staff.user?.role || "MANAGER",
        } : null
      };
    });
    return {
      ...res.data,
      data: mappedData
    };
  }
  const rawList = Array.isArray(res.data) ? res.data : [];
  const mappedList = rawList.map((b: any) => {
    const staff = b.assigned_staff?.[0];
    return {
      ...b,
      manager_id: staff ? staff.id : null,
      manager: staff ? {
        id: staff.id,
        username: staff.user?.username || staff.full_name,
        role: staff.user?.role || "MANAGER",
      } : null
    };
  });
  return { data: mappedList, pagination: { total: mappedList.length, page: 1, limit: 10, totalPages: 1 } };
}

export async function getBuildingById(id: number): Promise<BuildingData> {
  const res = await api.get<BuildingData>(`/buildings/${id}`);
  const b = res.data as any;
  const staff = b.assigned_staff?.[0];
  return {
    ...b,
    manager_id: staff ? staff.id : null,
    manager: staff ? {
      id: staff.id,
      username: staff.user?.username || staff.full_name,
      role: staff.user?.role || "MANAGER",
    } : null
  };
}

export async function createBuilding(data: FormData | any) {
  const headers: Record<string, string> = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }
  const res = await api.post("/buildings", data, { headers });
  return res.data;
}

export async function updateBuilding(id: number, data: FormData | any) {
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
