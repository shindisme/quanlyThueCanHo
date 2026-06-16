import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Wrench,
  CalendarDays,
  Zap,
  Bell,
  UserCog,
  BarChart3,
  Settings,
  ClipboardList,
  User,
  Briefcase,
} from "lucide-react";
import type { Role } from "./enums";

export interface SidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

export interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

// Menu cho Admin
const adminMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Tòa nhà", path: "/admin/buildings", icon: Building2 },
      { label: "Căn hộ", path: "/admin/apartments", icon: Home },
      { label: "Người thuê", path: "/admin/tenants", icon: Users },
      { label: "Nhân viên", path: "/admin/staff", icon: Briefcase },
      { label: "Hợp đồng", path: "/admin/contracts", icon: FileText },
      { label: "Hoá đơn", path: "/admin/invoices", icon: Receipt },
      { label: "Thanh toán", path: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    title: "Vận hành",
    items: [
      { label: "Yêu cầu sửa chữa", path: "/admin/maintenance", icon: Wrench },
      { label: "Lịch xem phòng", path: "/admin/schedules", icon: CalendarDays },
      { label: "Điện nước", path: "/admin/utilities", icon: Zap },
      { label: "Thông báo", path: "/admin/notifications", icon: Bell },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { label: "Tài khoản", path: "/admin/users", icon: UserCog },
      // { label: "Báo cáo", path: "/admin/reports", icon: BarChart3 },
      { label: "Cài đặt", path: "/admin/settings", icon: Settings },
    ],
  },
];

// Menu cho Manager - quan ly 1 toa nha
const managerMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Căn hộ", path: "/manager/apartments", icon: Home },
      { label: "Người thuê", path: "/manager/tenants", icon: Users },
      { label: "Nhân viên", path: "/manager/staff", icon: Briefcase },
      { label: "Hợp đồng", path: "/manager/contracts", icon: FileText },
      { label: "Hoá đơn", path: "/manager/invoices", icon: Receipt },
    ],
  },
  {
    title: "Vận hành",
    items: [
      { label: "Yêu cầu sửa chữa", path: "/manager/maintenance", icon: Wrench },
      { label: "Lịch xem phòng", path: "/manager/schedules", icon: CalendarDays },
      { label: "Điện nước", path: "/manager/utilities", icon: Zap },
      { label: "Thông báo", path: "/manager/notifications", icon: Bell },
    ],
  },
  {
    title: "Khác",
    items: [
      // { label: "Báo cáo", path: "/manager/reports", icon: BarChart3 },
    ],
  },
];

// Menu cho Tenant - nguoi thue
const tenantMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Trang chủ", path: "/tenant/home", icon: Home },
    ],
  },
  // {
  //   title: "Cá nhân",
  //   items: [
  //     { label: "Hợp đồng của tôi", path: "/tenant/contracts", icon: ClipboardList },
  //     { label: "Hoá đơn", path: "/tenant/invoices", icon: Receipt },
  //     { label: "Thanh toán", path: "/tenant/payments", icon: CreditCard },
  //     { label: "Điện nước", path: "/tenant/utilities", icon: Zap },
  //   ],
  // },
  // {
  //   title: "Hỗ trợ",
  //   items: [
  //     { label: "Yêu cầu sửa chữa", path: "/tenant/maintenance", icon: Wrench },
  //     { label: "Thông báo", path: "/tenant/notifications", icon: Bell },
  //     { label: "Hồ sơ cá nhân", path: "/tenant/profile", icon: User },
  //   ],
  // },
];

// Lay menu theo role nguoi dung
export function getSidebarMenu(role: Role): SidebarGroup[] {
  switch (role) {
    case "ADMIN":
      return adminMenu;
    case "MANAGER":
      return managerMenu;
    case "TENANT":
      return tenantMenu;
    default:
      return [];
  }
}
