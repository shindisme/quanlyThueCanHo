import {
  Home, FileText, Receipt, Bell, MapPin, Maximize2,
  Calendar, CreditCard, ArrowUpRight, Wrench, Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

// ============================================================
// TENANT HOME - DashboardPack Style
// ============================================================
// Trang chủ người thuê: greeting, thông tin căn hộ, hóa đơn,
// hợp đồng, thông báo, yêu cầu sửa chữa gần đây

const mockContract = {
  apartment_code: "A-1205",
  title: "Căn hộ 2 phòng ngủ cao cấp",
  building: "YuKi Tower A",
  address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  area: 65,
  floor: 12,
  start_date: "2026-01-15",
  end_date: "2027-01-15",
  monthly_rent: 9500000,
  status: "ACTIVE",
};

const mockInvoice = {
  invoice_code: "INV-2026-06-001",
  total_amount: 11200000,
  due_date: "2026-06-30",
  status: "UNPAID",
  details: [
    { label: "Tiền thuê", amount: 9500000 },
    { label: "Điện", amount: 850000 },
    { label: "Nước", amount: 350000 },
    { label: "Dịch vụ", amount: 500000 },
  ],
};

const mockNotifications = [
  { id: 1, title: "Hóa đơn tháng 6 đã được tạo", time: "2 giờ trước", is_read: false },
  { id: 2, title: "Lịch bảo trì thang máy ngày 15/06", time: "1 ngày trước", is_read: false },
  { id: 3, title: "Thông báo họp cư dân cuối tháng", time: "3 ngày trước", is_read: true },
];

const mockMaintenance = [
  { id: 1, title: "Sửa vòi nước phòng tắm", status: "IN_PROGRESS", date: "10/06/2026" },
  { id: 2, title: "Thay bóng đèn hành lang", status: "COMPLETED", date: "05/06/2026" },
];

export default function TenantHome() {
  const { email } = useAuthStore();
  const displayName = email?.split("@")[0] || "Bạn";

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  // Tính số ngày còn lại đến hạn hóa đơn
  const daysUntilDue = Math.ceil(
    (new Date(mockInvoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Tính số ngày còn lại hợp đồng
  const daysUntilExpiry = Math.ceil(
    (new Date(mockContract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* ===== GREETING ===== */}
      <div className="rounded-lg p-6 text-white"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)" }}>
        <h1 className="text-2xl font-bold mb-1">Xin chào, {displayName}! 👋</h1>
        <p className="text-purple-200 text-sm">Chào mừng bạn quay trở lại YuKi House</p>
      </div>

      {/* ===== APARTMENT INFO ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
            <Home size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Căn hộ của bạn</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-primary-600">{mockContract.apartment_code}</span>
                  {" "}- {mockContract.title}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-success-50 text-success-600 font-semibold">
                Đang thuê
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{mockContract.building}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Maximize2 size={15} className="text-gray-400 flex-shrink-0" />
                <span>{mockContract.area} m² · Tầng {mockContract.floor}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard size={15} className="text-gray-400 flex-shrink-0" />
                <span>{formatCurrency(mockContract.monthly_rent)}/tháng</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={15} className="text-gray-400 flex-shrink-0" />
                <span>Còn {daysUntilExpiry} ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CARDS ROW ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hóa đơn tháng này */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
                <Receipt size={20} className="text-warning-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Hóa đơn tháng 6</h4>
            </div>
            <Link to="/tenant/invoices" className="text-primary-600 hover:text-primary-700">
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <p className="text-2xl font-bold text-gray-800 mb-2">
            {formatCurrency(mockInvoice.total_amount)}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning-50 text-warning-600 font-medium">
              Chưa thanh toán
            </span>
            <span className="text-xs text-gray-400">
              Còn {daysUntilDue} ngày
            </span>
          </div>

          {/* Chi tiết hóa đơn */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            {mockInvoice.details.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{d.label}</span>
                <span className="text-gray-700 font-medium">{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hợp đồng */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-success-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Hợp đồng</h4>
            </div>
            <Link to="/tenant/contracts" className="text-primary-600 hover:text-primary-700">
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-success-50 text-success-600 font-semibold">
            Hiệu lực
          </span>

          <div className="space-y-3 mt-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Thời hạn</p>
              <p className="text-sm text-gray-700">
                {new Date(mockContract.start_date).toLocaleDateString("vi-VN")}
                {" → "}
                {new Date(mockContract.end_date).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Tiền thuê hàng tháng</p>
              <p className="text-sm font-semibold text-gray-800">{formatCurrency(mockContract.monthly_rent)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Còn lại</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                <div className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, (1 - daysUntilExpiry / 365) * 100))}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{daysUntilExpiry} ngày</p>
            </div>
          </div>
        </div>

        {/* Thông báo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info-50 rounded-lg flex items-center justify-center">
                <Bell size={20} className="text-info-600" />
              </div>
              <h4 className="font-semibold text-gray-800">Thông báo mới</h4>
            </div>
            <Link to="/tenant/notifications" className="text-primary-600 hover:text-primary-700">
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="space-y-3">
            {mockNotifications.map((n) => (
              <div key={n.id} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  n.is_read ? "bg-gray-300" : "bg-primary-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${
                    n.is_read ? "text-gray-500" : "text-gray-800 font-medium"
                  }`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== YÊU CẦU SỬA CHỮA GẦN ĐÂY ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-danger-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Yêu cầu sửa chữa</h4>
              <p className="text-xs text-gray-400">Gần đây</p>
            </div>
          </div>
          <Link to="/tenant/maintenance"
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Xem tất cả <ArrowUpRight size={12} />
          </Link>
        </div>

        <div className="space-y-3">
          {mockMaintenance.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-700">{m.title}</p>
                  <p className="text-xs text-gray-400">{m.date}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                m.status === "COMPLETED"
                  ? "bg-success-50 text-success-600"
                  : "bg-warning-50 text-warning-600"
              }`}>
                {m.status === "COMPLETED" ? "Hoàn thành" : "Đang xử lý"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
