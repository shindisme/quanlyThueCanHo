import type { PaymentMethod, PaymentStatus } from "../constants/enums";
import type { Invoice } from "./invoice";

export interface Payment {
  id: number;
  invoice_id: number;
  payment_method: PaymentMethod;
  transaction_code: string | null;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  invoice?: Invoice;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
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
  payment_method: PaymentMethod;
  transaction_code?: string;
  amount?: number;
  status?: PaymentStatus;
}

export interface CreateVnpayPaymentPayload {
  invoice_id: number;
  bank_code?: string;
}

export interface CreateVnpayPaymentResult {
  paymentId: number;
  invoiceId: number;
  transactionCode: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentUrl: string;
  qrCodeDataUrl?: string;
  qrCodeSvg?: string;
}

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}
