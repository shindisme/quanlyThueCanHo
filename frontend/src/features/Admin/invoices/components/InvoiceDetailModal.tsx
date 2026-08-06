import { Fragment } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import { formatDate } from "../../../../utils/date";
import { formatCurrency, formatNumber } from "../../../../utils/currency";
import { formatApartmentDisplay } from "../../../../utils/string";
import { getInvoicePeriod } from "../../../../utils/invoicePeriod";
import { getDisplayItemAmount, getDisplayTierDetails } from "../../../../utils/feeSettings";
import { getInvoiceApartment, getInvoiceTenant } from "../../../../utils/invoiceDisplay";
import {
  INVOICE_STATUS_CONFIG,
  INVOICE_TYPE_CONFIG,
  type InvoiceStatus,
  type InvoiceType,
} from "../../../../constants/enums";
import type { Invoice } from "../../../../types";

function getStatusBadge(status: string) {
  const config = INVOICE_STATUS_CONFIG[status as InvoiceStatus];
  return <Badge variant={config?.badge || "gray"}>{config?.label || status}</Badge>;
}

function getTypeBadge(type?: string | null) {
  if (!type) return null;
  const config = INVOICE_TYPE_CONFIG[type as InvoiceType];
  if (!config) return null;
  return <Badge variant={config.badge}>{config.label}</Badge>;
}

function getTierDetails(item: NonNullable<Invoice["items"]>[number], occupantCount?: number) {
  return getDisplayTierDetails(item, occupantCount);
}

function getUtilityUnit(item: NonNullable<Invoice["items"]>[number]) {
  if (item.utility_type === "WATER" || item.item_name.toLowerCase().includes("nước")) return "m³";
  if (item.utility_type === "ELECTRIC" || item.item_name.toLowerCase().includes("điện")) return "kWh";
  return "";
}

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function InvoiceDetailModal({ isOpen, onClose, invoice }: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const apartment = getInvoiceApartment(invoice);
  const tenant = getInvoiceTenant(invoice);
  const formattedRoom = apartment
    ? formatApartmentDisplay(apartment.room_number, apartment.floor)
    : "Chưa rõ";
  const branchName = apartment?.building?.branch_name || "Chưa rõ";
  const address = apartment?.building?.address || "";
  const billingMonthYear = getInvoicePeriod(invoice).label;
  const occupantCount = invoice.contract?.actual_occupants;
  const displayTotalAmount = invoice.items && invoice.items.length > 0
    ? invoice.items.reduce((sum, item) => sum + getDisplayItemAmount(item, occupantCount), 0)
    : Number(invoice.total_amount);

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
            <div className="flex items-center gap-2">
              {getTypeBadge(invoice.type)}
              {getStatusBadge(invoice.status)}
            </div>
            {invoice.paid_at && (
              <span className="text-[10px] text-gray-400 font-medium">
                Thanh toán lúc: {formatDate(invoice.paid_at)}
              </span>
            )}
          </div>
        </div>

        {/* Branch / Tenant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50/50 p-4 border border-gray-200 space-y-2 shadow-lg">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Thông tin căn hộ</h5>
            <p>
              <span className="font-semibold text-gray-600">Căn hộ:</span> {formattedRoom}
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
          <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2 shadow-lg">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Khách hàng thuê</h5>
            <p>
              <span className="font-semibold text-gray-600">Họ và tên:</span> {tenant?.full_name || "Chưa rõ"}
            </p>
            <p>
              <span className="font-semibold text-gray-600">Số điện thoại:</span> {tenant?.phone || "-"}
            </p>
            <p>
              <span className="font-semibold text-gray-600">Email:</span> {tenant?.email || "-"}
            </p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="space-y-2">
          <h5 className="font-bold text-gray-800 border-b border-gray-100 pb-1">Chi tiết các dịch vụ</h5>
          <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm bg-white">
            <table className="w-full text-left border-collapse min-w-125">
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
                    const tierDetails = getTierDetails(item, occupantCount);
                    const hasTierDetails = tierDetails.length > 0;
                    const utilityUnit = getUtilityUnit(item);

                    return (
                      <Fragment key={item.id}>
                        <tr>
                          <td className="p-3 font-medium text-gray-800">{item.item_name}</td>
                          <td className="p-3 text-center">{formatNumber(Number(item.quantity))}</td>
                          <td className="p-3 text-right">
                            {hasTierDetails ? "Theo bậc" : formatCurrency(Number(item.unit_price))}
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-900">
                            {formatCurrency(getDisplayItemAmount(item, occupantCount))}
                          </td>
                        </tr>
                        {tierDetails.map((detail) => (
                          <tr key={`${item.id}-${detail.tier}`} className="bg-gray-50/70 text-xs text-gray-550">
                            <td className="py-2 pl-8 pr-3">{detail.label}</td>
                            <td className="p-2 text-center">{formatNumber(Number(detail.quantity))}{utilityUnit ? ` ${utilityUnit}` : ""}</td>
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
                    {formatCurrency(displayTotalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2.5 border-t border-gray-100">
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
