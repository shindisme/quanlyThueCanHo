import type { Invoice, RentalContract } from "../types";
import { formatDate } from "./date";
import { formatApartmentDisplay } from "./string";
import { numberToVietnameseWords } from "./currency";
import { getInvoicePeriod } from "./invoicePeriod";
import { getDisplayItemAmount, getDisplayTierDetails, getUtilityUnit } from "./feeSettings";
import { getInvoiceApartment, getInvoiceTenant } from "./invoiceDisplay";
import {
  getContractDurationText,
  getContractOccupancyPricing,
  getContractSignedDate,
} from "./contractDocument";

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

export function printContractHelper(contract: RentalContract) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Vui lòng cho phép popup để in hợp đồng!");
    return;
  }

  const tenant = contract.tenant;
  const apt = contract.apartment;
  const bld = apt?.building;

  const {
    maxOccupants: maxOcc,
    actualOccupants: actOcc,
    excessOccupants: excess,
    excessSurcharge,
    baseRent,
  } = getContractOccupancyPricing(contract, apt);
  const durationText = getContractDurationText(contract.start_date, contract.end_date);
  const signedDate = getContractSignedDate(contract);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Hợp Đồng Thuê Căn Hộ - HD-${String(contract.id).padStart(5, "0")}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #111827;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            line-height: 1.5;
            font-size: 13pt;
          }
          .no-print-bar {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          .contract-page {
            max-width: 800px;
            margin: 20px auto;
            background: #ffffff;
            padding: 30px 40px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .divider {
            width: 160px;
            height: 1px;
            background: #374151;
            margin: 6px auto 16px auto;
          }
          .section-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 14px;
            margin-bottom: 4px;
          }
          .indent {
            padding-left: 20px;
          }
          .signature-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signature-box {
            width: 45%;
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
            .contract-page {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-weight: 600;">Xem Trước Bản In Hợp Đồng - HD-${String(contract.id).padStart(5, "0")}</span>
          <div>
            <button type="button" class="btn-print" onclick="window.print()">In Hợp Đồng</button>
            <button type="button" class="btn-close" onclick="window.close()">Đóng</button>
          </div>
        </div>

        <div class="contract-page">
          <div class="text-center">
            <p class="font-bold uppercase" style="margin: 0; font-size: 13pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p class="font-bold" style="margin: 2px 0 0 0; font-size: 12pt;">Độc lập – Tự do – Hạnh phúc</p>
            <div class="divider"></div>
          </div>

          <div class="text-center" style="margin-bottom: 20px;">
            <h2 class="font-bold uppercase" style="margin: 0; font-size: 15pt;">HỢP ĐỒNG THUÊ CĂN HỘ CHUNG CƯ</h2>
            <p class="italic" style="margin: 4px 0 0 0; font-size: 11pt; color: #4b5563;">
              Số: HD-${String(contract.id).padStart(5, "0")}
            </p>
          </div>

          <p style="margin-bottom: 12px;">
            Hôm nay, ngày ${signedDate.getDate()} tháng ${signedDate.getMonth() + 1} năm ${signedDate.getFullYear()}, tại ${bld?.address || "văn phòng đại diện Yuki House"}, chúng tôi gồm có:
          </p>

          <div class="section-title">BÊN CHO THUÊ (Sau đây gọi tắt là Bên A)</div>
          <div class="indent">
            <p style="margin: 3px 0;">– Ông/bà: <strong>BAN QUẢN LÝ CĂN HỘ DỊCH VỤ YUKI HOUSE (Đại diện)</strong></p>
            <p style="margin: 3px 0;">– Số CMND/CCCD/Mã số thuế: 079200000001</p>
            <p style="margin: 3px 0;">– Địa chỉ: ${bld?.address || "Hệ thống tòa nhà Yuki House"}</p>
            <p style="margin: 3px 0;">– Điện thoại: 0901000001</p>
            <p style="margin: 3px 0;">– Là chủ cho thuê hợp pháp căn hộ số: <strong>${apt ? formatApartmentDisplay(apt.room_number, apt.floor, "TENANT", bld?.branch_name) : "-"}</strong> tại ${bld?.name || "Tòa nhà Yuki House"}</p>
          </div>

          <div class="section-title">BÊN THUÊ (Sau đây gọi tắt là Bên B)</div>
          <div class="indent">
            <p style="margin: 3px 0;">– Ông/bà: <strong>${tenant?.full_name || "CHƯA XÁC ĐỊNH"}</strong></p>
            <p style="margin: 3px 0;">– Số CMND/CCCD: ${tenant?.citizen_id || "Chưa cập nhật"}</p>
            <p style="margin: 3px 0;">– Địa chỉ: ${tenant?.address || "Chưa cập nhật"}</p>
            <p style="margin: 3px 0;">– Số điện thoại: ${tenant?.phone || "Chưa cập nhật"}</p>
          </div>

          <p class="italic" style="margin-top: 10px; margin-bottom: 10px;">
            Sau khi bàn bạc hai Bên thống nhất ký Hợp đồng cho thuê căn hộ chung cư với nội dung sau:
          </p>

          <div class="section-title">ĐIỀU 1: ĐỐI TƯỢNG VÀ NỘI DUNG CỦA HỢP ĐỒNG</div>
          <div class="indent">
            <p style="margin: 3px 0;">1.1. Bên A cho Bên B thuê và Bên B đồng ý thuê căn hộ chung cư có thông tin như sau:</p>
            <p style="margin: 2px 0 2px 14px;">+ Địa chỉ căn hộ: ${bld?.address || "Chưa xác định"}</p>
            <p style="margin: 2px 0 2px 14px;">+ Căn hộ số: ${apt?.room_number || "..."} - Tầng số: ${apt?.floor || "..."}</p>
            <p style="margin: 2px 0 2px 14px;">+ Tổng diện tích sàn căn hộ là: ${apt?.area || "..."} m².</p>
            <p style="margin: 2px 0 2px 14px;">+ Đặc điểm: 1 phòng khách, ${apt?.bedrooms || 1} phòng ngủ, ${apt?.bathrooms || 1} WC.</p>
            <p style="margin: 2px 0 2px 14px;">+ Trang thiết bị: Bàn giao đầy đủ theo biên bản bàn giao kèm theo hợp đồng.</p>
            <p style="margin: 3px 0;">1.2. Mục đích thuê: Để ở sinh hoạt gia đình (Số lượng người ở tối đa cho phép: ${maxOcc} người, thực tế đăng ký: ${actOcc} người).</p>
          </div>

          <div class="section-title">ĐIỀU 2: THỜI HẠN THUÊ CĂN HỘ CHUNG CƯ</div>
          <div class="indent">
            <p style="margin: 3px 0;">
              Thời hạn thuê căn hộ chung cư là: <strong>${durationText}</strong> (từ ngày <strong>${formatDate(contract.start_date)}</strong> đến ngày <strong>${formatDate(contract.end_date)}</strong>).
            </p>
          </div>

          <div class="section-title">ĐIỀU 3: GIÁ THUÊ, PHƯƠNG THỨC VÀ THỜI HẠN THANH TOÁN</div>
          <div class="indent">
            <p style="margin: 3px 0;">
              3.1. Giá thuê căn hộ là: <strong>${formatCurrency(contract.monthly_rent)}/tháng</strong> (Bằng chữ: <em>${numberToVietnameseWords(contract.monthly_rent)} đồng chẵn / tháng</em>).
            </p>
            <p style="margin: 3px 0;">Tiền thuê được giữ cố định trong suốt thời hạn thuê.</p>
            ${excess > 0 ? `<p style="margin: 2px 0 2px 14px; color: #b45309; font-weight: bold; font-style: italic;">(* Ghi chú: Giá thuê bao gồm đơn giá cơ bản ${formatCurrency(baseRent)}/tháng và phụ thu ${formatCurrency(excessSurcharge)}/tháng do quá số lượng người ở quy định).</p>` : ""}
            <p style="margin: 3px 0;">3.2. Giá cho thuê này đã bao gồm chi phí bảo trì, quản lý vận hành nhà ở và chưa bao gồm các khoản thuế phát sinh theo quy định.</p>
            <p style="margin: 3px 0;">3.3. Chi phí sử dụng điện, nước, internet và dịch vụ khác do Bên B thanh toán theo hóa đơn thực tế.</p>
            <p style="margin: 3px 0;">3.4. Phương thức thanh toán: Thực hiện theo kỳ 01 tháng một lần trong vòng 05 ngày đầu tiên của mỗi đợt thanh toán bằng hình thức chuyển khoản hoặc tiền mặt.</p>
          </div>

          <div class="section-title">ĐIỀU 4: ĐẶT CỌC</div>
          <div class="indent">
            <p style="margin: 3px 0;">
              Bên B đặt cọc cho Bên A số tiền là: <strong>${formatCurrency(contract.deposit_amount)}</strong> (tương đương với ${Math.round(contract.deposit_amount / contract.monthly_rent) || 1} tháng tiền thuê căn hộ).
            </p>
            <p style="margin: 3px 0;">Tiền đặt cọc được Bên A giữ trong suốt thời hạn thuê để đảm bảo thực hiện hợp đồng và không tính lãi.</p>
          </div>

          <div class="section-title">ĐIỀU 5: CHO THUÊ LẠI CĂN HỘ CHUNG CƯ</div>
          <div class="indent">
            <p style="margin: 3px 0;">Bên B không có quyền cho thuê lại căn hộ, trừ trường hợp được sự đồng ý bằng văn bản của Bên A.</p>
          </div>

          <div class="section-title">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</div>
          <div class="indent">
            <p style="margin: 3px 0;">– Bàn giao căn hộ và trang thiết bị theo đúng thỏa thuận;</p>
            <p style="margin: 3px 0;">– Bảo đảm cho Bên B sử dụng ổn định căn hộ trong thời hạn thuê;</p>
            <p style="margin: 3px 0;">– Nhận đúng và đầy đủ tiền thuê từ Bên B theo quy định.</p>
          </div>

          <div class="section-title">ĐIỀU 7: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</div>
          <div class="indent">
            <p style="margin: 3px 0;">– Trả đủ tiền thuê căn hộ theo đúng thời hạn đã cam kết;</p>
            <p style="margin: 3px 0;">– Sử dụng căn hộ đúng mục đích; có trách nhiệm giữ gìn tài sản và sửa chữa hư hỏng do mình gây ra;</p>
            <p style="margin: 3px 0;">– Chấp hành đầy đủ nội quy tòa nhà và quy định pháp luật về an ninh trật tự, vệ sinh môi trường.</p>
          </div>

          <div class="section-title">ĐIỀU 8: CHẤM DỨT HỢP ĐỒNG</div>
          <div class="indent">
            <p style="margin: 3px 0;">Hợp đồng chấm dứt khi hết thời hạn thuê hoặc theo thỏa thuận của hai bên. Khi chấm dứt hợp đồng, Bên B bàn giao lại căn hộ và trang thiết bị nguyên trạng. Bên A hoàn trả tiền đặt cọc sau khi đã khấu trừ các chi phí dịch vụ hoặc hư hại tài sản do Bên B gây ra (nếu có).</p>
          </div>

          <div class="section-title">ĐIỀU 9: GIẢI QUYẾT TRANH CHẤP</div>
          <div class="indent">
            <p style="margin: 3px 0;">Tranh chấp phát sinh được ưu tiên thương lượng giải quyết. Trường hợp không tự thương lượng được, các bên có quyền yêu cầu Tòa án có thẩm quyền giải quyết theo quy định của pháp luật.</p>
          </div>

          <div class="section-title">ĐIỀU 10: HIỆU LỰC HỢP ĐỒNG</div>
          <div class="indent">
            <p style="margin: 3px 0;">Hợp đồng này có hiệu lực kể từ ngày <strong>${formatDate(contract.start_date)}</strong>, được lập thành 02 bản có giá trị pháp lý như nhau, mỗi Bên giữ 01 bản.</p>
          </div>

          <div class="signature-grid">
            <div class="signature-box">
              <p class="font-bold uppercase" style="margin: 0;">BÊN CHO THUÊ (BÊN A)</p>
              <p class="italic" style="margin: 2px 0 0 0; font-size: 10pt; color: #6b7280;">(Ký và ghi rõ họ tên)</p>
              <div style="height: 70px;"></div>
              <p class="font-bold" style="margin: 0;">BAN QUẢN LÝ YUKI HOUSE</p>
            </div>
            <div class="signature-box">
              <p class="font-bold uppercase" style="margin: 0;">BÊN THUÊ (BÊN B)</p>
              <p class="italic" style="margin: 2px 0 0 0; font-size: 10pt; color: #6b7280;">(Ký và ghi rõ họ tên)</p>
              <div style="height: 70px;"></div>
              <p class="font-bold" style="margin: 0;">${tenant?.full_name || "Bên thuê"}</p>
            </div>
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
