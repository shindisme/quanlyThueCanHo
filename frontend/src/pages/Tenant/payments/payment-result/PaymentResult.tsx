import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, FileText, Home } from "lucide-react";
import Button from "../../../../components/ui/Button";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get("status");
  const invoiceId = searchParams.get("invoice_id");
  const paymentId = searchParams.get("payment_id");

  const isSuccess = status === "SUCCESS";

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-4 font-sans">
      <div className="w-full max-w-md bg-white border border-gray-250 shadow-2xl p-8 text-center rounded-none relative overflow-hidden">
        {/* Decorative Top Bar */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${isSuccess ? "bg-green-500" : "bg-red-500"}`} />

        {isSuccess ? (
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-500">
              <CheckCircle size={48} className="animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Thanh Toán Thành Công!</h2>
              <p className="text-sm text-gray-500">
                Giao dịch của bạn đã được xử lý và ghi nhận thành công trên hệ thống.
              </p>
            </div>

            {/* Details */}
            <div className="bg-gray-50 border border-gray-150 p-4 space-y-2.5 text-xs text-left">
              {invoiceId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Mã Hóa Đơn:</span>
                  <span className="font-bold text-gray-800">HD-{invoiceId.padStart(5, "0")}</span>
                </div>
              )}
              {paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Mã Giao Dịch:</span>
                  <span className="font-bold text-gray-850 font-mono">TXN-{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Phương Thức:</span>
                <span className="font-bold text-gray-850">Cổng VNPay</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Trạng Thái:</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold uppercase rounded-md text-[10px]">
                  Đã tất toán
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500">
              <XCircle size={48} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Thanh Toán Thất Bại</h2>
              <p className="text-sm text-gray-500">
                Đã xảy ra lỗi trong quá trình thực hiện thanh toán trực tuyến qua VNPay.
              </p>
            </div>

            <div className="bg-red-50/50 border border-red-100 p-4 flex gap-3 text-left">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-bold">Lý do có thể xảy ra:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Khách hàng hủy giao dịch tại cổng VNPay.</li>
                  <li>Số dư tài khoản ngân hàng không đủ thanh toán.</li>
                  <li>Nhập sai mã xác thực OTP hoặc thông tin thẻ.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            onClick={() => navigate("/tenant/invoices")}
            className="w-full flex items-center justify-center gap-2 font-bold py-2.5 shadow-sm"
          >
            <FileText size={16} />
            <span>Quay lại trang Hóa đơn</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/tenant/home")}
            className="w-full flex items-center justify-center gap-2 font-bold py-2.5"
          >
            <Home size={16} />
            <span>Trở về Trang chủ</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
