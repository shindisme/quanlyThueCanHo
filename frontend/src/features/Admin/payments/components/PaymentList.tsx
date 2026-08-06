import { Check, X, Eye } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { PAYMENT_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from "../../../../constants/enums";
import { formatDate } from "../../../../utils/date";
import { formatCurrency } from "../../../../utils/currency";
import { getInvoiceRoomDisplay, getInvoiceTenant } from "../../../../utils/invoiceDisplay";
import type { Payment } from "../../../../types";

interface PaymentListProps {
  payments: Payment[];
  role: string | null;
  isUpdating: boolean;
  startIdx?: number;
  handleApprove: (id: number) => void;
  handleReject: (id: number) => void;
  onViewDetail: (pmt: Payment) => void;
}

export default function PaymentList({
  payments,
  role,
  isUpdating,
  startIdx = 0,
  handleApprove,
  handleReject,
  onViewDetail,
}: PaymentListProps) {
  const canApprove = role === "ADMIN" || role === "MANAGER";

  const columns: Column<Payment>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => (
        <span className="font-semibold text-gray-800 w-2">{startIdx + index + 1}</span>
      ),
    },
    {
      key: "transaction_code",
      label: "Mã giao dịch",
      sortValue: (pmt) => pmt.transaction_code || "",
      render: (pmt) => <span className="font-semibold text-gray-805 font-mono">{pmt.transaction_code || "-"}</span>,
    },
    {
      key: "room",
      label: "Phòng",
      sortValue: (pmt) => (pmt.invoice ? getInvoiceRoomDisplay(pmt.invoice).room : ""),
      render: (pmt) => {
        if (!pmt.invoice) return <span className="text-gray-400">-</span>;
        const { room, branch } = getInvoiceRoomDisplay(pmt.invoice);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{room}</span>
            {role === "ADMIN" && branch && <span className="text-[10px] font-semibold text-primary-600">{branch}</span>}
          </div>
        );
      },
    },
    {
      key: "tenant",
      label: "Người nộp",
      sortValue: (pmt) => (pmt.invoice ? getInvoiceTenant(pmt.invoice)?.full_name || "" : ""),
      render: (pmt) => {
        const tenant = pmt.invoice ? getInvoiceTenant(pmt.invoice) : null;
        const tenantName = tenant?.full_name || "Chưa rõ";
        const tenantPhone = tenant?.phone || "";
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">{tenantName}</span>
            {tenantPhone && <span className="text-[10px] text-gray-400">{tenantPhone}</span>}
          </div>
        );
      },
    },
    {
      key: "payment_method",
      label: "Phương thức",
      sortValue: (pmt) => pmt.payment_method,
      render: (pmt) => (
        <span className="text-gray-600">{PAYMENT_METHOD_LABELS[pmt.payment_method] || pmt.payment_method}</span>
      ),
    },
    {
      key: "amount",
      label: "Tổng tiền",
      sortValue: (pmt) => Number(pmt.amount),
      render: (pmt) => <span className="font-bold text-gray-900">{formatCurrency(Number(pmt.amount))}</span>,
    },
    {
      key: "paid_at",
      label: "Thời gian",
      sortValue: (pmt) => (pmt.paid_at ? new Date(pmt.paid_at).getTime() : 0),
      render: (pmt) => <span className="text-gray-500">{formatDate(pmt.paid_at)}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      sortValue: (pmt) => pmt.status,
      render: (pmt) => {
        const config = PAYMENT_STATUS_CONFIG[pmt.status] || { label: pmt.status, badge: "gray" };
        return <Badge variant={config.badge}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      render: (pmt) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onViewDetail(pmt)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          {pmt.status === "PENDING" && canApprove && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(pmt.id)}
                disabled={isUpdating}
                className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer disabled:opacity-50 transition-colors"
                title="Duyệt giao dịch"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleReject(pmt.id)}
                disabled={isUpdating}
                className="p-2 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 cursor-pointer disabled:opacity-50 transition-colors"
                title="Từ chối giao dịch"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={payments} emptyMessage="Không tìm thấy giao dịch nào." />
    </div>
  );
}
