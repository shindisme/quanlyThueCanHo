import type { Invoice } from "../types";
import { formatDate } from "./date";
import { getInvoicePeriod } from "./invoicePeriod";
import { getDisplayItemAmount, getDisplayTierDetails } from "./feeSettings";
import { getInvoiceApartment, getInvoiceTenant } from "./invoiceDisplay";

export function printInvoiceHelper(invoice: Invoice) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Vui lòng cho phép popup để in hóa đơn!");
    return;
  }

  const apartment = getInvoiceApartment(invoice);
  const tenant = getInvoiceTenant(invoice);
  const roomNum = apartment?.room_number ? `P.${apartment.room_number}` : "Chưa rõ";
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
  const getUtilityUnit = (item: NonNullable<Invoice["items"]>[number]) => {
    if (item.utility_type === "WATER" || item.item_name.startsWith("Tiền nước")) return "m³";
    if (item.utility_type === "ELECTRIC" || item.item_name.startsWith("Tiền điện")) return "kWh";
    return "";
  };
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
      <tr style="background: #f9fafb; color: #4b5563; font-size: 12px;">
        <td style="padding: 7px 10px 7px 28px; border-bottom: 1px solid #eee;">${detail.label}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #eee; text-align: center;">${formatNumber(Number(detail.quantity))}${utilityUnit ? ` ${utilityUnit}` : ""}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(Number(detail.unit_price))}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(Number(detail.amount))}</td>
      </tr>`
        )
        .join("");
      const itemAmount = getDisplayItemAmount(item, occupantCount);

      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.item_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${formatNumber(Number(item.quantity))}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${unitPriceText}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(itemAmount)}</td>
      </tr>
      ${detailRows}`;
    })
    .join("");
  const html = `
    <html>
      <head>
        <title>In Hóa Đơn - ${invoice.invoice_code}</title>
        <style>
          body {
            font-family: 'Outfit', 'Inter', sans-serif;
            color: #333;
            margin: 40px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .title {
            text-align: right;
          }
          .title h1 {
            margin: 0;
            font-size: 24px;
            color: #111;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 40px;
          }
          .info-box {
            flex: 1;
            background: #f9fafb;
            padding: 15px;
            border: 1px solid #e5e7eb;
          }
          .info-box h3 {
            margin-top: 0;
            margin-bottom: 10px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 5px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-box p {
            margin: 5px 0;
            font-size: 13px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-size: 13px;
            border-bottom: 2px solid #d1d5db;
          }
          td {
            font-size: 13px;
          }
          .total-row {
            font-size: 16px;
            font-weight: bold;
            background: #f9fafb;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding: 0 50px;
          }
          .signature-box {
            text-align: center;
            width: 150px;
          }
          .signature-space {
            height: 80px;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">YuKi House</div>
          <div class="title">
            <h1>HÓA ĐƠN DỊCH VỤ</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">Mã HD: ${invoice.invoice_code}</p>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Thông tin căn hộ</h3>
            <p><strong>Căn hộ:</strong> ${roomNum}</p>
            <p><strong>Tầng:</strong> Tầng ${apartment?.floor || "Chưa rõ"}</p>
            <p><strong>Tòa nhà:</strong> ${branchName}</p>
            <p><strong>Địa chỉ:</strong> ${address}</p>
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
              <th style="width: 40%;">Khoản mục</th>
              <th style="width: 20%; text-align: center;">Số lượng</th>
              <th style="width: 20%; text-align: right;">Đơn giá</th>
              <th style="width: 20%; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            <tr class="total-row">
              <td colspan="3" style="padding: 15px 10px; text-align: right;">TỔNG CỘNG CẦN THANH TOÁN:</td>
              <td style="padding: 15px 10px; text-align: right; color: #2563eb;">${totalStr}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 12px; margin-top: 15px; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px; color: #b45309;">
          * Quý khách vui lòng thanh toán trước ngày <strong>${formatDate(invoice.due_date)}</strong> để tránh phát sinh phí quá hạn.
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <p style="margin: 0; font-size: 13px; font-weight: bold;">Người thuê</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #666;">(Ký, ghi rõ họ tên)</p>
            <div class="signature-space"></div>
          </div>
          <div class="signature-box">
            <p style="margin: 0; font-size: 13px; font-weight: bold;">Đại diện quản lý</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #666;">(Ký, đóng dấu)</p>
            <div class="signature-space"></div>
          </div>
        </div>

        <div class="footer">
          <p>Cảm ơn quý khách đã tin tưởng và đồng hành cùng YuKi House!</p>
          <p style="font-size: 10px; color: #999;">Hóa đơn được in tự động từ hệ thống quản lý căn hộ YuKi House ngày ${new Date().toLocaleDateString("vi-VN")}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
