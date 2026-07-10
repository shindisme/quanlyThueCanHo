import api from "../lib/api";
import type { RentalContract, Tenant, Apartment } from "../types";
import type { ContractStatus } from "../constants/enums";

interface RawContract {
  id: number;
  apartment_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  monthly_rent: number;
  status: string;
  contract_file?: string | null;
  signed_at?: string | null;
  created_by?: number | null;
  created_at: string;
  tenant?: Tenant;
  apartment?: Apartment;
}

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
    tenant: c.tenant,
    apartment: c.apartment,
  };
}

export async function getAllContracts(params?: {
  buildingId?: number;
  status?: string;
  search?: string;
  tenantId?: number;
}): Promise<RentalContract[]> {
  const res = await api.get<{ success: boolean; data: RawContract[] }>("/contracts", {
    params: {
      building_id: params?.buildingId,
      status: params?.status,
      search: params?.search,
      tenant_id: params?.tenantId,
    },
  });

  const rawContracts = res.data.data || [];
  return rawContracts.map(mapBackendToFrontend);
}

export async function getContractById(id: number): Promise<RentalContract | null> {
  try {
    const res = await api.get<{ success: boolean; data: RawContract }>(`/contracts/${id}`);
    const data = res.data.data;
    return data ? mapBackendToFrontend(data) : null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết hợp đồng:", error);
    return null;
  }
}

export async function createContract(data: Partial<RentalContract>): Promise<RentalContract> {
  const res = await api.post<{ success: boolean; data: RawContract }>("/contracts", {
    apartment_id: Number(data.apartment_id),
    tenant_id: Number(data.tenant_id),
    start_date: data.start_date,
    end_date: data.end_date,
    deposit_amount: Number(data.deposit_amount),
    monthly_rent: Number(data.monthly_rent),
    signed_at: data.signedAt || data.start_date || new Date().toISOString().split("T")[0],
  });

  const newContract = res.data.data;
  return mapBackendToFrontend(newContract);
}

export async function extendContract(id: number, newEndDate: string): Promise<RentalContract> {
  const res = await api.patch<{ success: boolean; data: RawContract }>(`/contracts/${id}/extend`, {
    new_end_date: newEndDate,
  });

  const updatedContract = res.data.data;
  return mapBackendToFrontend(updatedContract);
}

export async function terminateContract(id: number, endDate?: string): Promise<RentalContract> {
  const res = await api.patch<{ success: boolean; data: RawContract }>(`/contracts/${id}/end`, {
    end_date: endDate || undefined,
  });

  const updatedContract = res.data.data;
  return mapBackendToFrontend(updatedContract);
}
