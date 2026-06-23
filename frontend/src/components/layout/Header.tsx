import { Bell, Menu, LogOut, User, ChevronDown, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { useSidebarStore } from "../../stores/sidebar.store";
import * as buildingService from "../../services/buildingService";
import * as apartmentService from "../../services/apartmentService";
import { formatApartmentDisplay } from "../../utils/format";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function Header() {
  const { email, role, token, logout, managedBuildingName: storeBuildingName } = useAuthStore();
  const { setMobileOpen, toggle } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [managedBuildingName, setManagedBuildingName] = useState<string | null>(storeBuildingName);

  const [userFullName, setUserFullName] = useState<string>(
    role === "ADMIN" ? "Quản trị viên" : role === "MANAGER" ? "Quản lý" : "Người thuê"
  );
  const [accountUsername, setAccountUsername] = useState<string>(
    email?.split("@")[0] || "User"
  );

  useEffect(() => {
    if (!token) return;
    const decoded = parseJwt(token);
    if (!decoded || !decoded.userId) return;

    async function loadUserProfile() {
      try {
        if (role === "MANAGER") {
          const { getAllStaff } = await import("../../services/staffService");
          const staffRes = await getAllStaff();
          const currentStaff = staffRes.data.find((s) => s.user_id === decoded.userId);
          if (currentStaff) {
            setUserFullName(currentStaff.full_name);
            if (currentStaff.user?.username) {
              setAccountUsername(currentStaff.user.username);
            }
          }
        } else if (role === "TENANT") {
          const { getAllTenants } = await import("../../services/tenantService");
          const tenantsRes = await getAllTenants({ limit: 1000 });
          const currentTenant = tenantsRes.data.find((t) => t.user_id === decoded.userId);
          if (currentTenant) {
            setUserFullName(currentTenant.full_name);
            if (currentTenant.user?.username) {
              setAccountUsername(currentTenant.user.username);
            }
          }
        } else if (role === "ADMIN") {
          setUserFullName("Quản trị viên");
          setAccountUsername("admin");
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin chi tiết người dùng:", err);
      }
    }

    loadUserProfile();
  }, [token, role]);

  // Lưu infor cho breadcrum toà nhà và căn hộ
  const [dynamicBuildingName, setDynamicBuildingName] = useState<string | null>(null);
  const [dynamicApartmentName, setDynamicApartmentName] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (storeBuildingName) {
      setManagedBuildingName(storeBuildingName);
      return;
    }
    async function fetchManagedBuilding() {
      if (role === "MANAGER" && token) {
        try {
          const decoded = parseJwt(token);
          if (decoded && decoded.userId) {
            const { getAllStaff } = await import("../../services/staffService");
            const { getAllBuildings } = await import("../../services/buildingService");
            const staffRes = await getAllStaff();
            const currentStaff = staffRes.data.find((s) => s.user_id === decoded.userId);
            if (currentStaff && currentStaff.building_id) {
              const buildingsRes = await getAllBuildings();
              const currentBld = buildingsRes.data.find((b) => b.id === currentStaff.building_id);
              if (currentBld) {
                setManagedBuildingName(currentBld.branch_name);
              }
            }
          }
        } catch (error) {
          console.error("Lỗi tải danh sách tòa nhà", error);
        }
      }
    }
    fetchManagedBuilding();
  }, [role, token, storeBuildingName]);

  // Lấy tên tòa nhà/căn hộ động Breadcrumb
  useEffect(() => {
    setDynamicBuildingName(null);
    setDynamicApartmentName(null);

    async function fetchDynamicNames() {
      const parts = location.pathname.split("/").filter(Boolean);
      const isBuildingDetail = location.pathname.includes("/buildings/") && parts.length > 2;
      const isApartmentDetail = location.pathname.includes("/apartments/") && parts.length > 2;

      if (isBuildingDetail) {
        const idStr = parts[parts.length - 1];
        const id = Number(idStr);
        if (!isNaN(id)) {
          try {
            const b = await buildingService.getBuildingById(id);
            if (b) {
              setDynamicBuildingName(b.branch_name);
            }
          } catch (error) {
            console.error("Lỗi lấy thông tin tòa nhà cho breadcrumb", error);
            setDynamicBuildingName(null);
          }
        }
      } else {
        setDynamicBuildingName(null);
      }

      if (isApartmentDetail) {
        const idStr = parts[parts.length - 1];
        const id = Number(idStr);
        if (!isNaN(id)) {
          try {
            const apt = await apartmentService.getApartmentById(id);
            if (apt) {
              const name = formatApartmentDisplay(
                apt.room_number,
                apt.floor,
                role || undefined,
                apt.building?.branch_name
              );
              setDynamicApartmentName(name);
            }
          } catch (error) {
            console.error("Lỗi lấy thông tin căn hộ cho breadcrumb", error);
            setDynamicApartmentName(null);
          }
        }
      } else {
        setDynamicApartmentName(null);
      }
    }

    fetchDynamicNames();
  }, [location.pathname, role]);

  const roleLabel =
    role === "ADMIN" ? "Quản trị viên"
      : role === "MANAGER" ? (managedBuildingName ? `Quản lý: ${managedBuildingName}` : "Quản lý")
        : "Người thuê";

  function getBreadcrumb() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return null;

    const labels: Record<string, string> = {
      dashboard: "Dashboard",
      buildings: "Tòa nhà",
      apartments: "Căn hộ",
      tenants: "Người thuê",
      staff: "Nhân viên",
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

    return parts.slice(1).map((p) => {
      if (location.pathname.includes("/buildings/") && !isNaN(Number(p))) {
        return dynamicBuildingName
      }
      if (location.pathname.includes("/apartments/") && !isNaN(Number(p))) {
        return dynamicApartmentName;
      }
      return labels[p] || p;
    });
  }

  function handleLogout() {
    logout();
    navigate("/system/login");
  }

  const breadcrumbParts = getBreadcrumb();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left side */}
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

        {/* Breadcrumb*/}
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

      {/*Right side*/}
      <div className="flex items-center gap-1">
        {role === "MANAGER" && managedBuildingName && (
          <div className="hidden md:flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold border border-primary-100 mr-2">
            Chi nhánh: {managedBuildingName}
          </div>
        )}
        {/* Notification */}
        <button
          onClick={() => navigate(`/${role?.toLowerCase()}/notifications`)}
          className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
          title="Thông báo"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger-500 rounded-full animate-pulse-dot" />
        </button>

        {/* Separator*/}
        <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2" />

        {/* USER DROPDOWN */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-gray-200 text-gray-400 border border-gray-300">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{userFullName}</p>
              <p className="text-[11px] text-gray-400">{roleLabel}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown menu */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-gray-200 z-50 py-1 animate-scale-in"
              style={{ boxShadow: "var(--shadow-dropdown)" }}>
              {/* User info  */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{userFullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{accountUsername}</p>
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
