import { useMemo } from "react";
import { Check, Eye, X } from "lucide-react";
import {
  PAYMENT_METHOD_CONFIG,
  PAYMENT_STATUS_CONFIG,
  type Role,
} from "../../constants";
import type { SortConfig } from "../../hooks/useSort";
import type { Payment } from "../../types";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import { getInvoiceRoomDisplay, getInvoiceTenant } from "../../utils/invoiceDisplay";
import { getTableRowNumber } from "../../utils/table";
import Badge from "../ui/Badge";
import DataTable, { type Column } from "../ui/DataTable";

interface PaymentListProps {
  payments: Payment[];
  role: Role | null;
  isUpdating?: boolean;
  startIdx?: number;
  totalItems?: number;
  handleApprove?: (id: number) => void;
  handleReject?: (id: number) => void;
  onViewDetail: (payment: Payment) => void;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
}

export default function PaymentList({
  payments,
  role,
  isUpdating = false,
  startIdx = 0,
  totalItems,
  handleApprove,
  handleReject,
  onViewDetail,
  sortConfig,
  onSort,
}: PaymentListProps) {
  const canApprove = role === "ADMIN" || role === "MANAGER";
  const columns = useMemo<Column<Payment>[]>(() => [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      preserveRenderIndex: true,
      render: (_, index) => <span className="font-semibold text-gray-800">{getTableRowNumber(index, startIdx, totalItems ?? payments.length, sortConfig)}</span>,
    },
    {
      key: "transaction_code",
      label: "Mã giao dịch",
      sortable: false,
      sortValue: (payment) => payment.transaction_code || (payment.payment_method === "CASH" ? `CASH-${payment.invoice_id}-${payment.paid_at ? new Date(payment.paid_at).getTime() : payment.id}` : ""),
      isTitle: true,
      render: (payment) => {
        const time = payment.paid_at ? new Date(payment.paid_at).getTime() : payment.id;
        const code = payment.transaction_code || (payment.payment_method === "CASH" ? `CASH-${payment.invoice_id}-${time}` : "-");
        return <span className="font-mono font-semibold text-gray-805">{code}</span>;
      },
    },
    ...(role !== "TENANT" ? [{
      key: "room",
      label: "Căn hộ",
      sortValue: (payment: Payment) => payment.invoice ? getInvoiceRoomDisplay(payment.invoice).room : "",
      render: (payment: Payment) => {
        if (!payment.invoice) return <span className="text-gray-400">-</span>;
        const { room, branch } = getInvoiceRoomDisplay(payment.invoice);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{room}</span>
            {role === "ADMIN" && branch && <span className="text-[10px] font-semibold text-primary-600">{branch}</span>}
          </div>
        );
      },
    }] : []),
    ...(role !== "TENANT" ? [{
      key: "tenant",
      label: "Người nộp",
      sortable: false,
      sortValue: (payment: Payment) => payment.invoice ? getInvoiceTenant(payment.invoice)?.full_name || "" : "",
      render: (payment: Payment) => {
        const tenant = payment.invoice ? getInvoiceTenant(payment.invoice) : null;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">{tenant?.full_name || "Chưa rõ"}</span>
            {tenant?.phone && <span className="text-[10px] text-gray-400">{tenant.phone}</span>}
          </div>
        );
      },
    }] : []),
    {
      key: "payment_method",
      label: "Phương thức",
      sortable: false,
      render: (payment) =>
        PAYMENT_METHOD_CONFIG[payment.payment_method]?.label ??
        (payment.payment_method === "CASH" ? "Tiền mặt" : "VNPay"),
    },
    {
      key: "amount",
      label: "Tổng tiền",
      sortable: false,
      sortValue: (payment) => Number(payment.amount),
      render: (payment) => <span className="font-bold text-gray-900">{formatCurrency(Number(payment.amount))}</span>,
    },
    {
      key: "paid_at",
      label: "Thời gian",
      sortValue: (payment) => payment.paid_at ? new Date(payment.paid_at).getTime() : 0,
      render: (payment) => <span className="text-gray-500">{formatDate(payment.paid_at)}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: false,
      render: (payment) => {
        const config = PAYMENT_STATUS_CONFIG[payment.status];
        return <Badge style={{ fontSize: '11px' }} variant={config.badge}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      isAction: true,
      render: (payment) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => onViewDetail(payment)} className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600" title="Xem chi tiết">
            <Eye size={16} />
          </button>
          {payment.status === "PENDING" && canApprove && (
            <>
              <button type="button" onClick={() => handleApprove?.(payment.id)} disabled={isUpdating} className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-50" title="Duyệt giao dịch"><Check size={16} /></button>
              <button type="button" onClick={() => handleReject?.(payment.id)} disabled={isUpdating} className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-650 disabled:opacity-50" title="Từ chối giao dịch"><X size={16} /></button>
            </>
          )}
        </div>
      ),
    },
  ], [canApprove, handleApprove, handleReject, isUpdating, onViewDetail, payments.length, role, sortConfig, startIdx, totalItems]);

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={payments} emptyMessage="Không tìm thấy giao dịch nào." sortConfig={sortConfig} onSort={onSort} />
    </div>
  );
}
