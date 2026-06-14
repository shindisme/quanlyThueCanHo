import api from "../lib/api";

// ============================================================
// APARTMENTS SERVICE - CRUD căn hộ
// Interface khớp DB: apartments table
// DB fields: id, building_id, room_number, floor, area, bedrooms,
//   bathrooms, rental_price, description, status
// ============================================================

export interface ApartmentData {
  id: number;
  building_id: number;
  room_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  rental_price: number;
  description: string | null;
  status: string; // AVAILABLE | RENTED | MAINTENANCE
  building?: {
    id: number;
    name: string;
    address_new?: string;
    branch_name?: string;
  };
}

export interface ApartmentPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Lấy tất cả căn hộ - GET /apartments (hỗ trợ server-side pagination)
export async function getAllApartments(params?: {
  building_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: ApartmentData[]; pagination: ApartmentPagination }> {
  const res = await api.get<any>("/apartments", { params });
  if (res.data.data && res.data.pagination) {
    return res.data;
  }
  // Fallback
  const rawData = Array.isArray(res.data) ? res.data : [];
  return { data: rawData, pagination: { total: rawData.length, page: 1, limit: 10, totalPages: 1 } };
}

// Lấy 1 căn hộ - GET /apartments/:id
export async function getApartmentById(id: number): Promise<ApartmentData> {
  const res = await api.get<ApartmentData>(`/apartments/${id}`);
  return res.data;
}

// Tạo căn hộ mới - POST /apartments
export async function createApartment(data: {
  building_id: number;
  room_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  rental_price: number;
  description?: string;
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

