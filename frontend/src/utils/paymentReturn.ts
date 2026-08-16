import type { Payment } from "../types";

export type PaymentReturnStatus = "SUCCESS" | "CANCELLED" | "PROCESSING" | "FAILED";

export function resolvePaymentReturnStatus(
  responseStatus: string,
  responseCode?: string | null,
  payment?: Payment | null
): PaymentReturnStatus {
  if (responseCode === "24") return "CANCELLED";
  if (payment?.status === "SUCCESS") return "SUCCESS";
  if (payment?.status === "FAILED") return "FAILED";
  if (payment?.status === "PENDING") return "PROCESSING";

  const normalized = responseStatus.toUpperCase();
  if (normalized === "CANCELLED") return "CANCELLED";
  if (normalized === "FAILED") return "FAILED";
  // Không tin trạng thái SUCCESS trên URL nếu chưa xác minh được giao dịch từ API.
  return "PROCESSING";
}
