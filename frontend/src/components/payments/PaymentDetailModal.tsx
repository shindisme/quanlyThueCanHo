import {
  INVOICE_STATUS_CONFIG,
  INVOICE_TYPE_CONFIG,
  PAYMENT_METHOD_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "../../constants";
import type { Payment } from "../../types";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import { getInvoiceApartment, getInvoiceRoomDisplay, getInvoiceTenant, getInvoiceType } from "../../utils/invoiceDisplay";
import { getInvoicePeriod } from "../../utils/invoicePeriod";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  showPayer?: boolean;
}

export default function PaymentDetailModal({ isOpen, onClose, payment, showPayer = true }: PaymentDetailModalProps) {
  if (!payment) return null;

  const invoice = payment.invoice;
  const apartment = invoice ? getInvoiceApartment(invoice) : null;
  const tenant = invoice ? getInvoiceTenant(invoice) : null;
  const room = invoice ? getInvoiceRoomDisplay(invoice).room : "Chưa rõ";
  const paymentStatus = PAYMENT_STATUS_CONFIG[payment.status];
  const invoiceType = invoice ? INVOICE_TYPE_CONFIG[getInvoiceType(invoice)] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết giao dịch" size="lg">
      <div className="space-y-6 text-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 md:flex-row">
          <div>
            <h4 className="text-base font-bold text-gray-900">Mã giao dịch: <span className="font-mono text-primary-600">{payment.transaction_code || "-"}</span></h4>
            <p className="mt-1 text-xs text-gray-400">Phương thức: {PAYMENT_METHOD_CONFIG[payment.payment_method]?.label ?? "Phương thức cũ"}</p>
            <p className="text-xs text-gray-400">Thời gian: {formatDate(payment.paid_at)}</p>
          </div>
          <div className="flex flex-col items-start gap-1.5 md:items-end">
            <Badge variant={paymentStatus.badge}>{paymentStatus.label}</Badge>
            <span className="text-base font-bold text-gray-900">Tổng tiền: {formatCurrency(Number(payment.amount))}</span>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-4 ${showPayer ? "md:grid-cols-2" : ""}`}>
          <InfoPanel title="Thông tin căn hộ">
            <p><strong>Căn hộ:</strong> {room}</p>
            <p><strong>Tòa nhà:</strong> <span className="text-primary-700">{apartment?.building?.branch_name || "Chưa rõ"}</span></p>
            {apartment?.building?.address && <p><strong>Địa chỉ:</strong> {apartment.building.address}</p>}
          </InfoPanel>
          {showPayer && (
            <InfoPanel title="Khách hàng nộp">
              <p><strong>Họ và tên:</strong> {tenant?.full_name || "Chưa rõ"}</p>
              <p><strong>Số điện thoại:</strong> {tenant?.phone || "-"}</p>
              <p><strong>Email:</strong> {tenant?.email || "-"}</p>
            </InfoPanel>
          )}
        </div>

        {invoice && (
          <div className="space-y-2 border border-primary-100 bg-primary-50/20 p-4 shadow">
            <h5 className="mb-2 border-b border-primary-100 pb-1 font-bold text-primary-950">Hóa đơn liên kết</h5>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <p><strong>Mã hóa đơn:</strong> {invoice.invoice_code}</p>
              <p><strong>Loại hóa đơn:</strong> {invoiceType?.label || "-"}</p>
              <p><strong>Kỳ hóa đơn:</strong> {getInvoicePeriod(invoice).label}</p>
              <p><strong>Hạn thanh toán:</strong> {formatDate(invoice.due_date)}</p>
              <p><strong>Trạng thái:</strong> <Badge variant={INVOICE_STATUS_CONFIG[invoice.status].badge}>{INVOICE_STATUS_CONFIG[invoice.status].label}</Badge></p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2"><Button variant="outline" onClick={onClose}>Đóng</Button></div>
      </div>
    </Modal>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border border-gray-200 bg-gray-50/50 p-4 shadow">
      <h5 className="mb-2 border-b border-gray-200 pb-1 font-bold text-gray-800">{title}</h5>
      {children}
    </div>
  );
}
