import api from "../lib/api";
import type { RentalContract, RawContract, ContractQuery, CreateContractRequest, ApiPagination } from "../types";
export type { RawContract, ContractQuery, CreateContractRequest };
import type { ContractStatus } from "../constants/enums";
import { fetchAllPages } from "./apiHelper";

const CONTRACT_API = "/contracts";

function mapBackendToFrontend(c: RawContract): RentalContract {
  return {
    id: c.id,
    apartment_id: c.apartment_id,
    tenant_id: c.tenant_id,
    status: c.status as ContractStatus,
    monthly_rent: c.monthly_rent,
    deposit_amount: c.deposit_amount,
    contractFile: c.contract_file || null,
    signedAt: c.signed_at ? c.signed_at.split("T")[0] : "",
    createdBy: c.created_by || 1,
    start_date: c.start_date ? c.start_date.split("T")[0] : "",
    end_date: c.end_date ? c.end_date.split("T")[0] : "",
    created_at: c.created_at,
    extended_at: c.extended_at,
    max_occupants: c.max_occupants,
    tenant: c.tenant,
    apartment: c.apartment,
  };
}

export async function getAll(params?: ContractQuery): Promise<{ data: RentalContract[]; pagination?: ApiPagination }> {
  const res = await api.get<{
    success: boolean;
    data: RawContract[];
    meta?: { pagination?: ApiPagination };
    pagination?: ApiPagination;
  }>(CONTRACT_API, {
    params: {
      building_id: params?.buildingId ?? params?.building_id,
      status: params?.status,
      search: params?.search,
      tenant_id: params?.tenantId ?? params?.tenant_id,
      apartment_id: params?.apartmentId ?? params?.apartment_id,
      page: params?.page,
      limit: params?.limit,
    },
  });

  const rawContracts = res.data.data || [];
  const pagination = res.data.meta?.pagination || res.data.pagination;
  return {
    data: rawContracts.map(mapBackendToFrontend),
    pagination,
  };
}

export async function getAllPage(params?: Omit<ContractQuery, "page" | "limit">): Promise<{ data: RentalContract[] }> {
  return fetchAllPages<RentalContract, ContractQuery>(getAll, params);
}

export async function getById(id: number): Promise<RentalContract | null> {
  try {
    const res = await api.get<{ success: boolean; data: RawContract }>(`${CONTRACT_API}/${id}`);
    const data = res.data.data;
    return data ? mapBackendToFrontend(data) : null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết hợp đồng:", error);
    return null;
  }
}

export async function create(data: CreateContractRequest | Partial<RentalContract>): Promise<RentalContract> {
  const res = await api.post<{ success: boolean; data: RawContract }>(CONTRACT_API, {
    apartment_id: Number(data.apartment_id),
    tenant_id: Number(data.tenant_id),
    start_date: data.start_date,
    end_date: data.end_date,
    monthly_rent: Number(data.monthly_rent),
    signed_at: ('signedAt' in data ? data.signedAt : undefined) || data.start_date || new Date().toISOString().split("T")[0],
  });

  const newContract = res.data.data;
  return mapBackendToFrontend(newContract);
}

export async function extend(id: number, newEndDate: string): Promise<RentalContract> {
  const res = await api.patch<{ success: boolean; data: RawContract }>(`${CONTRACT_API}/${id}/extend`, {
    new_end_date: newEndDate,
  });

  const updatedContract = res.data.data;
  return mapBackendToFrontend(updatedContract);
}

export async function cancelBeforeStart(id: number) {
  const res = await api.patch<{
    success: boolean;
    data: {
      contract: RawContract;
      old_status: ContractStatus;
      new_status: ContractStatus;
      cancelled_at: string;
      apartment_status: string;
    };
  }>(`${CONTRACT_API}/${id}/end`, {});

  return res.data.data;
}

export const contractService = {
  getAll,
  getAllPage,
  getById,
  create,
  extend,
  cancelBeforeStart,
};