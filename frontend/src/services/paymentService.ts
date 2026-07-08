import api from "../lib/api";
import type { Payment } from "../types";

export interface PaymentFilters {
  status?: string;
  payment_method?: string;
  invoice_id?: number;
  tenant_id?: number;
  contract_id?: number;
  building_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaymentPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllPayments(params?: PaymentFilters): Promise<{ data: Payment[]; pagination?: PaymentPagination }> {
  interface PaymentsResponse {
    data: Payment[];
    meta?: {
      pagination?: PaymentPagination;
    };
    pagination?: PaymentPagination;
  }
  const res = await api.get<PaymentsResponse>("/payments", { params });
  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination
  };
}

export async function getPaymentById(id: number): Promise<Payment> {
  const res = await api.get<{ data: Payment }>(`/payments/${id}`);
  return res.data.data;
}

export interface CreatePaymentPayload {
  invoice_id: number;
  payment_method: string;
  transaction_code?: string;
  amount?: number;
  status?: string;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<Payment> {
  const res = await api.post<{ data: Payment }>("/payments", payload);
  return res.data.data;
}

export interface CreateVnpayPaymentPayload {
  invoice_id: number;
  bank_code?: string;
}

export async function createVnpayPayment(payload: CreateVnpayPaymentPayload): Promise<{ paymentUrl: string }> {
  const res = await api.post<{ paymentUrl: string }>("/payments/vnpay/create", payload);
  return res.data;
}

export async function updatePaymentStatus(id: number, status: string): Promise<Payment> {
  const res = await api.patch<{ data: Payment }>(`/payments/${id}/status`, { status });
  return res.data.data;
}

export async function getPaymentMethods(): Promise<string[]> {
  const res = await api.get<{ data: string[] }>("/payments/methods");
  return res.data.data || [];
}
