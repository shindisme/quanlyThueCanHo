import { Bell, Menu, LogOut, User, ChevronDown, Settings } from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { useSidebarStore } from "../stores/sidebar.store";
import * as buildingService from "../services/buildingService";
import * as apartmentService from "../services/apartmentService";
import { formatApartmentDisplay } from "../utils/string";
import Avatar from "./ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/DropdownMenu";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/Breadcrumb";

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
  } catch {
    return null;
  }
}

export default function Header() {
  const { email, role, token, logout, managedBuildingName: storeBuildingName } = useAuthStore();
  const { setMobileOpen, toggle } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();

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
    const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;
    if (!userId) return;

    async function loadUserProfile() {
      try {
        if (role === "MANAGER") {
          const { getAllStaff } = await import("../services/staffService");
          const staffRes = await getAllStaff();
          const currentStaff = staffRes.data.find((s) => s.user_id === userId);
          if (currentStaff) {
            setUserFullName(currentStaff.full_name);
            if (currentStaff.user?.username) {
              setAccountUsername(currentStaff.user.username);
            }
          }
        } else if (role === "TENANT") {
          const { getAllContracts } = await import("../services/contractService");
          const contracts = await getAllContracts();
          if (contracts && contracts.length > 0) {
            const currentTenant = contracts[0].tenant;
            if (currentTenant) {
              setUserFullName(currentTenant.full_name);
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
    if (storeBuildingName) {
      setManagedBuildingName(storeBuildingName);
      return;
    }
    async function fetchManagedBuilding() {
      if (role === "MANAGER" && token) {
        try {
          const decoded = parseJwt(token);
          const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;
          if (userId) {
            const { getAllStaff } = await import("../services/staffService");
            const { getAllBuildings } = await import("../services/buildingService");
            const staffRes = await getAllStaff();
            const currentStaff = staffRes.data.find((s) => s.user_id === userId);
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
    <header className="sticky top-0 z-10 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
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
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {breadcrumbParts.map((part, i) => {
                const isLast = i === breadcrumbParts.length - 1;
                return (
                  <Fragment key={i}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{part}</BreadcrumbPage>
                      ) : (
                        <span className="text-gray-400">{part}</span>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {/*Right side*/}
      <div className="flex items-center gap-1">
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
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left">
            <Avatar name={userFullName} className="w-9 h-9 border border-gray-300 shrink-0" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-tight">{userFullName}</p>
              <p className="text-[11px] text-gray-400">{roleLabel}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 mt-2">
            {/* User info */}
            <div className="px-3 py-2 border-b border-gray-100 mb-1">
              <p className="text-sm font-semibold text-gray-800">{userFullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{accountUsername}</p>
            </div>

            {/* Menu items */}
            <DropdownMenuItem
              onClick={() => navigate(`/${role?.toLowerCase()}/profile`)}
              className="gap-3 px-3 py-2"
            >
              <User size={16} className="text-gray-400" />
              Hồ sơ cá nhân
            </DropdownMenuItem>

            {role === "ADMIN" && (
              <DropdownMenuItem
                onClick={() => navigate("/admin/settings")}
                className="gap-3 px-3 py-2"
              >
                <Settings size={16} className="text-gray-400" />
                Cài đặt
              </DropdownMenuItem>
            )}

            <div className="h-px bg-gray-100 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-3 px-3 py-2 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
            >
              <LogOut size={16} />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
