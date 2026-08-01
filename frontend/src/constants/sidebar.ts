import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  Receipt,
  Wrench,
  CalendarDays,
  Zap,
  Bell,
  UserCog,
  Briefcase,
  User,
  ClipboardList,
  CreditCard,
  Settings,
} from "lucide-react";
import type { Role } from "./enums";
import { ROUTES } from "./routes";

export interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
}

export interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

// Common operational items shared across roles
const createCommonOperationGroup = (basePath: string): SidebarGroup => ({
  title: "Vận hành",
  items: [
    { label: "Yêu cầu sửa chữa", path: `${basePath}/maintenance`, icon: Wrench },
    { label: "Lịch xem phòng", path: `${basePath}/schedules`, icon: CalendarDays },
    { label: "Điện nước", path: `${basePath}/utilities`, icon: Zap },
    { label: "Thông báo", path: `${basePath}/notifications`, icon: Bell },
  ],
});

// Admin Menu
const adminMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Tòa nhà", path: ROUTES.ADMIN.BUILDINGS, icon: Building2 },
      { label: "Căn hộ", path: ROUTES.ADMIN.APARTMENTS, icon: Home },
      { label: "Người thuê", path: ROUTES.ADMIN.TENANTS, icon: Users },
      { label: "Nhân viên", path: ROUTES.ADMIN.STAFF, icon: Briefcase },
      { label: "Hợp đồng", path: ROUTES.ADMIN.CONTRACTS, icon: FileText },
      { label: "Hoá đơn", path: ROUTES.ADMIN.INVOICES, icon: Receipt },
      { label: "Thanh toán", path: ROUTES.ADMIN.PAYMENTS, icon: CreditCard },
    ],
  },
  createCommonOperationGroup(ROUTES.ADMIN.ROOT),
  {
    title: "Hệ thống",
    items: [
      { label: "Tài khoản", path: ROUTES.ADMIN.USERS, icon: UserCog },
      { label: "Cài đặt", path: ROUTES.ADMIN.SETTINGS, icon: Settings },
    ],
  },
];

// Manager Menu
const managerMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", path: ROUTES.MANAGER.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Căn hộ", path: ROUTES.MANAGER.APARTMENTS, icon: Home },
      { label: "Người thuê", path: ROUTES.MANAGER.TENANTS, icon: Users },
      { label: "Nhân viên", path: ROUTES.MANAGER.STAFF, icon: Briefcase },
      { label: "Hợp đồng", path: ROUTES.MANAGER.CONTRACTS, icon: FileText },
      { label: "Hoá đơn", path: ROUTES.MANAGER.INVOICES, icon: Receipt },
      { label: "Thanh toán", path: ROUTES.MANAGER.PAYMENTS, icon: CreditCard },
    ],
  },
  createCommonOperationGroup(ROUTES.MANAGER.ROOT),
];

// Staff Menu
const staffMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", path: ROUTES.STAFF.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    title: "Vận hành",
    items: [
      { label: "Yêu cầu sửa chữa", path: `${ROUTES.STAFF.ROOT}/maintenance`, icon: Wrench },
      { label: "Điện nước", path: `${ROUTES.STAFF.ROOT}/utilities`, icon: Zap },
      { label: "Thông báo", path: `${ROUTES.STAFF.ROOT}/notifications`, icon: Bell },
    ],
  },
  {
    title: "Khác",
    items: [
      { label: "Hồ sơ cá nhân", path: ROUTES.STAFF.PROFILE, icon: User },
    ],
  },
];

// Tenant Menu
const tenantMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Trang chủ", path: ROUTES.TENANT.HOME, icon: Home },
    ],
  },
  {
    title: "Cá nhân",
    items: [
      { label: "Hợp đồng của tôi", path: ROUTES.TENANT.CONTRACTS, icon: ClipboardList },
      { label: "Người ở cùng", path: ROUTES.TENANT.OCCUPANTS, icon: Users },
      { label: "Hoá đơn", path: ROUTES.TENANT.INVOICES, icon: Receipt },
      { label: "Thanh toán", path: ROUTES.TENANT.PAYMENTS, icon: CreditCard },
      { label: "Điện nước", path: ROUTES.TENANT.UTILITIES, icon: Zap },
    ],
  },
  {
    title: "Hỗ trợ",
    items: [
      { label: "Yêu cầu sửa chữa", path: ROUTES.TENANT.MAINTENANCE, icon: Wrench },
      { label: "Thông báo", path: ROUTES.TENANT.NOTIFICATIONS, icon: Bell },
      { label: "Hồ sơ cá nhân", path: ROUTES.TENANT.PROFILE, icon: User },
    ],
  },
];

// Direct Record Mapping for Role-based Sidebar
export const SIDEBAR_MENU: Record<Role, SidebarGroup[]> = {
  ADMIN: adminMenu,
  MANAGER: managerMenu,
  STAFF: staffMenu,
  TENANT: tenantMenu,
};

// Retrieve sidebar menu by user role without switch-case
export function getSidebarMenu(role: Role): SidebarGroup[] {
  return SIDEBAR_MENU[role] ?? [];
}
