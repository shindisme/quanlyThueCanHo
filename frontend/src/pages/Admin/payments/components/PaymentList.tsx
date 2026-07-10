import { Check, X } from "lucide-react";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../../components/ui/Table";
import { formatDate } from "../../../../utils/date";
import type { Payment } from "../../../../types";

interface PaymentListProps {
  payments: Payment[];
  role: string | null;
  isUpdating: boolean;
  handleApprove: (id: number) => void;
  handleReject: (id: number) => void;
  requestSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
}

export default function PaymentList({
  payments,
  role,
  isUpdating,
  handleApprove,
  handleReject,
  requestSort,
  getSortIcon,
}: PaymentListProps) {
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  function getPaymentStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
      SUCCESS: { label: "Thành công", variant: "success" },
      PENDING: { label: "Chờ duyệt", variant: "warning" },
      FAILED: { label: "Thất bại", variant: "danger" },
    };
    const s = statusMap[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  }

  function getMethodLabel(method: string) {
    const methodMap: Record<string, string> = {
      VNPAY: "VNPay",
      E_WALLET: "VNPay",
      BANK_TRANSFER: "Chuyển khoản",
    };
    return methodMap[method] || method;
  }

  // hiển thị phòng theo role
  function getRoomDisplay(pmt: Payment) {
    const roomNum = pmt.invoice?.contract?.apartment?.room_number ? `P.${pmt.invoice.contract.apartment.room_number}` : "";
    const branchName = pmt.invoice?.contract?.apartment?.building?.branch_name || "";
    if (role === "ADMIN" && branchName) {
      return { room: roomNum, branch: branchName };
    }
    return { room: roomNum, branch: "" };
  }

  return (
    <div className="space-y-4">
      {/* View Card */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {payments.map((pmt) => {
          const invoiceCode = pmt.invoice?.invoice_code || `HD-${String(pmt.invoice_id).padStart(5, "0")}`;
          const { room, branch } = getRoomDisplay(pmt);
          const tenantName = pmt.invoice?.tenant?.full_name || "Chưa rõ";
          const tenantPhone = pmt.invoice?.tenant?.phone || "";

          return (
            <div key={pmt.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-base font-mono">{pmt.transaction_code || "-"}</span>
                {getPaymentStatusBadge(pmt.status)}
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  <span className="font-semibold text-gray-700">Thời gian:</span> {formatDate(pmt.paid_at)}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Hóa đơn:</span> {invoiceCode} {room && `(${room}${branch ? ` - ${branch}` : ""})`}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Khách thuê:</span> {tenantName} ({tenantPhone})
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Phương thức:</span> {getMethodLabel(pmt.payment_method)}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Số tiền:</span> <span className="font-bold text-gray-900">{formatCurrency(Number(pmt.amount))}</span>
                </p>
              </div>

              {pmt.status === "PENDING" && (role === "ADMIN" || role === "MANAGER") && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleApprove(pmt.id)}
                    disabled={isUpdating}
                    className="px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Check size={14} className="stroke-3" /> Phê duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(pmt.id)}
                    disabled={isUpdating}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <X size={14} className="stroke-3" /> Từ chối
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View List*/}
      <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-md rounded-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("paid_at")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Thời gian {getSortIcon("paid_at")}
              </TableHead>
              <TableHead onClick={() => requestSort("invoice.invoice_code")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Hóa đơn {getSortIcon("invoice.invoice_code")}
              </TableHead>
              <TableHead className="select-none">Khách thuê</TableHead>
              <TableHead onClick={() => requestSort("payment_method")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Phương thức {getSortIcon("payment_method")}
              </TableHead>
              <TableHead onClick={() => requestSort("transaction_code")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Mã giao dịch {getSortIcon("transaction_code")}
              </TableHead>
              <TableHead onClick={() => requestSort("amount")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Số tiền {getSortIcon("amount")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="text-center cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Trạng thái {getSortIcon("status")}
              </TableHead>
              <TableHead className="text-right">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((pmt) => {
              const invoiceCode = pmt.invoice?.invoice_code || `HD-${String(pmt.invoice_id).padStart(5, "0")}`;
              const { room, branch } = getRoomDisplay(pmt);
              const tenantName = pmt.invoice?.tenant?.full_name || "Chưa rõ";
              const tenantPhone = pmt.invoice?.tenant?.phone || "";

              return (
                <TableRow key={pmt.id}>
                  <TableCell className="text-gray-600 whitespace-nowrap">{formatDate(pmt.paid_at)}</TableCell>
                  <TableCell className="font-semibold text-gray-800 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{invoiceCode}</span>
                      {room && (
                        <span className="text-[10px] text-gray-400 font-normal">
                          {room} {branch && `(${branch})`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{tenantName}</span>
                      {tenantPhone && <span className="text-xs text-gray-400">{tenantPhone}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-gray-700">{getMethodLabel(pmt.payment_method)}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600 max-w-xs truncate" title={pmt.transaction_code || ""}>
                    {pmt.transaction_code || "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900 whitespace-nowrap">
                    {formatCurrency(Number(pmt.amount))}
                  </TableCell>
                  <TableCell className="text-center">{getPaymentStatusBadge(pmt.status)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {pmt.status === "PENDING" && (role === "ADMIN" || role === "MANAGER") && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleApprove(pmt.id)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                          title="Phê duyệt giao dịch"
                        >
                          <Check size={14} className="stroke-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(pmt.id)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                          title="Từ chối giao dịch"
                        >
                          <X size={14} className="stroke-3" />
                        </button>
                      </div>
                    )}
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
