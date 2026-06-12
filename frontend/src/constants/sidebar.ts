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
  Bot,
  Settings,
  ClipboardList,
  User,
} from "lucide-react";
import type { Role } from "./enums";

// Cau truc 1 muc menu sidebar
export interface SidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

// Cau truc 1 nhom menu sidebar
export interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

// Menu cho Admin - quan tri toan he thong
const adminMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Quan ly",
    items: [
      { label: "Toa nha", path: "/admin/buildings", icon: Building2 },
      { label: "Can ho", path: "/admin/apartments", icon: Home },
      { label: "Nguoi thue", path: "/admin/tenants", icon: Users },
      { label: "Hop dong", path: "/admin/contracts", icon: FileText },
      { label: "Hoa don", path: "/admin/invoices", icon: Receipt },
      { label: "Thanh toan", path: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    title: "Van hanh",
    items: [
      { label: "Yeu cau sua chua", path: "/admin/maintenance", icon: Wrench },
      { label: "Lich xem phong", path: "/admin/schedules", icon: CalendarDays },
      { label: "Dien nuoc", path: "/admin/utilities", icon: Zap },
      { label: "Thong bao", path: "/admin/notifications", icon: Bell },
    ],
  },
  {
    title: "He thong",
    items: [
      { label: "Tai khoan", path: "/admin/users", icon: UserCog },
      { label: "Bao cao", path: "/admin/reports", icon: BarChart3 },
      { label: "Tro ly AI", path: "/admin/ai-assistant", icon: Bot },
      { label: "Cai dat", path: "/admin/settings", icon: Settings },
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
    title: "Quan ly",
    items: [
      { label: "Can ho", path: "/manager/apartments", icon: Home },
      { label: "Nguoi thue", path: "/manager/tenants", icon: Users },
      { label: "Hop dong", path: "/manager/contracts", icon: FileText },
      { label: "Hoa don", path: "/manager/invoices", icon: Receipt },
    ],
  },
  {
    title: "Van hanh",
    items: [
      { label: "Yeu cau sua chua", path: "/manager/maintenance", icon: Wrench },
      { label: "Lich xem phong", path: "/manager/schedules", icon: CalendarDays },
      { label: "Dien nuoc", path: "/manager/utilities", icon: Zap },
      { label: "Thong bao", path: "/manager/notifications", icon: Bell },
    ],
  },
  {
    title: "Khac",
    items: [
      { label: "Bao cao", path: "/manager/reports", icon: BarChart3 },
      { label: "Tro ly AI", path: "/manager/ai-assistant", icon: Bot },
    ],
  },
];

// Menu cho Tenant - nguoi thue
const tenantMenu: SidebarGroup[] = [
  {
    items: [
      { label: "Trang chu", path: "/tenant/home", icon: Home },
    ],
  },
  {
    title: "Ca nhan",
    items: [
      { label: "Hop dong cua toi", path: "/tenant/contracts", icon: ClipboardList },
      { label: "Hoa don", path: "/tenant/invoices", icon: Receipt },
      { label: "Thanh toan", path: "/tenant/payments", icon: CreditCard },
      { label: "Dien nuoc", path: "/tenant/utilities", icon: Zap },
    ],
  },
  {
    title: "Ho tro",
    items: [
      { label: "Yeu cau sua chua", path: "/tenant/maintenance", icon: Wrench },
      { label: "Thong bao", path: "/tenant/notifications", icon: Bell },
      { label: "Tro ly AI", path: "/tenant/ai-assistant", icon: Bot },
      { label: "Ho so ca nhan", path: "/tenant/profile", icon: User },
    ],
  },
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
