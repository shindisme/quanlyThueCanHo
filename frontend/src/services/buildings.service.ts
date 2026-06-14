import api from "../lib/api";

// ============================================================
// BUILDINGS SERVICE - CRUD tòa nhà
// ============================================================

export interface BuildingData {
  id: number;
  name: string;
  address: string;
  total_floors: number;
  description: string | null;
  branch_name: string;
  created_at: string;
}

// Lấy tất cả tòa nhà - GET /buildings
export async function getAllBuildings(): Promise<BuildingData[]> {
  const res = await api.get<any>("/buildings");
  return res.data.data || res.data;
}

// Lấy 1 tòa nhà theo ID - GET /buildings/:id
export async function getBuildingById(id: number): Promise<BuildingData> {
  const res = await api.get<BuildingData>(`/buildings/${id}`);
  return res.data;
}

// Tạo tòa nhà mới - POST /buildings
export async function createBuilding(data: {
  name: string;
  address: string;
  total_floors: number;
  description?: string;
  branch_name?: string;
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
