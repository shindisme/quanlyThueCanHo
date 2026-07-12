import api from "../lib/api";

export interface UtilityReadingData {
  id: number;
  apartment_id: number;
  month: number;
  year: number;
  electric_old: number;
  electric_new: number;
  electric_consumption?: number;
  water_old: number;
  water_new: number;
  water_consumption?: number;
  created_at: string;
  recorded_by: number;
  apartment?: {
    id: number;
    building_id: number;
    floor: number;
    room_number: string;
    status?: string;
    building?: {
      id: number;
      branch_name: string;
      address_new?: string;
    };
  };
  staff?: {
    id: number;
    full_name: string;
    phone: string;
    position: string;
    building_id?: number;
  };
}

export interface UtilityPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type UtilityReadingQuery = {
  apartment_id?: number;
  building_id?: number;
  month?: number;
  year?: number;
  recorded_by?: number;
  search?: string;
  page?: number;
  limit?: number;
};

export async function getAllUtilityReadings(params?: UtilityReadingQuery): Promise<{ data: UtilityReadingData[]; pagination: UtilityPagination }> {
  interface UtilityReadingsResponse {
    data: UtilityReadingData[];
    meta?: {
      pagination?: UtilityPagination;
    };
    pagination?: UtilityPagination;
  }
  const res = await api.get<UtilityReadingsResponse>("/utility-readings", { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };
  return { data: rawData, pagination };
}

export async function getAllUtilityReadingPages(params?: Omit<UtilityReadingQuery, "page" | "limit">): Promise<UtilityReadingData[]> {
  const first = await getAllUtilityReadings({ ...params, page: 1, limit: 100 });
  const totalPages = first.pagination?.totalPages ?? 1;
  if (totalPages <= 1) return first.data;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getAllUtilityReadings({ ...params, page: index + 2, limit: 100 })
    )
  );

  return [first, ...rest].flatMap((page) => page.data);
}
export async function getUtilityReadingById(id: number): Promise<UtilityReadingData> {
  const res = await api.get<{ data: UtilityReadingData }>(`/utility-readings/${id}`);
  return res.data.data;
}

export async function createUtilityReading(data: {
  apartment_id: number;
  month: number;
  year: number;
  electric_old?: number;
  electric_new: number;
  water_old?: number;
  water_new: number;
  recorded_by?: number;
}) {
  const res = await api.post("/utility-readings", data);
  return res.data;
}

export async function updateUtilityReading(id: number, data: Partial<UtilityReadingData>) {
  const res = await api.put(`/utility-readings/${id}`, data);
  return res.data;
}

export async function deleteUtilityReading(id: number) {
  const res = await api.delete(`/utility-readings/${id}`);
  return res.data;
}
