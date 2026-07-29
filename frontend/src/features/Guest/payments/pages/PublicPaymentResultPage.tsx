import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Home, ArrowLeft, CreditCard } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { useUserRole } from "../../../../hooks/useUserRole";

export default function PublicPaymentResultPage() {
  const [searchParams] = useSearchParams();
  const { role, isTenant } = useUserRole();
  const paymentStatus = searchParams.get("payment_status");
  const responseCode = searchParams.get("response_code");

  const isSuccess = paymentStatus === "SUCCESS" || responseCode === "00";
  const isCancelled = paymentStatus === "CANCELLED" || responseCode === "24";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans pt-20 pb-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-6 sm:p-8 text-center space-y-6">
        {isSuccess ? (
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
        ) : isCancelled ? (
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
        ) : (
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={40} />
          </div>
        )}

        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isSuccess
              ? "Thanh Toán Thành Công!"
              : isCancelled
              ? "Đã Hủy Giao Dịch"
              : "Thanh Toán Thất Bại"}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSuccess
              ? "Giao dịch thanh toán tiền cọc/hóa đơn đã được ghi nhận thành công. Vui lòng kiểm tra thông tin hoặc Email xác nhận."
              : isCancelled
              ? "Bạn đã hủy thao tác thanh toán trên cổng VNPay."
              : "Thao tác thanh toán không thành công. Vui lòng kiểm tra lại tài khoản ngân hàng hoặc thử lại sau."}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {role ? (
            <Link to={isTenant ? "/tenant/payments" : "/admin/payments"} className="w-full">
              <Button className="w-full justify-center">
                <CreditCard size={16} /> Về Quản lý Thanh toán
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full justify-center">
                  <Home size={16} /> Trang chủ
                </Button>
              </Link>
              <Link to="/apartments" className="w-full sm:w-auto">
                <Button className="w-full justify-center">
                  <ArrowLeft size={16} /> Danh sách căn hộ
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
