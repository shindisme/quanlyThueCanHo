import { lazy } from "react";

export const Login = lazy(() => import("../pages/Login"));
export const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
export const TenantLayout = lazy(() => import("../layouts/TenantLayout"));
export const GuestLayout = lazy(() => import("../layouts/GuestLayout"));

export const AdminDashboard = lazy(() => import("../features/Admin/dashboard/pages/DashboardAdminPage"));
export const BuildingsPage = lazy(() => import("../features/Admin/buildings/pages/BuildingPage"));
export const BuildingDetailPage = lazy(() => import("../features/Admin/buildings/pages/BuildingDetailPage"));
export const ApartmentsPage = lazy(() => import("../features/Admin/apartments/pages/ApartmentPage"));
export const ApartmentDetailPage = lazy(() => import("../features/Admin/apartments/pages/ApartmentDetailPage"));
export const TenantsPage = lazy(() => import("../features/Admin/tenants/pages/TenantPage"));
export const StaffPage = lazy(() => import("../features/Admin/staffs/pages/StaffPage"));
export const ContractsPage = lazy(() => import("../features/Admin/contracts/pages/ContractPage"));
export const InvoicesPage = lazy(() => import("../features/Admin/invoices/pages/InvoicePage"));
export const PaymentsPage = lazy(() => import("../features/Admin/payments/pages/PaymentPage"));
export const MaintenancePage = lazy(() => import("../features/Admin/maintenance/pages/MaintenancePage"));
export const SchedulesPage = lazy(() => import("../features/Admin/schedules/pages/SchedulePage"));
export const UtilitiesPage = lazy(() => import("../features/Admin/utilities/pages/UtilitiesPage"));
export const NotificationsPage = lazy(() => import("../features/Admin/notifications/pages/NotificationPage"));
export const UsersPage = lazy(() => import("../features/Admin/users/pages/UserPage"));
export const SettingsPage = lazy(() => import("../features/Admin/settings/pages/SettingsPage"));

export const ManagerDashboard = lazy(() => import("../features/Manager/dashboard/pages/DashboardManager"));
export const StaffDashboard = lazy(() => import("../features/Staff/dashboard/pages/DashboardStaff"));

export const DashboardTenant = lazy(() => import("../features/Tenant/home/pages/DashboardTenant"));
export const TenantContracts = lazy(() => import("../features/Tenant/contracts/pages/MyContracts"));
export const MyInvoices = lazy(() => import("../features/Tenant/invoices/pages/MyInvoices"));
export const MyPayments = lazy(() => import("../features/Tenant/payments/pages/MyPayments"));
export const MyMaintenance = lazy(() => import("../features/Tenant/maintenance/pages/MyMaintenance"));
export const MyUtilities = lazy(() => import("../features/Tenant/utilities/pages/MyUtilities"));
export const MyOccupants = lazy(() => import("../features/Tenant/occupants/pages/MyOccupants"));
export const ProfilePage = lazy(() => import("../features/Tenant/profile/pages/ProfilePage"));

export const GuestHomePage = lazy(() => import("../features/Guest/home/pages/HomePage"));
export const GuestApartmentListing = lazy(() => import("../features/Guest/apartments/pages/ApartmentListing"));
export const GuestApartmentDetail = lazy(() => import("../features/Guest/apartments/pages/ApartmentDetail"));
export const GuestContact = lazy(() => import("../features/Guest/contact/pages/Contact"));
export const GuestAbout = lazy(() => import("../features/Guest/about/pages/About"));
export const PublicPaymentResultPage = lazy(() => import("../features/Guest/payments/pages/PublicPaymentResultPage"));
export const PublicDepositSuccessPage = lazy(() => import("../features/Guest/payments/pages/PublicDepositSuccessPage"));
