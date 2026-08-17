import { Link } from "react-router-dom";
import { FileText, Receipt, Zap, Wrench, Users } from "lucide-react";

export default function DashboardShortcuts() {
  return (
    <section className="w-full rounded-none border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-3 sm:mb-4">Lối tắt chức năng</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Link
          to="/tenant/contracts"
          className="p-3 sm:p-4 border border-gray-100 rounded-2xl shadow-sm hover:bg-primary-50/30 hover:border-primary-200 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText size={18} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Hợp đồng của tôi</span>
        </Link>

        <Link
          to="/tenant/invoices"
          className="p-3 sm:p-4 border border-gray-100 rounded-2xl shadow-sm hover:bg-warning-50/30 hover:border-warning-200 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-warning-50 text-warning-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt size={18} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Hóa đơn</span>
        </Link>

        <Link
          to="/tenant/utilities"
          className="p-3 sm:p-4 border border-gray-100 rounded-2xl shadow-sm hover:bg-emerald-50/30 hover:border-emerald-200 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap size={18} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Điện nước</span>
        </Link>

        <Link
          to="/tenant/maintenance"
          className="p-3 sm:p-4 border border-gray-100 rounded-2xl shadow-sm hover:bg-danger-50/30 hover:border-danger-200 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wrench size={18} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Yêu cầu sửa chữa</span>
        </Link>

        <Link
          to="/tenant/profile"
          className="p-3 sm:p-4 border border-gray-100 rounded-2xl shadow-sm hover:bg-info-50/30 hover:border-info-200 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-info-50 text-info-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={18} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Hồ sơ & Người ở</span>
        </Link>
      </div>
    </section>
  );
}
