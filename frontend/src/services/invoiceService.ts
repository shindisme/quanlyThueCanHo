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
