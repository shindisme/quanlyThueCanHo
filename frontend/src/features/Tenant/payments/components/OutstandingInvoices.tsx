import { ArrowRight, ClipboardCheck, Wallet } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import { INVOICE_STATUS_CONFIG } from "../../../../constants";
import type { Invoice } from "../../../../types";
import { formatCurrency } from "../../../../utils/currency";
import { formatDate } from "../../../../utils/date";
import { getInvoiceRoomDisplay, getInvoiceStatus } from "../../../../utils/invoiceDisplay";
import { getInvoicePeriod } from "../../../../utils/invoicePeriod";

interface OutstandingInvoicesProps {
  invoices: Invoice[];
  outstandingBalance: number;
  onPay: (invoiceId: number) => void;
  isProcessing: boolean;
  processingInvoiceId?: number;
}

export default function OutstandingInvoices({
  invoices,
  outstandingBalance,
  onPay,
  isProcessing,
  processingInvoiceId,
}: OutstandingInvoicesProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border border-gray-200 bg-white p-5 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="bg-primary-50 p-3 text-primary-600">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Tổng dư nợ chưa thanh toán
            </h3>
            <p className="mt-0.5 text-3xl font-black text-gray-900">
              {formatCurrency(outstandingBalance)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400">Gồm {invoices.length} hóa đơn cần thanh toán</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
          Hóa đơn cần thanh toán
        </h3>
        {invoices.length === 0 ? (
          <div className="border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-md">
            <ClipboardCheck size={40} className="mx-auto mb-2 text-green-500" />
            <p className="text-sm font-semibold text-gray-800">Bạn không còn hóa đơn cần thanh toán.</p>
            <p className="mt-0.5 text-xs text-gray-400">Tất cả chi phí đã được tất toán.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {invoices.map((invoice) => {
              const room = getInvoiceRoomDisplay(invoice);
              const status = INVOICE_STATUS_CONFIG[getInvoiceStatus(invoice)];
              const amount = Number(invoice.remaining_amount ?? invoice.total_amount);

              return (
                <article
                  key={invoice.id}
                  className="flex flex-col justify-between border border-gray-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {invoice.invoice_code}
                      </span>
                      <Badge variant={status.badge}>{status.label}</Badge>
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-gray-800">
                      {getInvoicePeriod(invoice).label}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {[room.room, room.branch].filter(Boolean).join(" - ") || "Chưa rõ phòng"}
                    </p>
                    <dl className="mt-4 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Hạn thanh toán:</dt>
                        <dd className="font-semibold text-gray-700">{formatDate(invoice.due_date)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Còn phải trả:</dt>
                        <dd className="text-sm font-bold text-primary-600">{formatCurrency(amount)}</dd>
                      </div>
                    </dl>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPay(invoice.id)}
                    disabled={isProcessing}
                    className="mt-5 flex w-full cursor-pointer items-center justify-center gap-1.5 bg-primary-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingInvoiceId === invoice.id ? "Đang chuyển đến VNPay..." : "Thanh toán qua VNPay"}
                    <ArrowRight size={14} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
