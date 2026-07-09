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

export interface CreateVnpayPaymentResult {
  paymentId: number;
  invoiceId: number;
  transactionCode: string;
  paymentMethod: string;
  amount: number;
  paymentUrl: string;
  qrCodeDataUrl?: string;
  qrCodeSvg?: string;
}

interface CreateVnpayPaymentResponse {
  data: {
    payment_id: number;
    invoice_id: number;
    transaction_code: string;
    payment_method: string;
    amount: number;
    payment_url: string;
    qr_code_data_url?: string;
    qr_code_svg?: string;
  };
}

export async function createVnpayPayment(payload: CreateVnpayPaymentPayload): Promise<CreateVnpayPaymentResult> {
  const res = await api.post<CreateVnpayPaymentResponse>("/payments/vnpay/create", payload);
  const data = res.data.data;
  return {
    paymentId: data.payment_id,
    invoiceId: data.invoice_id,
    transactionCode: data.transaction_code,
    paymentMethod: data.payment_method,
    amount: data.amount,
    paymentUrl: data.payment_url,
    qrCodeDataUrl: data.qr_code_data_url,
    qrCodeSvg: data.qr_code_svg,
  };
}

export async function updatePaymentStatus(id: number, status: string): Promise<Payment> {
  const res = await api.patch<{ data: Payment }>(`/payments/${id}/status`, { status });
  return res.data.data;
}

export async function getPaymentMethods(): Promise<string[]> {
  const res = await api.get<{ data: string[] }>("/payments/methods");
  return res.data.data || [];
}
