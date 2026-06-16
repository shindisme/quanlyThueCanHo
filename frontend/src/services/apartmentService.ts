import api from "../lib/api";

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
  status: string;
  building?: {
    id: number;
    name: string;
    address_new?: string;
    branch_name?: string;
  };
  images?: {
    id: number;
    apartment_id: number;
    image_url: string;
    is_thumbnail: boolean;
    created_at?: string;
  }[];
}

export interface ApartmentPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllApartments(params?: {
  building_id?: number;
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ data: ApartmentData[]; pagination: ApartmentPagination }> {
  const res = await api.get<any>("/apartments", { params });
  if (res.data.data && res.data.pagination) {
    return res.data;
  }
  const rawData = Array.isArray(res.data) ? res.data : [];
  return { data: rawData, pagination: { total: rawData.length, page: 1, limit: 10, totalPages: 1 } };
}

export async function getApartmentById(id: number): Promise<ApartmentData> {
  const res = await api.get<ApartmentData>(`/apartments/${id}`);
  return res.data;
}

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

export async function updateApartment(id: number, data: Partial<ApartmentData>) {
  const res = await api.put(`/apartments/${id}`, data);
  return res.data;
}

export async function deleteApartment(id: number) {
  const res = await api.delete(`/apartments/${id}`);
  return res.data;
}

