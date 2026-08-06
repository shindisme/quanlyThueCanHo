import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import { formatDate } from "../../../../utils/date";
import { formatCurrency } from "../../../../utils/currency";
import { getInvoicePeriod } from "../../../../utils/invoicePeriod";
import { getInvoiceApartment, getInvoiceRoomDisplay, getInvoiceTenant } from "../../../../utils/invoiceDisplay";
import { PAYMENT_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from "../../../../constants/enums";
import type { Payment } from "../../../../types";

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export default function PaymentDetailModal({ isOpen, onClose, payment }: PaymentDetailModalProps) {
  if (!payment) return null;

  const statusConfig = PAYMENT_STATUS_CONFIG[payment.status] || {
    label: payment.status,
    badge: "gray",
  };

  const methodLabel = PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method;

  const invoice = payment.invoice;
  const tenant = invoice ? getInvoiceTenant(invoice) : null;
  const apartment = invoice ? getInvoiceApartment(invoice) : null;
  const building = apartment?.building;

  const roomNum = invoice ? getInvoiceRoomDisplay(invoice).room : "Chưa rõ";
  const branchName = building?.branch_name || "Chưa rõ";
  const address = building?.address || "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Giao Dịch" size="lg">
      <div className="space-y-6 text-sm font-sans">
        {/* Upper Info */}
        <div className="flex flex-col md:flex-row justify-between gap-4 pb-4">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              Mã giao dịch: <span className="font-mono text-primary-600">{payment.transaction_code || "-"}</span>
            </h4>
            <p className="text-xs text-gray-400 mt-1">Phương thức: {methodLabel}</p>
            <p className="text-xs text-gray-400">Thời gian nộp: {formatDate(payment.paid_at)}</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1.5">
            <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
            <span className="text-base font-bold text-gray-900">
              Tổng tiền: {formatCurrency(Number(payment.amount))}
            </span>
          </div>
        </div>

        {/* Apartment / Tenant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-2">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Thông tin căn hộ</h5>
            <p>
              <span className="font-semibold text-gray-600">Căn hộ:</span> {roomNum}
            </p>
            <p>
              <span className="font-semibold text-gray-600">Tòa nhà:</span> <span className="text-primary-700">{branchName}</span>
            </p>

            {address && (
              <p>
                <span className="font-semibold text-gray-600">Địa chỉ:</span> {address}
              </p>
            )}
          </div>
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-2">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Khách hàng nộp</h5>
            <p>
              <span className="font-semibold text-gray-600">Họ và tên:</span> {tenant?.full_name || "Chưa rõ"}
            </p>
            <p>
              <span className="font-semibold text-gray-600">Số điện thoại:</span> {tenant?.phone || "-"}
            </p>
            <p>
              <span className="font-semibold text-gray-600">Email:</span> {tenant?.email || "-"}
            </p>
          </div>
        </div>

        {/* Invoice Info */}
        {invoice && (
          <div className="bg-primary-50/20 p-4 rounded-xl border border-primary-100 space-y-2">
            <h5 className="font-bold text-primary-950 border-b border-primary-100 pb-1 mb-2">Thông tin hóa đơn liên kết</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <p>
                <span className="font-semibold text-gray-600">Mã hóa đơn:</span> {invoice.invoice_code}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Kỳ hóa đơn:</span> {getInvoicePeriod(invoice).label}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Hạn thanh toán:</span> {formatDate(invoice.due_date)}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Trạng thái HĐ:</span>{" "}
                <span className={`font-bold ${invoice.status === "PAID" ? "text-green-600" : "text-amber-600"}`}>
                  {invoice.status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
