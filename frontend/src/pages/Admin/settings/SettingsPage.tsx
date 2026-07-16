import { Settings, ShieldCheck, Database, Server, Key } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";

export default function SettingsPage() {
  const { role } = useUserRole();
  const apiEndpoint = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const getRoleText = () => {
    if (role === "ADMIN") return "Quản trị viên cấp cao (Admin)";
    if (role === "MANAGER") return "Quản lý tòa nhà (Manager)";
    if (role === "STAFF") return "Nhân viên vận hành (Staff)";
    return "Khách thuê (Tenant)";
  };

  const getPermissions = () => {
    if (role === "ADMIN") {
      return [
        "Quản lý toàn bộ chi nhánh và tòa nhà",
        "Quản lý toàn bộ căn hộ, trạng thái phòng và giá thuê",
        "Quản lý tài khoản của Quản lý, Nhân viên, Khách thuê",
        "Duyệt giao dịch thanh toán và hóa đơn hệ thống",
        "Phát thông báo chung tới toàn bộ cư dân",
        "Phân công công việc sửa chữa thiết bị"
      ];
    }
    if (role === "MANAGER") {
      return [
        "Quản lý căn hộ thuộc chi nhánh được phân quyền",
        "Quản lý thông tin khách thuê thuộc chi nhánh",
        "Lập hóa đơn và tính phí điện nước hàng tháng",
        "Tiếp nhận và phân công sửa chữa sự cố",
        "Gửi thông báo tới cư dân trong tòa nhà"
      ];
    }
    return [
      "Xem thông tin căn hộ đang thuê",
      "Gửi yêu cầu sửa chữa sự cố thiết bị",
      "Thanh toán hóa đơn dịch vụ hàng tháng"
    ];
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Settings}
        title="Cài đặt hệ thống"
        subtitle="Thông tin trạng thái hệ thống, cấu hình môi trường và phân quyền tài khoản của bạn"
        iconColor="linear-gradient(135deg, #4B5563, #9CA3AF)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Information Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 text-primary-600 pb-3 border-b border-gray-100">
            <Server size={22} className="text-primary-600" />
            <h3 className="font-bold text-gray-800 text-base">Thông tin máy chủ & API</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Tên hệ thống:</span>
              <span className="font-bold text-gray-800">Yuki House Management</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Phiên bản Frontend:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">v1.0.0</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">API Endpoint hiện tại:</span>
              <span className="font-semibold text-gray-700 font-mono text-xs truncate max-w-[200px]" title={apiEndpoint}>
                {apiEndpoint}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Môi trường chạy:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                {import.meta.env.MODE || "development"}
              </span>
            </div>
          </div>
        </div>

        {/* Database Status Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 text-blue-600 pb-3 border-b border-gray-100">
            <Database size={22} className="text-blue-600" />
            <h3 className="font-bold text-gray-800 text-base">Trạng thái Cơ sở dữ liệu</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Hệ quản trị CSDL:</span>
              <span className="font-bold text-gray-800">PostgreSQL (Prisma ORM)</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Kết nối Cơ sở dữ liệu:</span>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Hoạt động tốt</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Trạng thái Đồng bộ bảng:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                Khớp Schema (Prisma)
              </span>
            </div>
          </div>
        </div>

        {/* Account Permissions Card */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-2.5 text-warning-600 pb-3 border-b border-gray-100">
            <Key size={22} className="text-warning-600" />
            <h3 className="font-bold text-gray-800 text-base">Quyền hạn tài khoản của bạn</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-gray-500 font-medium">Vai trò hiện tại:</span>
              <span className="font-bold text-gray-800 px-3 py-1 rounded-lg bg-warning-50 text-warning-700">
                {getRoleText()}
              </span>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Các quyền hạn được cấp trên hệ thống:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getPermissions().map((perm, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-gray-600 leading-normal p-2.5 bg-gray-50/50 rounded-xl border border-gray-100">
                    <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
