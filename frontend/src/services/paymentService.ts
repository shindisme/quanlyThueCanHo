import api from "../lib/api";
import type { Payment, PaymentFilters, CreatePaymentPayload, CreateVnpayPaymentPayload, CreateVnpayPaymentResult, ApiPagination } from "../types";
export type { PaymentFilters, CreatePaymentPayload, CreateVnpayPaymentPayload, CreateVnpayPaymentResult };
import { fetchAllPages } from "./apiHelper";

const PAYMENT_API = "/payments";

export async function getAll(params?: PaymentFilters): Promise<{ data: Payment[]; pagination?: ApiPagination }> {
  const res = await api.get<{ data: Payment[]; meta?: { pagination?: ApiPagination }; pagination?: ApiPagination }>(PAYMENT_API, { params });
  return {
    data: res.data.data || [],
    pagination: res.data.meta?.pagination || res.data.pagination
  };
}

export async function getAllPage(params?: Omit<PaymentFilters, "page" | "limit">): Promise<{ data: Payment[] }> {
  return fetchAllPages<Payment, PaymentFilters>(getAll, params);
}

export async function getById(id: number): Promise<Payment> {
  const res = await api.get<{ data: Payment }>(`${PAYMENT_API}/${id}`);
  return res.data.data;
}

export async function create(payload: CreatePaymentPayload): Promise<Payment> {
  const res = await api.post<{ data: Payment }>(PAYMENT_API, payload);
  return res.data.data;
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
  const res = await api.post<CreateVnpayPaymentResponse>(`${PAYMENT_API}/vnpay/create`, payload);
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

export async function updateStatus(id: number, status: string): Promise<Payment> {
  const res = await api.patch<{ data: Payment }>(`${PAYMENT_API}/${id}/status`, { status });
  return res.data.data;
}

export async function getPaymentMethods(): Promise<string[]> {
  const res = await api.get<{ data: string[] }>(`${PAYMENT_API}/methods`);
  return res.data.data || [];
}

export const getAllPayments = getAll;
export const getAllPaymentsPage = getAllPage;
export const getPaymentById = getById;
export const createPayment = create;
export const updatePaymentStatus = updateStatus;

export const paymentService = {
  getAll,
  getAllPage,
  getById,
  create,
  createVnpayPayment,
  updateStatus,
  getPaymentMethods,
};
