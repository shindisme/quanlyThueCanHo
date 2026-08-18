import { useMemo } from "react";
import { Eye, Printer, CheckCircle, QrCode } from "lucide-react";
import Badge from "../ui/Badge";
import DataTable, { type Column } from "../ui/DataTable";
import {
  INVOICE_STATUS_CONFIG,
  INVOICE_TYPE_CONFIG,
} from "../../constants";
import { getInvoicePeriod, getInvoicePeriodSortValue } from "../../utils/invoicePeriod";
import { getInvoiceRoomDisplay, getInvoiceStatus, getInvoiceTenant, getInvoiceType, isRefundInvoice } from "../../utils/invoiceDisplay";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import { getTableRowNumber } from "../../utils/table";
import type { Invoice } from "../../types";
import type { SortConfig } from "../../hooks/useSort";

interface InvoiceListProps {
  invoices: Invoice[];
  role: string | null;
  onOpenDetails: (invoice: Invoice) => void;
  onConfirmCashPayment?: (invoice: Invoice) => void;
  onCreateVnpayQr?: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  startIdx?: number;
  totalItems?: number;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
}

function getStatusBadge(inv: Invoice) {
  const status = getInvoiceStatus(inv);
  const config = INVOICE_STATUS_CONFIG[status];
  const label = isRefundInvoice(inv)
    ? status === "PAID" ? "Đã hoàn" : "Chưa hoàn"
    : config.label;
  return <Badge variant={config.badge}>{label}</Badge>;
}

function getTypeBadge(inv: Invoice) {
  const resolvedType = getInvoiceType(inv);
  const config = INVOICE_TYPE_CONFIG[resolvedType];
  if (!config) return null;
  return <Badge variant={config.badge}>{config.label}</Badge>;
}

export default function InvoiceList({
  invoices,
  role,
  onOpenDetails,
  onConfirmCashPayment,
  onCreateVnpayQr,
  onPrint,
  startIdx = 0,
  totalItems,
  sortConfig,
  onSort,
}: InvoiceListProps) {
  const canManage = role === "ADMIN" || role === "MANAGER";

  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        key: "index",
        label: "STT",
        className: "w-4",
        preserveRenderIndex: true,
        sortValue: (invoice) => invoice.created_at ? new Date(invoice.created_at).getTime() : invoice.id,
        render: (_, index: number) => <span className="font-semibold text-gray-800">{getTableRowNumber(index, startIdx, totalItems ?? invoices.length, sortConfig)}</span>,
      },
      {
        key: "invoice_code",
        label: "Mã hóa đơn",
        sortable: false,
        sortValue: (inv) => inv.invoice_code,
        render: (inv) => {
          const lateDays = getInvoiceLateDays(inv);
          const isOverdue = getInvoiceStatus(inv) === "OVERDUE";

          if (lateDays > 0) {
            return (
              <span
                className="font-semibold text-amber-600"
                title={`Đã thanh toán trễ ${lateDays} ngày so với hạn`}
              >
                {inv.invoice_code}
              </span>
            );
          }
          if (isOverdue) {
            return (
              <span
                className="font-semibold text-red-700"
                title="Hóa đơn chưa thanh toán và đã quá hạn"
              >
                {inv.invoice_code}
              </span>
            );
          }
          return <span className="font-semibold text-gray-800">{inv.invoice_code}</span>;
        },
      },
      {
        key: "room",
        label: "Căn hộ",
        sortValue: (inv) => getInvoiceRoomDisplay(inv).room,
        render: (inv) => {
          const { room, branch } = getInvoiceRoomDisplay(inv);
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800">{room}</span>
              {role === "ADMIN" && branch && (
                <span className="text-[10px] font-semibold text-primary-600">{branch}</span>
              )}
            </div>
          );
        },
      },
      ...(role !== "TENANT"
        ? [
          {
            key: "tenant",
            label: "Người thuê",
            sortable: false,
            sortValue: (inv: Invoice) => getInvoiceTenant(inv)?.full_name || "",
            render: (inv: Invoice) => {
              const tenant = getInvoiceTenant(inv);
              return (
                <div className="flex flex-col">
                  <span className="font-medium text-gray-700">{tenant?.full_name || "-"}</span>
                  {tenant?.phone && <span className="text-[10px] text-gray-400">{tenant.phone}</span>}
                </div>
              );
            },
          },
        ]
        : []),
      {
        key: "period",
        label: "Kỳ thanh toán",
        sortValue: (inv) => getInvoicePeriodSortValue(inv),
        render: (inv) => (
          <div className="flex flex-col">
            <span className="text-gray-600">{getInvoicePeriod(inv).label}</span>
            {role === "TENANT" && (
              <span className="text-xs font-medium text-red-600">Hạn: {formatDate(inv.due_date)}</span>
            )}
          </div>
        ),
      },
      {
        key: "total_amount",
        label: "Tổng tiền",
        sortable: false,
        sortValue: (inv) => Number(inv.total_amount),
        render: (inv) => <span className="font-bold text-gray-900">{formatCurrency(inv.total_amount)}</span>,
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: false,
        sortValue: getInvoiceStatus,
        render: (inv) => (
          <div className="flex flex-col items-start gap-1">
            {getStatusBadge(inv)}
            {getTypeBadge(inv)}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Chức năng",
        className: "text-right",
        render: (inv) => {
          const isRefund = isRefundInvoice(inv);
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onOpenDetails(inv)}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                title="Xem chi tiết"
              >
                <Eye size={16} />
              </button>
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => onPrint(inv)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
                    title={isRefund ? "In phiếu hoàn cọc" : "In hóa đơn"}
                  >
                    <Printer size={16} />
                  </button>
                  {inv.status !== "PAID" && (
                    <>
                      {!isRefund && (
                        <button
                          type="button"
                          onClick={() => onCreateVnpayQr?.(inv)}
                          className="p-2 rounded-lg cursor-pointer text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          title="Tạo QR thanh toán VNPay"
                        >
                          <QrCode size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onConfirmCashPayment?.(inv)}
                        className="p-2 rounded-lg cursor-pointer text-green-500 hover:text-green-700 hover:bg-green-50"
                        title={isRefund ? "Xác nhận đã hoàn cọc" : "Xác nhận thanh toán tiền mặt"}
                      >
                        <CheckCircle size={16} />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          );
        },
      },
    ],
    [role, canManage, invoices.length, startIdx, totalItems, sortConfig, onOpenDetails, onPrint, onConfirmCashPayment, onCreateVnpayQr]
  );

  return (
    <div className="mt-6">
      <DataTable
        columns={columns}
        data={invoices}
        emptyMessage="Không tìm thấy hóa đơn nào."
        sortConfig={sortConfig}
        onSort={onSort}
      />
    </div>
  );
}