import api from "../lib/api";
import type { UtilityReadingData, UtilityReadingQuery, CreateUtilityReadingPayload, ApiPagination } from "../types";
export type { UtilityReadingData, UtilityReadingQuery, CreateUtilityReadingPayload };
import { fetchAllPages } from "./apiHelper";

const UTILITY_API = "/utility-readings";

const meter = (value: number) => Math.round(Number(value) || 0);

const normalizeUtilityReading = (reading: UtilityReadingData): UtilityReadingData => {
  const electricOld = meter(reading.electric_old);
  const electricNew = meter(reading.electric_new);
  const waterOld = meter(reading.water_old);
  const waterNew = meter(reading.water_new);

  return {
    ...reading,
    electric_old: electricOld,
    electric_new: electricNew,
    electric_consumption: Math.max(0, electricNew - electricOld),
    water_old: waterOld,
    water_new: waterNew,
    water_consumption: Math.max(0, waterNew - waterOld),
  };
};

export async function getAll(params?: UtilityReadingQuery): Promise<{ data: UtilityReadingData[]; pagination: ApiPagination }> {
  const res = await api.get<{ data: UtilityReadingData[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(UTILITY_API, { params });
  const rawData = (res.data.data || []).map(normalizeUtilityReading);
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };
  return { data: rawData, pagination };
}

export async function getAllPage(params?: Omit<UtilityReadingQuery, "page" | "limit">): Promise<{ data: UtilityReadingData[] }> {
  return fetchAllPages<UtilityReadingData, UtilityReadingQuery>(getAll, params);
}

export async function getMyUtilityReadings(params?: Omit<UtilityReadingQuery, "apartment_id" | "building_id" | "recorded_by">): Promise<{ data: UtilityReadingData[]; pagination: ApiPagination }> {
  const res = await api.get<{ data: UtilityReadingData[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(`${UTILITY_API}/my`, { params });
  const rawData = (res.data.data || []).map(normalizeUtilityReading);
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };
  return { data: rawData, pagination };
}

export async function getMyUtilityReadingsPage(params?: Omit<UtilityReadingQuery, "apartment_id" | "building_id" | "recorded_by" | "page" | "limit">): Promise<UtilityReadingData[]> {
  const first = await getMyUtilityReadings({ ...params, page: 1, limit: 100 });
  const totalPages = first.pagination?.totalPages ?? 1;
  if (totalPages <= 1) return first.data;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getMyUtilityReadings({ ...params, page: index + 2, limit: 100 })
    )
  );

  return [first, ...rest].flatMap((page) => page.data);
}

export async function getById(id: number): Promise<UtilityReadingData> {
  const res = await api.get<{ data: UtilityReadingData }>(`${UTILITY_API}/${id}`);
  return normalizeUtilityReading(res.data.data);
}

export async function create(data: CreateUtilityReadingPayload): Promise<any> {
  const res = await api.post(UTILITY_API, data);
  return res.data;
}

export async function update(id: number, data: Partial<UtilityReadingData>): Promise<any> {
  const res = await api.put(`${UTILITY_API}/${id}`, data);
  return res.data;
}

export async function deleteUtilityReading(id: number): Promise<any> {
  const res = await api.delete(`${UTILITY_API}/${id}`);
  return res.data;
}

export const getAllUtilityReadings = getAll;
export const getAllUtilityReadingsPage = getAllPage;
export const getUtilityReadingById = getById;
export const createUtilityReading = create;
export const updateUtilityReading = update;

export const utilityService = {
  getAll,
  getAllPage,
  getMyUtilityReadings,
  getMyUtilityReadingsPage,
  getById,
  create,
  update,
  delete: deleteUtilityReading,
};
