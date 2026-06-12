import type { Payment } from "../types";

// Du lieu gia thanh toan
export const mockPayments: Payment[] = [
  { id: 1, invoice_id: 2, payment_method: "BANK_TRANSFER", transaction_code: "TXN-20260610-001", amount: 13800000, status: "SUCCESS", paid_at: "2026-06-10T08:30:00Z" },
  { id: 2, invoice_id: 4, payment_method: "MOMO", transaction_code: "TXN-20260512-001", amount: 9000000, status: "SUCCESS", paid_at: "2026-05-12T14:15:00Z" },
  { id: 3, invoice_id: 5, payment_method: "VNPAY", transaction_code: "TXN-20260514-001", amount: 14500000, status: "SUCCESS", paid_at: "2026-05-14T10:00:00Z" },
  { id: 4, invoice_id: 8, payment_method: "BANK_TRANSFER", transaction_code: "TXN-20260608-001", amount: 15600000, status: "SUCCESS", paid_at: "2026-06-08T09:45:00Z" },
  { id: 5, invoice_id: 10, payment_method: "CASH", transaction_code: null, amount: 17500000, status: "SUCCESS", paid_at: "2026-04-13T16:00:00Z" },
  { id: 6, invoice_id: 1, payment_method: "MOMO", transaction_code: "TXN-20260609-001", amount: 9200000, status: "PENDING", paid_at: "2026-06-09T11:20:00Z" },
  { id: 7, invoice_id: 9, payment_method: "VNPAY", transaction_code: "TXN-20260609-002", amount: 19800000, status: "FAILED", paid_at: "2026-06-09T12:00:00Z" },
];
