import api from "../lib/api";
import type { Invoice } from "../types";

export interface InvoiceFilters {
  status?: string;
  tenant_id?: number;
  contract_id?: number;
  apartment_id?: number;
  building_id?: number;
  month?: number;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoicePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllInvoices(params?: InvoiceFilters): Promise<{ data: Invoice[]; pagination?: InvoicePagination }> {
  interface InvoicesResponse {
    data: Invoice[];
    meta?: {
      pagination?: InvoicePagination;
    };
    pagination?: InvoicePagination;
  }
  const res = await api.get<InvoicesResponse>("/invoices", { params });
  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination
  };
}

export async function getInvoiceById(id: number): Promise<Invoice> {
  const res = await api.get<{ data: Invoice }>(`/invoices/${id}`);
  return res.data.data;
}

export interface GenerateMonthlyInvoicesPayload {
  month?: number;
  year?: number;
  building_id?: number;
  due_date?: string;
  management_fee?: number;
  management_fee_per_m2?: number;
  electric_unit_price?: number;
  water_unit_price?: number;
  internet_fee?: number;
  notify?: boolean;
}

export async function generateMonthlyInvoices(payload: GenerateMonthlyInvoicesPayload): Promise<{ success: boolean; message: string; count?: number }> {
  const res = await api.post<{ success: boolean; message: string; count?: number }>("/invoices/generate-monthly", payload);
  return res.data;
}

export async function updateInvoiceStatus(id: number, status: string): Promise<Invoice> {
  const res = await api.patch<{ data: Invoice }>(`/invoices/${id}/status`, { status });
  return res.data.data;
}
