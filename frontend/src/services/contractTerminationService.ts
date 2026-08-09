import api from "../lib/api";
import type {
  ApiPagination,
  TerminationSettlementPreview,
  ContractTermination,
  ContractTerminationQuery,
  OverdueTerminationCandidate,
  TerminationInspectionPayload,
} from "../types";
import { fetchAllPages } from "./apiHelper";

const API = "/contract-terminations";

export async function getAll(
  params?: ContractTerminationQuery
): Promise<{ data: ContractTermination[]; pagination?: ApiPagination }> {
  const res = await api.get<{
    data: ContractTermination[];
    meta?: { pagination?: ApiPagination };
    pagination?: ApiPagination;
  }>(API, { params });

  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination,
  };
}

export async function getAllPage(
  params?: Omit<ContractTerminationQuery, "page" | "limit">
): Promise<{ data: ContractTermination[] }> {
  return fetchAllPages<ContractTermination, ContractTerminationQuery>(getAll, params);
}

export async function createTenantRequest(payload: {
  contract_id: number;
  requested_end_date: string;
  reason: string;
}): Promise<ContractTermination> {
  const res = await api.post<{ data: ContractTermination }>(API, payload);
  return res.data.data;
}

export async function approve(id: number, effectiveEndDate?: string): Promise<ContractTermination> {
  const res = await api.patch<{ data: ContractTermination }>(`${API}/${id}/approve`, {
    effective_end_date: effectiveEndDate || undefined,
  });
  return res.data.data;
}

export async function reject(id: number, rejectedReason: string): Promise<ContractTermination> {
  const res = await api.patch<{ data: ContractTermination }>(`${API}/${id}/reject`, {
    rejected_reason: rejectedReason,
  });
  return res.data.data;
}

export async function cancel(id: number): Promise<ContractTermination> {
  const res = await api.patch<{ data: ContractTermination }>(`${API}/${id}/cancel`);
  return res.data.data;
}

export async function getOverdueCandidates(): Promise<OverdueTerminationCandidate[]> {
  const res = await api.get<{ data: OverdueTerminationCandidate[] }>(`${API}/overdue-candidates`);
  return res.data.data || [];
}

export async function createOverdue(payload: {
  contract_id: number;
  reason: string;
}): Promise<ContractTermination> {
  const res = await api.post<{ data: ContractTermination }>(`${API}/overdue`, payload);
  return res.data.data;
}

export async function startInspection(id: number): Promise<ContractTermination> {
  const res = await api.patch<{ data: ContractTermination }>(`${API}/${id}/start-inspection`);
  return res.data.data;
}

export async function updateInspection(
  id: number,
  payload: TerminationInspectionPayload
): Promise<ContractTermination> {
  const res = await api.put<{ data: ContractTermination }>(`${API}/${id}/inspection`, payload);
  return res.data.data;
}

export async function previewSettlement(
  id: number,
  payload: TerminationInspectionPayload
): Promise<TerminationSettlementPreview> {
  const res = await api.post<{ data: TerminationSettlementPreview }>(`${API}/${id}/settlement-preview`, payload);
  return res.data.data;
}

export async function completeHandover(
  id: number,
  payload: TerminationInspectionPayload
): Promise<{ termination: ContractTermination; settlement: TerminationSettlementPreview }> {
  const res = await api.patch<{
    data: { termination: ContractTermination; settlement: TerminationSettlementPreview };
  }>(`${API}/${id}/complete`, payload);
  return res.data.data;
}

export const contractTerminationService = {
  getAll,
  getAllPage,
  createTenantRequest,
  approve,
  reject,
  cancel,
  getOverdueCandidates,
  createOverdue,
  startInspection,
  updateInspection,
  previewSettlement,
  completeHandover,
};



