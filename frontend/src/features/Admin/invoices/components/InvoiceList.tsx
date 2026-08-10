import { useMemo } from "react";
import { Eye, Printer, CheckCircle, XCircle } from "lucide-react";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_CONFIG,
  INVOICE_TYPE_CONFIG,
  type InvoiceType,
} from "../../../../constants/enums";
import { getInvoicePeriod, getInvoicePeriodSortValue } from "../../../../utils/invoicePeriod";
import { getInvoiceRoomDisplay, getInvoiceTenant, getInvoiceType } from "../../../../utils/invoiceDisplay";
import { formatCurrency } from "../../../../utils/currency";
import type { Invoice, InvoiceStatus } from "../../../../types";

interface InvoiceListProps {
  invoices: Invoice[];
  role: string | null;
  onOpenDetails: (invoice: Invoice) => void;
  onToggleStatus: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  startIdx?: number;
}

function getStatusBadge(status: InvoiceStatus) {
  const config = INVOICE_STATUS_CONFIG[status];
  if (config) return <Badge variant={config.badge}>{config.label}</Badge>;
  const label = INVOICE_STATUS_LABELS[status] || status;
  const variant: BadgeVariant = INVOICE_STATUS_COLORS[status] || "gray";
  return <Badge variant={variant}>{label}</Badge>;
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
  onToggleStatus,
  onPrint,
  startIdx = 0,
}: InvoiceListProps) {
  const canManage = role === "ADMIN" || role === "MANAGER";

  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        key: "index",
        label: "STT",
        className: "w-4",
        render: (_, index: number) => (
          <span className="font-semibold text-gray-800">{startIdx + index + 1}</span>
        ),
      },
      {
        key: "invoice_code",
        label: "Mã hóa đơn",
        sortValue: (inv) => inv.invoice_code,
        render: (inv) => <span className="font-semibold text-gray-800">{inv.invoice_code}</span>,
      },
      {
        key: "room",
        label: "Phòng",
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
            sortValue: (inv) => getInvoiceTenant(inv)?.full_name || "",
            render: (inv) => {
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
        render: (inv) => <span className="text-gray-600">{getInvoicePeriod(inv).label}</span>,
      },
      {
        key: "total_amount",
        label: "Tổng tiền",
        sortValue: (inv) => Number(inv.total_amount),
        render: (inv) => <span className="font-bold text-gray-900">{formatCurrency(inv.total_amount)}</span>,
      },
      {
        key: "status",
        label: "Trạng thái",
        sortValue: (inv) => inv.status,
        render: (inv) => (
          <div className="flex flex-col items-start gap-1">
            {getStatusBadge(inv.status as InvoiceStatus)}
            {getTypeBadge(inv)}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Chức năng",
        className: "text-right",
        render: (inv) => (
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
                  title="In hóa đơn"
                >
                  <Printer size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus(inv)}
                  className={`p-2 rounded-lg cursor-pointer ${inv.status === "PAID"
                      ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                      : "text-green-500 hover:text-green-700 hover:bg-green-50"
                    }`}
                  title={inv.status === "PAID" ? "Đánh dấu Chưa thanh toán" : "Đánh dấu Đã thanh toán"}
                >
                  {inv.status === "PAID" ? <XCircle size={16} /> : <CheckCircle size={16} />}
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [role, canManage, startIdx, onOpenDetails, onPrint, onToggleStatus]
  );

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={invoices} emptyMessage="Không tìm thấy hóa đơn nào." />
    </div>
  );
}
