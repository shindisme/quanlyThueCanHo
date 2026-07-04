import {
  Home as HomeIcon, FileText, Receipt, MapPin, Maximize2,
  Calendar, CreditCard, ArrowUpRight, Wrench, Users, Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTenantHome } from "../../../hooks/tenant/useTenantHome";
import { formatCurrency } from "../../../utils/currency";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

export default function TenantHome() {
  const {
    displayName,
    occupants,
    activeContract,
    apartment,
    building,
    isLoading
  } = useTenantHome();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải tổng quan...</span>
      </div>
    );
  }

  const daysUntilExpiry = activeContract?.end_date
    ? Math.ceil((new Date(activeContract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-gray-800">
          Xin chào, <span className="text-primary-600">{displayName}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Thông tin tổng quan nơi cư trú của bạn</p>
      </div>

      {/* APARTMENT INFO */}
      <div className="bg-white rounded-none border border-gray-200 p-5 shadow-md">
        {activeContract ? (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-none flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
              <HomeIcon size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Căn hộ của bạn</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold text-primary-600">
                      P.{apartment?.room_number || "-"} Tầng {apartment?.floor || "-"}
                    </span>
                    {" "}- {apartment?.description || "Căn hộ của bạn"}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-success-50 text-success-600 font-semibold">
                  Đang thuê
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  <span className="truncate">{building?.branch_name || building?.name || "Yuki House"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Maximize2 size={15} className="text-gray-400 shrink-0" />
                  <span>{apartment?.area || "-"} m² · Tầng {apartment?.floor || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={15} className="text-gray-400 shrink-0" />
                  <span>{formatCurrency(activeContract.monthly_rent || apartment?.rental_price || 0)}/tháng</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={15} className="text-gray-400 shrink-0" />
                  <span>{daysUntilExpiry > 0 ? `Còn ${daysUntilExpiry} ngày` : "Đã hết hạn"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <HomeIcon size={40} className="mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-sm">Bạn chưa có hợp đồng thuê căn hộ nào đang hoạt động.</p>
            <p className="text-xs text-gray-400 mt-1">Liên hệ với ban quản lý nếu có thắc mắc.</p>
          </div>
        )}
      </div>

      {/* QUICK SHORTCUT ACTIONS */}
      <div className="bg-white rounded-none border border-gray-200 p-5 shadow-md">
        <h4 className="font-semibold text-gray-800 mb-4">Lối tắt chức năng</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Link to="/tenant/contracts" className="p-4 border border-gray-105 rounded-none shadow-sm hover:bg-primary-50/30 hover:border-primary-200 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Hợp đồng của tôi</span>
          </Link>

          <Link to="/tenant/invoices" className="p-4 border border-gray-105 rounded-none shadow-sm hover:bg-warning-50/30 hover:border-warning-200 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-warning-50 text-warning-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Hóa đơn</span>
          </Link>

          <Link to="/tenant/utilities" className="p-4 border border-gray-105 rounded-none shadow-sm hover:bg-emerald-50/30 hover:border-emerald-200 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Điện nước</span>
          </Link>

          <Link to="/tenant/maintenance" className="p-4 border border-gray-105 rounded-none shadow-sm hover:bg-danger-50/30 hover:border-danger-200 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Yêu cầu sửa chữa</span>
          </Link>

          <Link to="/tenant/profile" className="p-4 border border-gray-105 rounded-none shadow-sm hover:bg-info-50/30 hover:border-info-200 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-full bg-info-50 text-info-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-700">Hồ sơ & Người ở</span>
          </Link>
        </div>
      </div>

      {/* ROOMMATES */}
      <div className="bg-white rounded-none border border-gray-200 p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-none flex items-center justify-center animate-pulse-dot">
              <Users size={20} className="text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Thành viên cùng căn hộ</h4>
              <p className="text-xs text-gray-400">Danh sách người ở cùng đã khai báo</p>
            </div>
          </div>
          <Link to="/tenant/profile"
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 cursor-pointer">
            Khai báo thêm <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="border-t border-gray-100 pt-4">
          {occupants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {occupants.map((occ) => (
                <div key={occ.id} className="p-3 border border-gray-100 rounded-none bg-gray-50/50 flex flex-col justify-center shadow-sm">
                  <p className="text-sm font-semibold text-gray-850">{occ.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <span>CCCD: {occ.cccd}</span>
                    {occ.phone && <span>SĐT: {occ.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-450">
              <Users size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-xs">Chưa khai báo người ở cùng nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
