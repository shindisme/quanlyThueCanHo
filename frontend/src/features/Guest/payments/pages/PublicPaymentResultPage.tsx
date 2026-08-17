import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Home, ArrowLeft, CreditCard } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { usePublicPaymentResult } from "../hooks/usePublicPaymentResult";

export default function PublicPaymentResultPage() {
  const { status, title, description, dashboardUrl } = usePublicPaymentResult();
  const isSuccess = status === "success";
  const isCancelled = status === "cancelled";

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
            {title}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {dashboardUrl ? (
            <Link to={dashboardUrl} className="w-full">
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
