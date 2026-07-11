import { Eye, Printer, CheckCircle, XCircle } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, type InvoiceStatus } from "../../../../constants/enums";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { Invoice } from "../../../../types";

interface InvoiceListProps {
  invoices: Invoice[];
  role: string | null;
  onOpenDetails: (invoice: Invoice) => void;
  onToggleStatus: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
}

export default function InvoiceList({
  invoices,
  role,
  onOpenDetails,
  onToggleStatus,
  onPrint,
}: InvoiceListProps) {
  function getStatusBadge(status: InvoiceStatus) {
    const label = INVOICE_STATUS_LABELS[status] || status;
    const variant = INVOICE_STATUS_COLORS[status] || "gray";
    return <Badge variant={variant as any}>{label}</Badge>;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  function getRoomDisplay(inv: Invoice) {
    const apt = inv.contract?.apartment;
    if (!apt) return { room: "Chưa rõ", branch: "" };

    const roomNum = formatApartmentDisplay(apt.room_number, apt.floor);
    const branchName = apt.building?.branch_name || "";
    return { room: roomNum, branch: branchName };
  }

  const columns: Column<Invoice>[] = [
    {
      key: "invoice_code",
      label: "Mã hóa đơn",
      sortValue: (inv) => inv.invoice_code,
      render: (inv) => <span className="font-semibold text-gray-800">{inv.invoice_code}</span>
    },
    {
      key: "room",
      label: "Phòng",
      sortValue: (inv) => getRoomDisplay(inv).room,
      render: (inv) => {
        const { room, branch } = getRoomDisplay(inv);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{room}</span>
            {branch && <span className="text-[10px] font-semibold text-purple-600">{branch}</span>}
          </div>
        );
      }
    },
    ...(role !== "TENANT" ? [{
      key: "tenant",
      label: "Người thuê",
      sortValue: (inv: Invoice) => inv.contract?.tenant?.full_name || "",
      render: (inv: Invoice) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-700">{inv.contract?.tenant?.full_name || "-"}</span>
          {inv.contract?.tenant?.phone && (
            <span className="text-[10px] text-gray-400">{inv.contract.tenant.phone}</span>
          )}
        </div>
      )
    }] : []),
    {
      key: "period",
      label: "Kỳ thanh toán",
      sortValue: (inv) => new Date(inv.created_at).getTime(),
      render: (inv) => {
        const billingDate = new Date(inv.created_at);
        return <span className="text-gray-600">{`${billingDate.getMonth() + 1}/${billingDate.getFullYear()}`}</span>;
      }
    },
    {
      key: "total_amount",
      label: "Tổng tiền",
      sortValue: (inv) => Number(inv.total_amount),
      render: (inv) => <span className="font-bold text-gray-900">{formatCurrency(Number(inv.total_amount))}</span>
    },
    {
      key: "status",
      label: "Trạng thái",
      sortValue: (inv) => inv.status,
      render: (inv) => getStatusBadge(inv.status as InvoiceStatus)
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
          {(role === "ADMIN" || role === "MANAGER") && (
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
      )
    }
  ];

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={invoices} emptyMessage="Không tìm thấy hóa đơn nào." />
    </div>
  );
}
