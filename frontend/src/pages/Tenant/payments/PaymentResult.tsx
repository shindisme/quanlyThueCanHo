import { AlertTriangle, CheckCircle2, CreditCard, Receipt, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import Badge, { type BadgeVariant } from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

type ResultView = {
  title: string;
  description: string;
  variant: BadgeVariant;
  icon: typeof CheckCircle2;
};

const resultViews: Record<string, ResultView> = {
  SUCCESS: {
    title: "Thanh toán thành công",
    description: "Giao dịch đã được ghi nhận. Hóa đơn sẽ được cập nhật trong danh sách thanh toán.",
    variant: "success",
    icon: CheckCircle2,
  },
  FAILED: {
    title: "Thanh toán thất bại",
    description: "Giao dịch chưa hoàn tất. Vui lòng thử lại hoặc chọn chuyển khoản ngân hàng.",
    variant: "danger",
    icon: XCircle,
  },
  INVALID_SIGNATURE: {
    title: "Kết quả không hợp lệ",
    description: "Chữ ký thanh toán không hợp lệ. Vui lòng liên hệ quản lý để kiểm tra giao dịch.",
    variant: "warning",
    icon: AlertTriangle,
  },
  INVALID_AMOUNT: {
    title: "Số tiền không khớp",
    description: "Số tiền VNPAY trả về không khớp với hóa đơn. Vui lòng liên hệ quản lý.",
    variant: "warning",
    icon: AlertTriangle,
  },
};

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = (searchParams.get("status") || "UNKNOWN").toUpperCase();
  const view = resultViews[status] || {
    title: "Đang chờ xác nhận",
    description: "Trạng thái thanh toán chưa rõ. Vui lòng kiểm tra lại danh sách thanh toán.",
    variant: "gray" as BadgeVariant,
    icon: AlertTriangle,
  };
  const Icon = view.icon;
  const invoiceId = searchParams.get("invoice_id");
  const paymentId = searchParams.get("payment_id");

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={CreditCard}
        title={"Kết quả thanh toán"}
        subtitle={"Thông tin giao dịch từ cổng thanh toán VNPAY"}
        iconColor="linear-gradient(135deg, #2563EB, #22C55E)"
      />

      <div className="bg-white border border-gray-200 shadow-md rounded-none p-6 max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-50 text-primary-600 border border-gray-200">
            <Icon size={28} />
          </div>
          <div className="space-y-2">
            <Badge variant={view.variant}>{status}</Badge>
            <h2 className="text-xl font-black text-gray-900">{view.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{view.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-sm">
          <div className="border border-gray-200 p-3">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{"Hóa đơn"}</span>
            <span className="mt-1 font-semibold text-gray-800 flex items-center gap-2">
              <Receipt size={16} /> {invoiceId || "-"}
            </span>
          </div>
          <div className="border border-gray-200 p-3">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{"Giao dịch"}</span>
            <span className="mt-1 font-semibold text-gray-800">{paymentId || "-"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={() => navigate("/tenant/invoices")}>
            {"Xem hóa đơn"}
          </Button>
          <Button type="button" onClick={() => navigate("/tenant/payments")}>
            {"Về trang thanh toán"}
          </Button>
        </div>
      </div>
    </div>
  );
}