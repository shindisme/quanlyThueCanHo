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
