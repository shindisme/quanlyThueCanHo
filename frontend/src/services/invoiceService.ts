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

export async function getAllInvoices(params?: InvoiceFilters): Promise<{ data: Invoice[]; pagination?: any }> {
  const res = await api.get<any>("/invoices", { params });
  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination
  };
}
