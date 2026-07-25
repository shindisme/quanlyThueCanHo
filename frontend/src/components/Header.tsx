import { Bell, Menu, LogOut, User, ChevronDown, Mail, Info, Wrench, Receipt, ArrowRight } from "lucide-react";
import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth.store";
import { useSidebarStore } from "../stores/sidebar.store";
import * as buildingService from "../services/buildingService";
import * as apartmentService from "../services/apartmentService";
import * as notificationService from "../services/notificationService";
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

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function getNotifIcon(type: string) {
  if (type === "INVOICE") return <Receipt size={14} className="text-emerald-600" />;
  if (type === "MAINTENANCE") return <Wrench size={14} className="text-amber-600" />;
  if (type === "SYSTEM") return <Info size={14} className="text-blue-600" />;
  return <Mail size={14} className="text-gray-500" />;
}

function getNotifIconBg(type: string) {
  if (type === "INVOICE") return "bg-emerald-50";
  if (type === "MAINTENANCE") return "bg-amber-50";
  if (type === "SYSTEM") return "bg-blue-50";
  return "bg-gray-100";
}

export default function Header() {
  const { email, role, token, logout, managedBuildingName: storeBuildingName } = useAuthStore();
  const { setMobileOpen, toggle } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [managedBuildingName, setManagedBuildingName] = useState<string | null>(storeBuildingName);

  const [userFullName, setUserFullName] = useState<string>(
    role === "ADMIN" ? "Quản trị viên" : role === "MANAGER" ? "Quản lý" : role === "STAFF" ? "Nhân viên" : "Người thuê"
  );
  const [accountUsername, setAccountUsername] = useState<string>(
    email?.split("@")[0] || "User"
  );

  // Notification Popover State
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifBtnRef = useRef<HTMLButtonElement | null>(null);

  const { data: notifData } = useQuery({
    queryKey: ["header-notifications"],
    queryFn: () => notificationService.getAllNotifications({ limit: 5 }),
    refetchInterval: 30000, // Poll every 30s
    enabled: !!token && (role === "ADMIN" || role === "MANAGER" || role === "STAFF" || role === "TENANT"),
  });

  const headerNotifications = notifData?.data || [];
  const unreadCount = headerNotifications.filter((n) => !n.is_read).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["header-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["header-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Close on click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      notifRef.current &&
      !notifRef.current.contains(event.target as Node) &&
      notifBtnRef.current &&
      !notifBtnRef.current.contains(event.target as Node)
    ) {
      setNotifOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (!token) return;
    const decoded = parseJwt(token);
    const userId = decoded ? (decoded.userId ? Number(decoded.userId) : (decoded.sub ? Number(decoded.sub) : null)) : null;
    if (!userId) return;

    async function loadUserProfile() {
      try {
        if (role === "MANAGER" || role === "STAFF") {
          const { getAllStaffs } = await import("../services/staffService");
          const staffRes = await getAllStaffs();
          const currentStaff = staffRes.data.find((s) => s.user_id === userId);
          if (currentStaff) {
            setUserFullName(currentStaff.full_name);
            if (currentStaff.user?.username) {
              setAccountUsername(currentStaff.user.username);
            }
            if (currentStaff.building?.branch_name) {
              setManagedBuildingName(currentStaff.building.branch_name);
            }
          }
        } else if (role === "TENANT") {
          try {
            const { getAllContracts } = await import("../services/contractService");
            const contracts = await getAllContracts();
            if (contracts && contracts.length > 0) {
              const contract = contracts[0];
              const currentTenant = contract.tenant;
              if (currentTenant) {
                setUserFullName(currentTenant.full_name);
              }
              const branchName = contract.apartment?.building?.branch_name;
              if (branchName) {
                setManagedBuildingName(branchName);
              }
            } else {
              const storedFullName = email ? localStorage.getItem(`profile-fullname-${email}`) : null;
              if (storedFullName) setUserFullName(storedFullName);
            }
          } catch {
            const storedFullName = email ? localStorage.getItem(`profile-fullname-${email}`) : null;
            if (storedFullName) {
              setUserFullName(storedFullName);
            }
          }
        } else if (role === "ADMIN") {
          const storedFullName = email ? localStorage.getItem(`profile-fullname-${email}`) : null;
          setUserFullName(storedFullName || "Quản trị viên");
          setAccountUsername("admin");
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin chi tiết người dùng:", err);
      }
    }

    loadUserProfile();

    window.addEventListener("profile-update", loadUserProfile);
    return () => {
      window.removeEventListener("profile-update", loadUserProfile);
    };
  }, [token, role, email]);

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
            const { getAllStaffs } = await import("../services/staffService");
            const { getAllBuildings } = await import("../services/buildingService");
            const staffRes = await getAllStaffs();
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

  // Lấy tên tòa nhà
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
        : role === "STAFF" ? (managedBuildingName ? `Nhân viên: ${managedBuildingName}` : "Nhân viên")
          : role === "TENANT" ? (managedBuildingName ? `Người thuê: ${managedBuildingName}` : "Người thuê")
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

  async function handleLogout() {
    await logout();
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
        {/* Notification Popover */}
        <div className="relative">
          <button
            ref={notifBtnRef}
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
            title="Thông báo"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse-dot">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {notifOpen && (
            <div
              ref={notifRef}
              className="absolute right-0 mt-2 w-[380px] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Thông báo</h3>
                  {unreadCount > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{unreadCount} chưa đọc</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold cursor-pointer hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
                {headerNotifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell size={32} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-xs text-gray-400">Không có thông báo nào</p>
                  </div>
                ) : (
                  headerNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) markReadMutation.mutate(notif.id);
                        setNotifOpen(false);
                        navigate(`/${role?.toLowerCase()}/notifications`, { state: { selectedNotifId: notif.id } });
                      }}
                      className={`w-full text-left px-5 py-3.5 flex gap-3 items-start hover:bg-gray-50/60 transition-all duration-150 cursor-pointer ${!notif.is_read ? "bg-indigo-50/15" : ""
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${getNotifIconBg(notif.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-snug truncate ${!notif.is_read ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                          {notif.content}
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1 font-medium">
                          {formatTimeAgo(notif.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    navigate(`/${role?.toLowerCase()}/notifications`);
                  }}
                  className="w-full text-center text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5 py-1 cursor-pointer transition-colors"
                >
                  Xem tất cả thông báo
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

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
