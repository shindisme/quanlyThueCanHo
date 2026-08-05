import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Home, ArrowLeft, ShieldCheck, Calendar, MapPin, Building2, CreditCard } from "lucide-react";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import { formatCurrency } from "../../../../utils/currency";
import { formatDate } from "../../../../utils/date";

export default function PublicDepositSuccessPage() {
  const [searchParams] = useSearchParams();

  const invoiceCode = searchParams.get("invoice_code") || searchParams.get("vnp_TxnRef") || "DEP-SUCCESS";
  const amount = searchParams.get("amount") ? Number(searchParams.get("amount")) : 5000000;
  const roomNumber = searchParams.get("room") || searchParams.get("room_number") || "P.102";
  const branchName = searchParams.get("branch") || "Chi nhánh Trung tâm";
  const customerName = searchParams.get("customer") || "Khách hàng đặt cọc";
  const expiresAt = searchParams.get("expires_at") || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans pt-20 pb-16">
      <div className="max-w-lg w-full space-y-6">
        <Card className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-6 border border-emerald-100">
          {/* Icon thành công */}
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={48} className="animate-bounce" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
              Xác nhận tiền cọc thành công
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
              Đặt Cọc Giữ Phòng Thành Công!
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cảm ơn <span className="font-bold text-gray-800">{customerName}</span>. Tiền đặt cọc giữ vị trí căn hộ của bạn đã được ghi nhận vào hệ thống.
            </p>
          </div>

          {/* Chi tiết phiếu cọc */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <CreditCard size={14} className="text-primary-600" /> Mã giao dịch / Hóa đơn:
              </span>
              <span className="font-bold text-gray-800 text-sm font-mono">{invoiceCode}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Building2 size={14} className="text-primary-600" /> Căn hộ đặt cọc:
              </span>
              <span className="font-bold text-primary-700 text-sm">{roomNumber} ({branchName})</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" /> Số tiền đã cọc:
              </span>
              <span className="font-bold text-emerald-600 text-base">{formatCurrency(amount)}</span>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-600" /> Hạn giữ phòng (Hạn ký HĐ):
              </span>
              <span className="font-bold text-amber-700">{formatDate(expiresAt)}</span>
            </div>
          </div>

          {/* Hướng dẫn tiếp theo */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-left space-y-1">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1">
              📌 Lưu ý cho người đặt cọc:
            </h4>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Quản lý căn hộ sẽ liên hệ với bạn trong vòng 24h để làm thủ tục ký hợp đồng thuê chính thức. Vui lòng chuẩn bị sẵn CCCD để hoàn tất hợp đồng trước ngày {formatDate(expiresAt)}.
            </p>
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/apartments" className="w-full sm:w-auto flex-1">
              <Button variant="outline" className="w-full justify-center rounded-xl">
                <ArrowLeft size={16} /> Danh sách căn hộ
              </Button>
            </Link>
            <Link to="/system/login" className="w-full sm:w-auto flex-1">
              <Button className="w-full justify-center rounded-xl bg-primary-600 hover:bg-primary-700">
                <Home size={16} /> Đăng nhập hệ thống
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
