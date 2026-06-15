import api from "../lib/api";

export interface BuildingData {
  id: number;
  name: string;
  address_old: string;
  address_new: string;
  total_floors: number;
  total_apartments: number;
  description: string | null;
  status: string; // ACTIVE | INACTIVE
  branch_name: string;
  thumbnail_url: string | null;
  created_at: string;
  _count?: { apartments: number };
}

export interface BuildingPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Lấy tất cả tòa nhà - GET /buildings
export async function getAllBuildings(params?: {
  search?: string;
  branch_name?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: BuildingData[]; pagination: BuildingPagination }> {
  const res = await api.get<any>("/buildings", { params });
  // Backend trả { data: [...], pagination: {...} }
  if (res.data.data && res.data.pagination) {
    return res.data;
  }
  // Fallback nếu trả array
  return { data: res.data, pagination: { total: res.data.length, page: 1, limit: 10, totalPages: 1 } };
}

// Lấy 1 tòa nhà theo ID - GET /buildings/:id
export async function getBuildingById(id: number): Promise<BuildingData> {
  const res = await api.get<BuildingData>(`/buildings/${id}`);
  return res.data;
}

// Tạo tòa nhà mới - POST /buildings
export async function createBuilding(data: {
  name: string;
  address_old: string;
  address_new: string;
  total_floors: number;
  description?: string;
  branch_name: string;
  thumbnail_url?: string | null;
}) {
  const res = await api.post("/buildings", data);
  return res.data;
}

// Cập nhật tòa nhà - PUT /buildings/:id
export async function updateBuilding(id: number, data: Partial<BuildingData>) {
  const res = await api.put(`/buildings/${id}`, data);
  return res.data;
}

// Xóa tòa nhà - DELETE /buildings/:id
export async function deleteBuilding(id: number) {
  const res = await api.delete(`/buildings/${id}`);
  return res.data;
}
