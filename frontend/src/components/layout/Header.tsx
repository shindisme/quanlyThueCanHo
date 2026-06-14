import { Bell, Menu, LogOut, User, ChevronDown, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { useSidebarStore } from "../../stores/sidebar.store";



export default function Header() {
  const { email, role, logout } = useAuthStore();
  const { setMobileOpen, toggle } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = email?.split("@")[0] || "User";
  const roleLabel =
    role === "ADMIN" ? "Quản trị viên"
      : role === "MANAGER" ? "Quản lý"
        : "Người thuê";

  function getBreadcrumb() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return null;

    const labels: Record<string, string> = {
      dashboard: "Dashboard",
      buildings: "Tòa nhà",
      apartments: "Căn hộ",
      tenants: "Người thuê",
      contracts: "Hợp đồng",
      invoices: "Hóa đơn",
      payments: "Thanh toán",
      maintenance: "Sửa chữa",
      schedules: "Lịch xem phòng",
      utilities: "Điện nước",
      notifications: "Thông báo",
      users: "Tài khoản",
      reports: "Báo cáo",
      settings: "Cài đặt",
      profile: "Hồ sơ",
      home: "Trang chủ",
    };

    return parts.slice(1).map((p) => labels[p] || p);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const breadcrumbParts = getBreadcrumb();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* ===== BÊN TRÁI: Hamburger + Breadcrumb ===== */}
      <div className="flex items-center gap-3">
        {/* Hamburger */}
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen(true);
            } else {
              toggle();
            }
          }}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb - ArchitectUI style */}
        {breadcrumbParts && breadcrumbParts.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            {breadcrumbParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-300">/</span>}
                <span className={i === breadcrumbParts.length - 1
                  ? "text-gray-800 font-medium"
                  : "text-gray-400"
                }>
                  {part}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ===== BÊN PHẢI: Notification + Profile ===== */}
      <div className="flex items-center gap-1">
        {/* Notification bell - ArchitectUI style (có dot đỏ nhấp nháy) */}
        <button
          onClick={() => navigate(`/${role?.toLowerCase()}/notifications`)}
          className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
          title="Thông báo"
        >
          <Bell size={20} />
          {/* Dot đỏ nhấp nháy - ArchitectUI */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger-500 rounded-full animate-pulse-dot" />
        </button>

        {/* Separator - ArchitectUI có đường kẻ dọc trước avatar */}
        <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2" />

        {/* ===== USER DROPDOWN - ArchitectUI style ===== */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Avatar vuông bo góc với hình mặc định Facebook */}
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-gray-200 text-gray-400 border border-gray-300">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            {/* Tên + Role */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{displayName}</p>
              <p className="text-[11px] text-gray-400">{roleLabel}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown menu */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-gray-200 z-50 py-1 animate-scale-in"
              style={{ boxShadow: "var(--shadow-dropdown)" }}>
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setShowProfile(false); navigate(`/${role?.toLowerCase()}/profile`); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  Hồ sơ cá nhân
                </button>
                {role === "ADMIN" && (
                  <button
                    onClick={() => { setShowProfile(false); navigate("/admin/settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Cài đặt
                  </button>
                )}
              </div>

              <hr className="border-gray-100" />

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 cursor-pointer transition-colors"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
