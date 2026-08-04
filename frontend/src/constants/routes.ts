export const ROUTES = {
  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
    BUILDINGS: "/admin/buildings",
    APARTMENTS: "/admin/apartments",
    TENANTS: "/admin/tenants",
    STAFF: "/admin/staff",
    CONTRACTS: "/admin/contracts",
    INVOICES: "/admin/invoices",
    PAYMENTS: "/admin/payments",
    MAINTENANCE: "/admin/maintenance",
    SCHEDULES: "/admin/schedules",
    UTILITIES: "/admin/utilities",
    NOTIFICATIONS: "/admin/notifications",
    USERS: "/admin/users",
    SETTINGS: "/admin/settings",
  },
  MANAGER: {
    ROOT: "/manager",
    DASHBOARD: "/manager/dashboard",
    APARTMENTS: "/manager/apartments",
    TENANTS: "/manager/tenants",
    STAFF: "/manager/staff",
    CONTRACTS: "/manager/contracts",
    INVOICES: "/manager/invoices",
    PAYMENTS: "/manager/payments",
    MAINTENANCE: "/manager/maintenance",
    SCHEDULES: "/manager/schedules",
    UTILITIES: "/manager/utilities",
    NOTIFICATIONS: "/manager/notifications",
    PROFILE: "/manager/profile",
  },
  STAFF: {
    ROOT: "/staff",
    DASHBOARD: "/staff/dashboard",
    MAINTENANCE: "/staff/maintenance",
    UTILITIES: "/staff/utilities",
    NOTIFICATIONS: "/staff/notifications",
    PROFILE: "/staff/profile",
  },
  TENANT: {
    ROOT: "/tenant",
    HOME: "/tenant/home",
    CONTRACTS: "/tenant/contracts",
    OCCUPANTS: "/tenant/occupants",
    INVOICES: "/tenant/invoices",
    PAYMENTS: "/tenant/payments",
    UTILITIES: "/tenant/utilities",
    MAINTENANCE: "/tenant/maintenance",
    NOTIFICATIONS: "/tenant/notifications",
    PROFILE: "/tenant/profile",
  },
  AUTH: {
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
  },
} as const;

export function buildRoleRoute(role: string, page: string): string {
  const cleanRole = role.toLowerCase();
  const cleanPage = page.startsWith("/") ? page.slice(1) : page;
  return `/${cleanRole}/${cleanPage}`;
}
