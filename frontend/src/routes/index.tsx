import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import AdminLayout from "../layouts/AdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import GuestLayout from "../layouts/GuestLayout";
import RoleRoute from "./RoleRoute";
import RouteErrorBoundary from "../components/ui/RouteErrorBoundary";

// Trang Admin
import AdminDashboard from "../features/Admin/dashboard/pages/DashboardAdminPage";
import BuildingsPage from "../features/Admin/buildings/pages/BuildingPage";
import BuildingDetailPage from "../features/Admin/buildings/pages/BuildingDetailPage";
import ApartmentsPage from "../features/Admin/apartments/pages/ApartmentPage";
import ApartmentDetailPage from "../features/Admin/apartments/pages/ApartmentDetailPage";
import TenantsPage from "../features/Admin/tenants/pages/TenantPage";
import StaffPage from "../features/Admin/staffs/pages/StaffPage";
import ContractsPage from "../features/Admin/contracts/pages/ContractPage";
import InvoicesPage from "../features/Admin/invoices/pages/InvoicePage";
import PaymentsPage from "../features/Admin/payments/pages/PaymentPage";
import MaintenancePage from "../features/Admin/maintenance/pages/MaintenancePage";
import SchedulesPage from "../features/Admin/schedules/pages/SchedulePage";
import UtilitiesPage from "../features/Admin/utilities/pages/UtilitiesPage";
import NotificationsPage from "../features/Admin/notifications/pages/NotificationPage";
import UsersPage from "../features/Admin/users/pages/UserPage";

// Trang Manager
import ManagerDashboard from "../features/Manager/dashboard/pages/DashboardManager";

// Trang Tenant
import DashboardTenant from "../features/Tenant/home/pages/DashboardTenant";
import TenantContracts from "../features/Tenant/contracts/pages/MyContracts";
import MyInvoices from "../features/Tenant/invoices/pages/MyInvoices";
import MyPayments from "../features/Tenant/payments/pages/MyPayments";
import MyMaintenance from "../features/Tenant/maintenance/pages/MyMaintenance";
import MyUtilities from "../features/Tenant/utilities/pages/MyUtilities";
import MyOccupants from "../features/Tenant/occupants/pages/MyOccupants";
import ProfilePage from "../features/Tenant/profile/pages/ProfilePage";

// Trang Guest
import GuestHomePage from "../features/Guest/home/pages/HomePage";
import GuestApartmentListing from "../features/Guest/apartments/pages/ApartmentListing";
import GuestApartmentDetail from "../features/Guest/apartments/pages/ApartmentDetail";
import GuestContact from "../features/Guest/contact/pages/Contact";
import GuestAbout from "../features/Guest/about/pages/About";
import SettingsPage from "../features/Admin/settings/pages/SettingsPage";

import PublicPaymentResultPage from "../features/Guest/payments/pages/PublicPaymentResultPage";

const router = createBrowserRouter([
  // Đăng nhập
  {
    path: "/system/login",
    element: <Login />,
  },

  // Chuyển hướng
  {
    path: "/login",
    element: <Navigate to="/system/login" replace />,
  },

  // Trang Guest
  {
    path: "/",
    element: <GuestLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <GuestHomePage /> },
      { path: "apartments", element: <GuestApartmentListing /> },
      { path: "apartments/:id", element: <GuestApartmentDetail /> },
      { path: "buildings", element: <GuestApartmentListing /> },
      { path: "about", element: <GuestAbout /> },
      { path: "contact", element: <GuestContact /> },
      { path: "payment-result", element: <PublicPaymentResultPage /> },
    ],
  },

  // Admin routes 
  {
    path: "/admin",
    element: (
      <RoleRoute allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </RoleRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "buildings", element: <BuildingsPage /> },
      { path: "buildings/:id", element: <BuildingDetailPage /> },
      { path: "apartments", element: <ApartmentsPage /> },
      { path: "apartments/:id", element: <ApartmentDetailPage /> },
      { path: "tenants", element: <TenantsPage /> },
      { path: "staff", element: <StaffPage /> },
      { path: "contracts", element: <ContractsPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "payments", element: <PaymentsPage /> },
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "schedules", element: <SchedulesPage /> },
      { path: "utilities", element: <UtilitiesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "users", element: <UsersPage /> },
      // { path: "reports", element: <ReportDashboard /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },

  // Manager routes 
  {
    path: "/manager",
    element: (
      <RoleRoute allowedRoles={["MANAGER", "STAFF"]}>
        <AdminLayout />
      </RoleRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <RoleRoute allowedRoles={["MANAGER", "STAFF"]}><ManagerDashboard /></RoleRoute> },
      { path: "apartments", element: <RoleRoute allowedRoles={["MANAGER"]}><ApartmentsPage /></RoleRoute> },
      { path: "apartments/:id", element: <RoleRoute allowedRoles={["MANAGER"]}><ApartmentDetailPage /></RoleRoute> },
      { path: "tenants", element: <RoleRoute allowedRoles={["MANAGER"]}><TenantsPage /></RoleRoute> },
      { path: "staff", element: <RoleRoute allowedRoles={["MANAGER"]}><StaffPage /></RoleRoute> },
      { path: "contracts", element: <RoleRoute allowedRoles={["MANAGER"]}><ContractsPage /></RoleRoute> },
      { path: "invoices", element: <RoleRoute allowedRoles={["MANAGER"]}><InvoicesPage /></RoleRoute> },
      { path: "payments", element: <RoleRoute allowedRoles={["MANAGER"]}><PaymentsPage /></RoleRoute> },
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "schedules", element: <RoleRoute allowedRoles={["MANAGER"]}><SchedulesPage /></RoleRoute> },
      { path: "utilities", element: <UtilitiesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      // { path: "reports", element: <ReportDashboard /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },

  // Tenant routes 
  {
    path: "/tenant",
    element: (
      <RoleRoute allowedRoles={["TENANT"]}>
        <TenantLayout />
      </RoleRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: "home", element: <DashboardTenant /> },
      { path: "contracts", element: <TenantContracts /> },
      { path: "invoices", element: <MyInvoices /> },
      { path: "payments", element: <MyPayments /> },
      { path: "utilities", element: <MyUtilities /> },
      { path: "maintenance", element: <MyMaintenance /> },
      { path: "occupants", element: <MyOccupants /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);

export default router;