import api from "../lib/api";
import type { RentalContract } from "../types";

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
  contracts?: RentalContract[];
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
  interface ApartmentsResponse {
    data: ApartmentData[];
    meta?: {
      pagination?: ApartmentPagination;
    };
    pagination?: ApartmentPagination;
  }
  const res = await api.get<ApartmentsResponse>("/apartments", { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };
  return { data: rawData, pagination };
}

export async function getApartmentById(id: number): Promise<ApartmentData> {
  const res = await api.get<{ data: ApartmentData }>(`/apartments/${id}`);
  return res.data.data;
}

export async function createApartment(data: FormData | Partial<ApartmentData>) {
  const headers: Record<string, string> = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }
  const res = await api.post("/apartments", data, { headers });
  return res.data;
}

export async function updateApartment(id: number, data: FormData | Partial<ApartmentData>) {
  const headers: Record<string, string> = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }
  const res = await api.put(`/apartments/${id}`, data, { headers });
  return res.data;
}

export async function deleteApartment(id: number) {
  const res = await api.delete(`/apartments/${id}`);
  return res.data;
}

