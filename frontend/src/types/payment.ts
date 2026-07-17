import type { PaymentMethod, PaymentStatus } from "../constants/enums";
import type { Invoice } from "./invoice";

export interface Payment {
  id: number;
  invoice_id: number;
  payment_method: PaymentMethod;
  transaction_code: string | null;
  amount: number;
  status: PaymentStatus;
  paid_at: string;
  invoice?: Invoice;
}

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

export interface CreatePaymentPayload {
  invoice_id: number;
  payment_method: string;
  transaction_code?: string;
  amount?: number;
  status?: string;
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

