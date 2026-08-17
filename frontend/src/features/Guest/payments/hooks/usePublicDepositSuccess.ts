import { useSearchParams } from "react-router-dom";

const DEFAULT_DEPOSIT_AMOUNT = 5_000_000;
const DEFAULT_HOLD_DAYS = 3;

export function usePublicDepositSuccess() {
  const [searchParams] = useSearchParams();
  const rawAmount = searchParams.get("amount");
  const parsedAmount = rawAmount ? Number(rawAmount) : DEFAULT_DEPOSIT_AMOUNT;

  return {
    invoiceCode: searchParams.get("invoice_code") || searchParams.get("vnp_TxnRef") || "DEP-SUCCESS",
    amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : DEFAULT_DEPOSIT_AMOUNT,
    roomNumber: searchParams.get("room") || searchParams.get("room_number") || "Chưa cập nhật",
    branchName: searchParams.get("branch") || "Chưa cập nhật",
    customerName: searchParams.get("customer") || "Khách hàng",
    expiresAt:
      searchParams.get("expires_at") ||
      new Date(Date.now() + DEFAULT_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
}
