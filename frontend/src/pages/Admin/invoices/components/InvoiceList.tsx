import { Eye, Printer, CheckCircle, XCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../../components/ui/Table";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { Invoice } from "../../../../types";

interface InvoiceListProps {
  invoices: Invoice[];
  role: string | null;
  onOpenDetails: (invoice: Invoice) => void;
  onToggleStatus: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  getSortIcon: (key: string) => React.ReactNode;
  requestSort: (key: string) => void;
}

export default function InvoiceList({
  invoices,
  role,
  onOpenDetails,
  onToggleStatus,
  onPrint,
  getSortIcon,
  requestSort,
}: InvoiceListProps) {
  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
      PAID: { label: "Đã thanh toán", variant: "success" },
      UNPAID: { label: "Chưa thanh toán", variant: "warning" },
      OVERDUE: { label: "Quá hạn", variant: "danger" },
    };
    const s = statusMap[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  // hiển thị phòng theo role
  function getRoomDisplay(inv: Invoice) {
    const apt = inv.contract?.apartment;
    if (!apt) return { room: "Chưa rõ", branch: "" };
    
    const roomNum = formatApartmentDisplay(apt.room_number, apt.floor);
    const branchName = apt.building?.branch_name || "";
    if (role === "ADMIN" && branchName) {
      return { room: roomNum, branch: branchName };
    }
    return { room: roomNum, branch: "" };
  }

  return (
    <div className="space-y-4">
      {/* View Card */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {invoices.map((inv) => {
          const { room, branch } = getRoomDisplay(inv);
          const billingDate = new Date(inv.created_at);
          const billingMonthYear = `${billingDate.getMonth() + 1}/${billingDate.getFullYear()}`;

          return (
            <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-base">{inv.invoice_code}</span>
                {getStatusBadge(inv.status)}
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  <span className="font-semibold text-gray-700">Phòng:</span> <span className="font-bold text-gray-900">{room}</span> {branch && <span className="text-xs font-semibold text-purple-600">({branch})</span>}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Người thuê:</span> {inv.tenant?.full_name} ({inv.tenant?.phone})
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Kỳ thanh toán:</span> {billingMonthYear}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Tổng tiền:</span> <span className="font-bold text-gray-900">{formatCurrency(Number(inv.total_amount))}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onOpenDetails(inv)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Eye size={14} /> Chi tiết
                </button>
                <button
                  type="button"
                  onClick={() => onPrint(inv)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-700 hover:bg-gray-50 flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Printer size={14} /> In
                </button>
                {(role === "ADMIN" || role === "MANAGER") && (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(inv)}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 text-xs cursor-pointer ${inv.status === "PAID"
                        ? "border-red-200 text-red-650 hover:bg-red-50"
                        : "border-green-200 text-green-650 hover:bg-green-55/20"
                      }`}
                  >
                    {inv.status === "PAID" ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    {inv.status === "PAID" ? "Chưa thanh toán" : "Đã thanh toán"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View List (Desktop) */}
      <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-md rounded-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("invoice_code")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Mã HD {getSortIcon("invoice_code")}
              </TableHead>
              <TableHead onClick={() => requestSort("contract.apartment.room_number")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Phòng {getSortIcon("contract.apartment.room_number")}
              </TableHead>
              <TableHead onClick={() => requestSort("tenant.full_name")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Người thuê {getSortIcon("tenant.full_name")}
              </TableHead>
              <TableHead onClick={() => requestSort("created_at")} className="text-center cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Tháng/Năm {getSortIcon("created_at")}
              </TableHead>
              <TableHead onClick={() => requestSort("due_date")} className="text-center cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Hạn thanh toán {getSortIcon("due_date")}
              </TableHead>
              <TableHead onClick={() => requestSort("total_amount")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Tổng tiền {getSortIcon("total_amount")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="text-center cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Trạng thái {getSortIcon("status")}
              </TableHead>
              <TableHead className="text-right">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const { room, branch } = getRoomDisplay(inv);
              const billingDate = new Date(inv.created_at);
              const billingMonthYear = `${billingDate.getMonth() + 1}/${billingDate.getFullYear()}`;

              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold text-gray-800 whitespace-nowrap">{inv.invoice_code}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{room}</span>
                      {branch && <span className="text-[10px] font-semibold text-purple-600">{branch}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{inv.tenant?.full_name}</span>
                      <span className="text-xs text-gray-400">{inv.tenant?.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">{billingMonthYear}</TableCell>
                  <TableCell className="text-center text-gray-600 whitespace-nowrap">{formatDate(inv.due_date)}</TableCell>
                  <TableCell className="text-right font-bold text-gray-900 whitespace-nowrap">
                    {formatCurrency(Number(inv.total_amount))}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(inv)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrint(inv)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                        title="In hóa đơn"
                      >
                        <Printer size={16} />
                      </button>
                      {(role === "ADMIN" || role === "MANAGER") && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(inv)}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${inv.status === "PAID"
                            ? "text-red-400 hover:text-red-650 hover:bg-red-50"
                            : "text-green-500 hover:text-green-650 hover:bg-green-55/20"
                            }`}
                          title={inv.status === "PAID" ? "Đổi sang chưa thanh toán" : "Đánh dấu đã thanh toán"}
                        >
                          {inv.status === "PAID" ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
