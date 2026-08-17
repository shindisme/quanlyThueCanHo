import { useSearchParams } from "react-router-dom";
import { useUserRole } from "../../../../hooks/useUserRole";

export type PublicPaymentResultStatus = "success" | "cancelled" | "failed";

const RESULT_CONTENT: Record<PublicPaymentResultStatus, { title: string; description: string }> = {
  success: {
    title: "Thanh toán thành công!",
    description: "Giao dịch thanh toán tiền cọc/hóa đơn đã được ghi nhận. Vui lòng kiểm tra thông tin hoặc email xác nhận.",
  },
  cancelled: {
    title: "Đã hủy giao dịch",
    description: "Bạn đã hủy thao tác thanh toán trên cổng VNPay.",
  },
  failed: {
    title: "Thanh toán thất bại",
    description: "Thanh toán VNPay không thành công. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.",
  },
};

export function usePublicPaymentResult() {
  const [searchParams] = useSearchParams();
  const { role, isTenant } = useUserRole();
  const paymentStatus = searchParams.get("payment_status");
  const responseCode = searchParams.get("response_code") || searchParams.get("vnp_ResponseCode");

  const status: PublicPaymentResultStatus =
    paymentStatus === "SUCCESS" || responseCode === "00"
      ? "success"
      : paymentStatus === "CANCELLED" || responseCode === "24"
        ? "cancelled"
        : "failed";

  return {
    status,
    ...RESULT_CONTENT[status],
    dashboardUrl: role ? (isTenant ? "/tenant/payments" : "/admin/payments") : null,
  };
}
