import { CreditCard, Wallet, QrCode, ArrowRight, ClipboardCheck, History } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import { useTenantPayments } from "../hooks/useTenantPayments";
import { formatDate } from "../../../../utils/date";
import { getInvoicePeriod } from "../../../../utils/invoicePeriod";

export default function MyPayments() {
  const {
    unpaidInvoices,
    payments,
    outstandingBalance,
    isLoading,
    isProcessing,

    // Checkout Modal
    selectedInvoiceId,
    paymentMethod,
    setPaymentMethod,
    transactionCode,
    setTransactionCode,
    payModal,
    manualTransferModal,
    handleStartPayment,
    handleConfirmPayment,
    handleManualSubmit,

    // Sorting & Pagination
    currentPage,
    setCurrentPage,
    totalPages,
  } = useTenantPayments();

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  function getPaymentStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
      SUCCESS: { label: "Thành công", variant: "success" },
      PENDING: { label: "Chưa thanh toán", variant: "warning" },
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

  const activeCheckoutInvoice = unpaidInvoices.find((inv) => inv.id === selectedInvoiceId);

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={CreditCard}
        title="Thanh toán hóa đơn"
        subtitle="Quản lý công nợ, thanh toán online qua cổng VNPay hoặc chuyển khoản ngân hàng thủ công"
        iconColor="linear-gradient(135deg, #3B82F6, #8B5CF6)"
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-75">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải thông tin thanh toán...</span>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* LEFT: Unpaid Invoices & Portal */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Outstanding Summary */}
            <div className="bg-white border border-gray-200 p-5 shadow-md rounded-none flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-primary-50 text-primary-600">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng dư nợ chưa thanh toán</h3>
                  <p className="text-3xl font-black text-gray-900 mt-0.5">{formatCurrency(outstandingBalance)}</p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Gồm {unpaidInvoices.length} hóa đơn chưa thanh toán
              </div>
            </div>

            {/* List of unpaid invoices */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Hóa đơn cần thanh toán</h3>
              {unpaidInvoices.length === 0 ? (
                <div className="bg-white border border-gray-200 p-8 text-center text-gray-500 shadow-md rounded-none">
                  <ClipboardCheck size={40} className="mx-auto mb-2 text-green-500" />
                  <p className="font-semibold text-sm text-gray-800">Tuyệt vời! Bạn không có hóa đơn quá hạn nào.</p>
                  <p className="text-xs text-gray-400 mt-0.5">Tất cả chi phí dịch vụ và tiền thuê nhà đã được tất toán.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unpaidInvoices.map((inv) => {
                    const roomNum = inv.contract?.apartment?.room_number ? `P.${inv.contract.apartment.room_number}` : "Chưa rõ";
                    const branchName = inv.contract?.apartment?.building?.branch_name || "";
                    const monthYear = getInvoicePeriod(inv).label;

                    return (
                      <div
                        key={inv.id}
                        className="bg-white border border-gray-200 p-5 shadow-md hover:shadow-lg transition-all rounded-none flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{inv.invoice_code}</span>
                            <Badge variant="warning">Chưa trả</Badge>
                          </div>
                          <h4 className="text-lg font-bold text-gray-800 mt-2">
                            Tiền phòng & Dịch vụ {monthYear}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {roomNum} - {branchName}
                          </p>
                          <div className="mt-4 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Hạn thanh toán:</span>
                              <span className="font-semibold text-gray-700">{formatDate(inv.due_date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Tổng thanh toán:</span>
                              <span className="font-bold text-primary-600 text-sm">{formatCurrency(Number(inv.total_amount))}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartPayment(inv.id)}
                          className="w-full mt-5 py-2.5 bg-primary-600 text-white font-semibold text-xs hover:bg-primary-700 transition-colors shadow-sm cursor-pointer rounded-none flex items-center justify-center gap-1.5"
                        >
                          <span>Thanh toán ngay</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Transaction History Ledger */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white border border-gray-200 p-5 shadow-md rounded-none flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                  <History size={16} className="text-gray-500" />
                  Lịch sử thanh toán gần đây
                </h3>

                {payments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">Bạn chưa thực hiện giao dịch nào.</p>
                ) : (
                  <div className="space-y-4">
                    {payments.map((pmt) => (
                      <div key={pmt.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-gray-800">{pmt.invoice?.invoice_code || `HD-${String(pmt.invoice_id).padStart(5, "0")}`}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(pmt.paid_at)}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900 block">{formatCurrency(Number(pmt.amount))}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">{getMethodLabel(pmt.payment_method)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] text-gray-400 font-mono truncate max-w-37.5" title={pmt.transaction_code || ""}>
                            Ref: {pmt.transaction_code || "Không có"}
                          </span>
                          {getPaymentStatusBadge(pmt.status)}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <DefaultPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Method Selection Modal */}
      <Modal isOpen={payModal.isOpen} onClose={payModal.onClose} title="Lựa Chọn Phương Thức Thanh Toán">
        {activeCheckoutInvoice && (
          <form onSubmit={handleConfirmPayment} className="space-y-5 text-sm font-sans">
            <div className="bg-gray-50 p-4 border border-gray-200 space-y-2 rounded-none">
              <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                <span>Mã hóa đơn</span>
                <span>Số tiền</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800 text-base">{activeCheckoutInvoice.invoice_code}</span>
                <span className="font-black text-primary-600 text-lg">{formatCurrency(Number(activeCheckoutInvoice.total_amount))}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-650 block select-none">Phương thức thanh toán</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* VNPay */}
                <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${
                  paymentMethod === "VNPAY"
                    ? "border-primary-600 bg-primary-50/20"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === "VNPAY"}
                    onChange={() => setPaymentMethod("VNPAY")}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-xs">VNPay (ATM / Visa)</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Xử lý tự động trực tuyến</span>
                  </div>
                </label>

                {/* Manual Bank Transfer */}
                <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-primary-600 bg-primary-50/20"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={() => setPaymentMethod("BANK_TRANSFER")}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-xs">Chuyển khoản thủ công</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Quản lý duyệt giao dịch</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={payModal.onClose} disabled={isProcessing} className="rounded-none">
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isProcessing} className="rounded-none">
                {paymentMethod === "VNPAY" ? "Tới trang VNPay" : "Tiếp tục chuyển khoản"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Step 2: Manual Bank Transfer Form Modal */}
      <Modal isOpen={manualTransferModal.isOpen} onClose={manualTransferModal.onClose} title="Thông Tin Chuyển Khoản Ngân Hàng">
        {activeCheckoutInvoice && (
          <form onSubmit={handleManualSubmit} className="space-y-4 text-sm font-sans">
            <div className="flex flex-col md:flex-row gap-4 bg-blue-50 border border-blue-200 p-4 rounded-none">
              <div className="flex flex-col items-center justify-center bg-white border border-gray-200 p-2 w-40 h-40 shrink-0 self-center">
                <img
                  src={`https://img.vietqr.io/image/vietcombank-1029384756-compact.png?amount=${Number(activeCheckoutInvoice.total_amount)}&addInfo=${encodeURIComponent("YUKI " + activeCheckoutInvoice.invoice_code)}&accountName=${encodeURIComponent("CONG TY TNHH YUKI HOUSE")}`}
                  alt="VietQR Yuki House"
                  className="w-full h-full object-contain"
                />
                <span className="text-[9px] text-blue-650 font-bold mt-1 uppercase tracking-wider">Quét qua App Ngân hàng</span>
              </div>
              
              <div className="space-y-3 flex-1">
                <h5 className="font-bold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-blue-200 pb-1.5">
                  <QrCode size={16} />
                  Tài khoản thụ hưởng YuKi House
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-xs text-blue-800">
                  <div>
                    <span className="block text-blue-600">Tên ngân hàng</span>
                    <strong className="text-blue-950 font-bold">Vietcombank</strong>
                  </div>
                  <div>
                    <span className="block text-blue-600">Số tài khoản</span>
                    <strong className="text-blue-950 font-bold font-mono">1029384756</strong>
                  </div>
                  <div>
                    <span className="block text-blue-600">Chủ tài khoản</span>
                    <strong className="text-blue-950 font-bold">CONG TY TNHH YUKI HOUSE</strong>
                  </div>
                  <div>
                    <span className="block text-blue-600">Nội dung chuyển khoản</span>
                    <strong className="text-red-600 font-bold font-mono">YUKI {activeCheckoutInvoice.invoice_code}</strong>
                  </div>
                </div>
                
                <div className="pt-1.5 text-[10px] text-blue-600 italic leading-snug">
                  * Quý khách vui lòng chuyển khoản đúng số tiền <strong>{formatCurrency(Number(activeCheckoutInvoice.total_amount))}</strong> và ghi đúng nội dung để giao dịch được phê duyệt nhanh chóng.
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-650 block">Mã giao dịch / Mã tham chiếu ngân hàng</label>
              <Input
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="Nhập mã tham chiếu (ví dụ: FT204958190)"
                required
                className="rounded-none h-10.5"
                disabled={isProcessing}
              />
              <span className="text-[10px] text-gray-400 block mt-1">
                Lưu lại mã tham chiếu từ ứng dụng ngân hàng sau khi thực hiện chuyển khoản thành công.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={manualTransferModal.onClose} disabled={isProcessing} className="rounded-none">
                Quay lại
              </Button>
              <Button type="submit" disabled={isProcessing} className="rounded-none">
                {isProcessing ? "Đang gửi..." : "Tôi đã chuyển khoản"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
