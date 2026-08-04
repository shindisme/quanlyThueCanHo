import api from "../lib/api";
import { getAllStaffs } from "./staffService";
import type { BuildingData, RawBuildingData, BuildingQuery, CreateBuildingRequest, UpdateBuildingRequest, ApiPagination, Staff } from "../types";
export type { BuildingData, RawBuildingData, BuildingQuery, CreateBuildingRequest, UpdateBuildingRequest };
import { fetchAllPages } from "./apiHelper";

const BUILDING_API = "/buildings";

function mapBuildingWithManager(building: RawBuildingData, staff: Staff | undefined): BuildingData {
  return {
    ...building,
    manager_id: staff ? staff.id : null,
    manager: staff ? {
      id: staff.id,
      username: staff.user?.username || staff.full_name,
      fullName: staff.full_name,
      role: staff.user?.role || "MANAGER",
    } : null,
  };
}

const getRole = () => {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.role;
  } catch {
    return null;
  }
};

export async function getAll(params?: BuildingQuery): Promise<{ data: BuildingData[]; pagination: ApiPagination }> {
  const res = await api.get<{ data: RawBuildingData[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(BUILDING_API, { params });
  const rawData = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination || { total: rawData.length, page: 1, limit: 10, totalPages: 1 };

  const role = getRole();
  const staffListRes = (role === "TENANT" || role === "STAFF")
    ? { data: [] }
    : await getAllStaffs().catch(() => ({ data: [] }));
  const staffList = staffListRes.data || [];

  const mappedData = rawData.map((b: RawBuildingData) => {
    const staff = staffList.find(
      (s) => s.building_id === b.id && (s.position === "Quản lý" || s.user?.role === "MANAGER")
    );
    return mapBuildingWithManager(b, staff);
  });

  return { data: mappedData, pagination };
}

export async function getAllPage(params?: Omit<BuildingQuery, "page" | "limit">): Promise<{ data: BuildingData[] }> {
  return fetchAllPages<BuildingData, BuildingQuery>(getAll, params);
}

export async function getById(id: number): Promise<BuildingData> {
  const res = await api.get<{ data: RawBuildingData }>(`${BUILDING_API}/${id}`);
  const b = res.data.data;

  const role = getRole();
  const staffListRes = (role === "TENANT" || role === "STAFF")
    ? { data: [] }
    : await getAllStaffs({ building_id: id }).catch(() => ({ data: [] }));
  const staff = staffListRes.data.find(
    (s) => s.position === "Quản lý" || s.user?.role === "MANAGER"
  );

  return mapBuildingWithManager(b, staff);
}

export async function create(data: FormData | CreateBuildingRequest): Promise<BuildingData> {
  const res = await api.post<{ data: RawBuildingData }>(BUILDING_API, data);
  return res.data.data || (res.data as unknown as BuildingData);
}

export async function update(id: number, data: FormData | UpdateBuildingRequest): Promise<BuildingData> {
  const res = await api.put<{ data: RawBuildingData }>(`${BUILDING_API}/${id}`, data);
  return res.data.data || (res.data as unknown as BuildingData);
}

export async function deleteBuilding(id: number): Promise<unknown> {
  const res = await api.delete(`${BUILDING_API}/${id}`);
  return res.data.data || res.data;
}

export const getAllBuildings = getAll;
export const getAllBuildingsPage = getAllPage;
export const getBuildingById = getById;
export const createBuilding = create;
export const updateBuilding = update;

export const buildingService = {
  getAll,
  getAllPage,
  getById,
  create,
  update,
  delete: deleteBuilding,
};
