import api from "../lib/api";

// ============================================================
// APARTMENTS SERVICE - CRUD căn hộ
// ============================================================

export interface ApartmentData {
  id: number;
  apartment_code: string;
  building_id: number;
  title: string;
  description: string | null;
  area: number;
  rental_price: number;
  status: string; // AVAILABLE | RENTED | MAINTENANCE
  created_at: string;
  building?: {
    id: number;
    name: string;
  };
}

// Lấy tất cả căn hộ - GET /apartments
export async function getAllApartments(): Promise<ApartmentData[]> {
  const res = await api.get<any>("/apartments");
  const rawData = res.data.data || res.data;
  if (Array.isArray(rawData)) {
    return rawData.map((item: any) => ({
      ...item,
      apartment_code: item.apartment_code || item.room_number || `PH-${item.id}`,
      title: item.title || item.description || `Căn hộ ${item.room_number || item.id}`,
    }));
  }
  return [];
}

// Lấy 1 căn hộ - GET /apartments/:id
export async function getApartmentById(id: number): Promise<ApartmentData> {
  const res = await api.get<any>(`/apartments/${id}`);
  const item = res.data;
  return {
    ...item,
    apartment_code: item.apartment_code || item.room_number || `PH-${item.id}`,
    title: item.title || item.description || `Căn hộ ${item.room_number || item.id}`,
  };
}

// Tạo căn hộ mới - POST /apartments
export async function createApartment(data: {
  apartment_code: string;
  building_id: number;
  title: string;
  description?: string;
  area: number;
  rental_price: number;
  status?: string;
}) {
  const res = await api.post("/apartments", data);
  return res.data;
}

// Cập nhật căn hộ - PUT /apartments/:id
export async function updateApartment(id: number, data: Partial<ApartmentData>) {
  const res = await api.put(`/apartments/${id}`, data);
  return res.data;
}

// Xóa căn hộ - DELETE /apartments/:id
export async function deleteApartment(id: number) {
  const res = await api.delete(`/apartments/${id}`);
  return res.data;
}
