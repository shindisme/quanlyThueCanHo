import api from "../lib/api";
import type { ApartmentData, ApartmentQuery, CreateApartmentRequest, UpdateApartmentRequest, ApiPagination } from "../types";
export type { ApartmentData, ApartmentQuery, CreateApartmentRequest, UpdateApartmentRequest };
import { fetchAllPages } from "./apiHelper";

const APARTMENT_API = "/apartments";

export async function getAll(params?: ApartmentQuery): Promise<{ data: ApartmentData[]; pagination: ApiPagination }> {
  const res = await api.get<{ data: ApartmentData[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(APARTMENT_API, { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };
  return { data: rawData, pagination };
}

export async function getAllPage(params?: Omit<ApartmentQuery, "page" | "limit">): Promise<{ data: ApartmentData[] }> {
  return fetchAllPages<ApartmentData, ApartmentQuery>(getAll, params);
}

export async function getById(id: number): Promise<ApartmentData> {
  const res = await api.get<{ data: ApartmentData }>(`${APARTMENT_API}/${id}`);
  return res.data.data;
}

export async function create(data: FormData | CreateApartmentRequest): Promise<ApartmentData> {
  const headers: Record<string, string> = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }
  const res = await api.post<{ data: ApartmentData }>(APARTMENT_API, data, { headers });
  return res.data.data || (res.data as unknown as ApartmentData);
}

export async function update(id: number, data: FormData | UpdateApartmentRequest): Promise<ApartmentData> {
  const headers: Record<string, string> = {};
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  }
  const res = await api.put<{ data: ApartmentData }>(`${APARTMENT_API}/${id}`, data, { headers });
  return res.data.data || (res.data as unknown as ApartmentData);
}

export async function remove(id: number): Promise<unknown> {
  const res = await api.delete(`${APARTMENT_API}/${id}`);
  return res.data.data || res.data;
}
export const apartmentService = {
  getAll,
  getAllPage,
  getById,
  create,
  update,
  remove,
};
