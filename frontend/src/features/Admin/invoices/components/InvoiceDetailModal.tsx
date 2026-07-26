import { Fragment } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import { formatDate } from "../../../../utils/date";
import { getInvoicePeriod } from "../../../../utils/invoicePeriod";
import type { Invoice } from "../../../../types";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function InvoiceDetailModal({ isOpen, onClose, invoice }: InvoiceDetailModalProps) {
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

  function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
  }

  function getElectricTierDetails(item: NonNullable<Invoice["items"]>[number]) {
    return item.electric_tier_details ?? [];
  }
  if (!invoice) return null;

  const roomNum = invoice.contract?.apartment?.room_number ? `P.${invoice.contract.apartment.room_number}` : "Chưa rõ";
  const branchName = invoice.contract?.apartment?.building?.branch_name || "Chưa rõ";
  const address = invoice.contract?.apartment?.building?.address || "";
  const billingMonthYear = getInvoicePeriod(invoice).label;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Hóa Đơn" size="lg">
      <div className="space-y-6 text-sm font-sans">
        {/* Upper Info */}
        <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-gray-150">
          <div>
            <h4 className="text-base font-bold text-gray-900">Mã hóa đơn: {invoice.invoice_code}</h4>
            <p className="text-xs text-gray-400 mt-1">Kỳ hóa đơn: {billingMonthYear}</p>
            <p className="text-xs text-gray-400">Hạn thanh toán: {formatDate(invoice.due_date)}</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1.5">
            {getStatusBadge(invoice.status)}
            {invoice.paid_at && (
              <span className="text-[10px] text-gray-400 font-medium">
                Thanh toán lúc: {formatDate(invoice.paid_at)}
              </span>
            )}
          </div>
        </div>

        {/* Branch / Tenant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Thông tin căn hộ</h5>
            <p>
              <span className="font-semibold text-gray-600">Căn hộ:</span> {roomNum} (Tầng {invoice.contract?.apartment?.floor || "Chưa rõ"})
            </p>
            <p>
              <span className="font-semibold text-gray-600">Tòa nhà:</span> {branchName}
            </p>
            {address && (
              <p>
                <span className="font-semibold text-gray-600">Địa chỉ:</span> {address}
              </p>
            )}
          </div>
          <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Khách hàng thuê</h5>
            <p>
              <span className="font-semibold text-gray-600">Họ và tên:</span> {invoice.contract?.tenant?.full_name || "Chưa rõ"}
            </p>
            <p>
              <span className="font-semibold text-gray-600">Số điện thoại:</span> {invoice.contract?.tenant?.phone || "-"}
            </p>
            <p>
              <span className="font-semibold text-gray-600">Email:</span> {invoice.contract?.tenant?.email || "-"}
            </p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="space-y-2">
          <h5 className="font-bold text-gray-850 border-b border-gray-100 pb-1">Chi tiết các dịch vụ</h5>
          <div className="border border-gray-200 rounded-none overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-xs">
                  <th className="p-3">Khoản mục</th>
                  <th className="p-3 text-center">Số lượng / Chỉ số</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item) => {
                    const electricTierDetails = getElectricTierDetails(item);
                    const hasElectricTierDetails = electricTierDetails.length > 0;

                    return (
                      <Fragment key={item.id}>
                        <tr>
                          <td className="p-3 font-medium text-gray-800">{item.item_name}</td>
                          <td className="p-3 text-center">{formatNumber(Number(item.quantity))}</td>
                          <td className="p-3 text-right">
                            {hasElectricTierDetails ? "Theo bậc" : formatCurrency(Number(item.unit_price))}
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-900">
                            {formatCurrency(Number(item.amount))}
                          </td>
                        </tr>
                        {electricTierDetails.map((detail) => (
                          <tr key={`${item.id}-${detail.tier}`} className="bg-gray-50/70 text-xs text-gray-550">
                            <td className="py-2 pl-8 pr-3">{detail.label}</td>
                            <td className="p-2 text-center">{formatNumber(Number(detail.quantity))} kWh</td>
                            <td className="p-2 text-right">{formatCurrency(Number(detail.unit_price))}</td>
                            <td className="p-2 text-right font-medium text-gray-700">
                              {formatCurrency(Number(detail.amount))}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-400 italic">
                      Không tìm thấy khoản mục nào
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50/50 font-bold text-gray-900 border-t border-gray-250">
                  <td colSpan={3} className="p-3 text-right text-sm">
                    TỔNG CỘNG THANH TOÁN:
                  </td>
                  <td className="p-3 text-right text-base text-primary-600">
                    {formatCurrency(Number(invoice.total_amount))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2.5 border-t border-gray-100">
          <Button type="button" onClick={onClose} className="rounded-none">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
