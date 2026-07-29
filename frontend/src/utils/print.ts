import type { Invoice } from "../types";
import { formatDate } from "./date";
import { formatApartmentDisplay } from "./string";
import { getInvoicePeriod } from "./invoicePeriod";
import { getDisplayItemAmount, getDisplayTierDetails, getUtilityUnit } from "./feeSettings";
import { getInvoiceApartment, getInvoiceTenant } from "./invoiceDisplay";

export function printInvoiceHelper(invoice: Invoice) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Vui lòng cho phép popup để in hóa đơn!");
    return;
  }

  const apartment = getInvoiceApartment(invoice);
  const tenant = getInvoiceTenant(invoice);
  const roomNum = apartment
    ? formatApartmentDisplay(apartment.room_number, apartment.floor)
    : "Chưa rõ";
  const branchName = apartment?.building?.branch_name || "Chưa rõ";
  const address = apartment?.building?.address || "";
  const billingMonthYear = getInvoicePeriod(invoice).label;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
  const occupantCount = invoice.contract?.actual_occupants;
  const invoiceItems = invoice.items || [];
  const totalStr = formatCurrency(invoiceItems.length > 0
    ? invoiceItems.reduce((sum, item) => sum + getDisplayItemAmount(item, occupantCount), 0)
    : Number(invoice.total_amount));
  const getTierDetails = (item: NonNullable<Invoice["items"]>[number]) =>
    getDisplayTierDetails(item, occupantCount);

  const itemsRows = invoiceItems
    .map((item) => {
      const tierDetails = getTierDetails(item);
      const utilityUnit = getUtilityUnit(item);
      const unitPriceText = tierDetails.length > 0
        ? "Theo bậc"
        : formatCurrency(Number(item.unit_price));
      const detailRows = tierDetails
        .map(
          (detail) => `
      <tr style="background: #f9fafb; color: #4b5563; font-size: 11px;">
        <td style="padding: 3px 8px 3px 22px; border-bottom: 1px solid #edf2f7;">${detail.label}</td>
        <td style="padding: 3px 8px; border-bottom: 1px solid #edf2f7; text-align: center;">${formatNumber(Number(detail.quantity))}${utilityUnit ? ` ${utilityUnit}` : ""}</td>
        <td style="padding: 3px 8px; border-bottom: 1px solid #edf2f7; text-align: right;">${formatCurrency(Number(detail.unit_price))}</td>
        <td style="padding: 3px 8px; border-bottom: 1px solid #edf2f7; text-align: right;">${formatCurrency(Number(detail.amount))}</td>
      </tr>`
        )
        .join("");
      const itemAmount = getDisplayItemAmount(item, occupantCount);

      return `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${item.item_name}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${formatNumber(Number(item.quantity))}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${unitPriceText}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatCurrency(itemAmount)}</td>
      </tr>
      ${detailRows}`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Hóa Đơn - ${invoice.invoice_code}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            line-height: 1.4;
            font-size: 12px;
          }
          .no-print-bar {
            background-color: #1e293b;
            color: #ffffff;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .no-print-bar button {
            padding: 6px 16px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-print {
            background-color: #2563eb;
            color: white;
            margin-right: 8px;
          }
          .btn-print:hover {
            background-color: #1d4ed8;
          }
          .btn-close {
            background-color: #475569;
            color: white;
          }
          .btn-close:hover {
            background-color: #334155;
          }
          .invoice-page {
            max-width: 780px;
            margin: 20px auto;
            background: #ffffff;
            padding: 24px 28px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .logo {
            font-size: 22px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .title {
            text-align: right;
          }
          .title h1 {
            margin: 0;
            font-size: 20px;
            color: #0f172a;
            font-weight: 700;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 14px;
            gap: 16px;
          }
          .info-box {
            flex: 1;
            background: #f8fafc;
            padding: 10px 14px;
            border: 1px solid #e2e8f0;
          }
          .info-box h3 {
            margin-top: 0;
            margin-bottom: 6px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
            letter-spacing: 0.5px;
          }
          .info-box p {
            margin: 3px 0;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
          }
          th {
            background: #f1f5f9;
            padding: 7px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
            text-transform: uppercase;
          }
          td {
            font-size: 12px;
          }
          .total-row {
            font-size: 14px;
            font-weight: bold;
            background: #f8fafc;
          }
          .notice-box {
            font-size: 11px;
            margin-top: 10px;
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 6px;
            padding: 8px 12px;
            color: #b45309;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
          @media print {
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print-bar {
              display: none !important;
            }
            .invoice-page {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-weight: 600;">Xem Trước Hóa Đơn - ${invoice.invoice_code}</span>
          <div>
            <button type="button" class="btn-print cursor-pointer" style="background-color: #8B5CF6;" onclick="window.print()">In Hóa Đơn</button>
            <button type="button" class="btn-close" onclick="window.close()">Đóng</button>
          </div>
        </div>

        <div class="invoice-page">
          <div class="header">
            <div class="logo" style="color: #8B5CF6;">YuKi House</div>
            <div class="title">
              <h1>HÓA ĐƠN DỊCH VỤ</h1>
              <p style="margin: 3px 0 0 0; font-size: 12px; font-weight: bold; color: #475569;">Mã HD: ${invoice.invoice_code}</p>
            </div>
          </div>

          <div class="info-section">
            <div class="info-box">
              <h3>Thông tin căn hộ</h3>
              <p><strong>Căn hộ:</strong> ${roomNum}</p>
              <p><strong>Tòa nhà:</strong> ${branchName}</p>
              ${address ? `<p><strong>Địa chỉ:</strong> ${address}</p>` : ""}
            </div>
            <div class="info-box">
              <h3>Khách hàng thanh toán</h3>
              <p><strong>Khách thuê:</strong> ${tenant?.full_name || "Chưa rõ"}</p>
              <p><strong>Số điện thoại:</strong> ${tenant?.phone || "-"}</p>
              <p><strong>Kỳ hóa đơn:</strong> ${billingMonthYear}</p>
              <p><strong>Hạn thanh toán:</strong> ${formatDate(invoice.due_date)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 42%;">Khoản mục</th>
                <th style="width: 18%; text-align: center;">Số lượng</th>
                <th style="width: 20%; text-align: right;">Đơn giá</th>
                <th style="width: 20%; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr class="total-row">
                <td colspan="3" style="padding: 10px 8px; text-align: right;">TỔNG CỘNG CẦN THANH TOÁN:</td>
                <td style="padding: 10px 8px; text-align: right; color: #2563eb;">${totalStr}</td>
              </tr>
            </tbody>
          </table>

          <div class="notice-box">
            * Quý khách vui lòng thanh toán trước ngày <strong>${formatDate(invoice.due_date)}</strong> để tránh phát sinh phí quá hạn.
          </div>

          <div class="footer">
            <p style="margin: 0; font-weight: 500;">Cảm ơn quý khách đã tin tưởng và đồng hành cùng YuKi House!</p>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #94a3b8;">Hóa đơn được in tự động từ hệ thống quản lý căn hộ YuKi House ngày ${new Date().toLocaleDateString("vi-VN")}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
