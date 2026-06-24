import api from "../lib/api";
import type { RentalContract } from "../types";

function mapBackendToFrontend(c: any): RentalContract {
  return {
    ...c,
    contractFile: c.contract_file || null,
    signedAt: c.signed_at ? c.signed_at.split("T")[0] : null,
    createdBy: c.created_by || 1,
    start_date: c.start_date ? c.start_date.split("T")[0] : "",
    end_date: c.end_date ? c.end_date.split("T")[0] : "",
  };
}

export async function getAllContracts(params?: {
  buildingId?: number;
  status?: string;
  search?: string;
  tenantId?: number;
}): Promise<RentalContract[]> {
  const res = await api.get<{ success: boolean; data: any[] }>("/contracts", {
    params: {
      buildingId: params?.buildingId,
      status: params?.status,
      search: params?.search,
      tenantId: params?.tenantId,
    },
  });

  const rawContracts = res.data.data || [];
  return rawContracts.map(mapBackendToFrontend);
}

export async function getContractById(id: number): Promise<RentalContract | null> {
  try {
    const res = await api.get<{ success: boolean; data: any }>(`/contracts/${id}`);
    const data = res.data.data;
    return data ? mapBackendToFrontend(data) : null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết hợp đồng:", error);
    return null;
  }
}

export async function createContract(data: Partial<RentalContract>): Promise<RentalContract> {
  const res = await api.post<{ success: boolean; data: any }>("/contracts", {
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
  const res = await api.patch<{ success: boolean; data: any }>(`/contracts/${id}/extend`, {
    new_end_date: newEndDate,
  });

  const updatedContract = res.data.data;
  return mapBackendToFrontend(updatedContract);
}
