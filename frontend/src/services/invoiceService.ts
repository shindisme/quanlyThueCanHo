import api from "../lib/api";
import type { Invoice, InvoiceFilters, GenerateMonthlyInvoicesPayload, ApiPagination } from "../types";
export type { InvoiceFilters, GenerateMonthlyInvoicesPayload };
import { fetchAllPages } from "./apiHelper";

const INVOICE_API = "/invoices";

export async function getAll(params?: InvoiceFilters): Promise<{ data: Invoice[]; pagination?: ApiPagination }> {
  const res = await api.get<{ data: Invoice[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(INVOICE_API, { params });
  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination
  };
}

export async function getAllPage(params?: Omit<InvoiceFilters, "page" | "limit">): Promise<{ data: Invoice[] }> {
  return fetchAllPages<Invoice, InvoiceFilters>(getAll, params);
}

export async function getById(id: number): Promise<Invoice> {
  const res = await api.get<{ data: Invoice }>(`${INVOICE_API}/${id}`);
  return res.data.data;
}

export async function generateMonthlyInvoices(payload: GenerateMonthlyInvoicesPayload): Promise<{ success: boolean; message: string; count?: number }> {
  const res = await api.post<{ success: boolean; message: string; count?: number }>(`${INVOICE_API}/generate-monthly`, payload);
  return res.data;
}

export async function updateStatus(id: number, status: string): Promise<Invoice> {
  const res = await api.patch<{ data: Invoice }>(`${INVOICE_API}/${id}/status`, { status });
  return res.data.data;
}

export const getAllInvoices = getAll;
export const getAllInvoicesPage = getAllPage;
export const getInvoiceById = getById;
export const updateInvoiceStatus = updateStatus;

export const invoiceService = {
  getAll,
  getAllPage,
  getById,
  generateMonthlyInvoices,
  updateStatus,
};
