import { Check, X } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, PAYMENT_METHOD_LABELS, type PaymentStatus, type PaymentMethod } from "../../../../constants/enums";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { Payment } from "../../../../types";

interface PaymentListProps {
  payments: Payment[];
  role: string | null;
  isUpdating: boolean;
  handleApprove: (id: number) => void;
  handleReject: (id: number) => void;
}

export default function PaymentList({
  payments,
  role,
  isUpdating,
  handleApprove,
  handleReject,
}: PaymentListProps) {
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  function getPaymentStatusBadge(status: PaymentStatus) {
    const label = PAYMENT_STATUS_LABELS[status] || status;
    const variant = PAYMENT_STATUS_COLORS[status] || "gray";
    return <Badge variant={variant as any}>{label}</Badge>;
  }

  function getMethodLabel(method: PaymentMethod) {
    return PAYMENT_METHOD_LABELS[method] || method;
  }

  function getRoomDisplay(pmt: Payment) {
    const apt = pmt.invoice?.contract?.apartment;
    if (!apt) return { room: "", branch: "" };
    
    const roomNum = formatApartmentDisplay(apt.room_number, apt.floor);
    const branchName = apt.building?.branch_name || "";
    return { room: roomNum, branch: branchName };
  }

  const columns: Column<Payment>[] = [
    {
      key: "transaction_code",
      label: "Mã giao dịch",
      sortValue: (pmt) => pmt.transaction_code || "",
      render: (pmt) => <span className="font-semibold text-gray-805 font-mono">{pmt.transaction_code || "-"}</span>
    },
    {
      key: "invoice",
      label: "Hóa đơn / Phòng",
      sortValue: (pmt) => pmt.invoice?.invoice_code || "",
      render: (pmt) => {
        const invoiceCode = pmt.invoice?.invoice_code || `HD-${String(pmt.invoice_id).padStart(5, "0")}`;
        const { room, branch } = getRoomDisplay(pmt);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-700">{invoiceCode}</span>
            {room && (
              <span className="text-[11px] font-bold text-gray-900">
                {room} {role === "ADMIN" && branch && <span className="text-xs font-semibold text-purple-600">({branch})</span>}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "tenant",
      label: "Người nộp",
      sortValue: (pmt) => pmt.invoice?.contract?.tenant?.full_name || "",
      render: (pmt) => {
        const tenantName = pmt.invoice?.contract?.tenant?.full_name || "Chưa rõ";
        const tenantPhone = pmt.invoice?.contract?.tenant?.phone || "";
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">{tenantName}</span>
            {tenantPhone && <span className="text-[10px] text-gray-400">{tenantPhone}</span>}
          </div>
        );
      }
    },
    {
      key: "payment_method",
      label: "Phương thức",
      sortValue: (pmt) => pmt.payment_method,
      render: (pmt) => <span className="text-gray-600">{getMethodLabel(pmt.payment_method as PaymentMethod)}</span>
    },
    {
      key: "amount",
      label: "Tổng tiền",
      sortValue: (pmt) => Number(pmt.amount),
      render: (pmt) => <span className="font-bold text-gray-900">{formatCurrency(Number(pmt.amount))}</span>
    },
    {
      key: "paid_at",
      label: "Thời gian",
      sortValue: (pmt) => new Date(pmt.paid_at).getTime(),
      render: (pmt) => <span className="text-gray-500">{formatDate(pmt.paid_at)}</span>
    },
    {
      key: "status",
      label: "Trạng thái",
      sortValue: (pmt) => pmt.status,
      render: (pmt) => getPaymentStatusBadge(pmt.status as PaymentStatus)
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      render: (pmt) => (
        <div className="flex items-center justify-end gap-1">
          {pmt.status === "PENDING" && (role === "ADMIN" || role === "MANAGER") && (
            <>
              <button
                type="button"
                onClick={() => handleApprove(pmt.id)}
                disabled={isUpdating}
                className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer disabled:opacity-50"
                title="Duyệt giao dịch"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleReject(pmt.id)}
                disabled={isUpdating}
                className="p-2 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                title="Từ chối giao dịch"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={payments} emptyMessage="Không tìm thấy giao dịch nào." />
    </div>
  );
}
