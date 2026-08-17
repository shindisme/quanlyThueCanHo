import { createBrowserRouter, Navigate } from "react-router-dom";
import RoleRoute from "./RoleRoute";
import RouteErrorBoundary from "../components/ui/RouteErrorBoundary";
import {
  AdminDashboard,
  AdminLayout,
  ApartmentDetailPage,
  ApartmentsPage,
  BuildingDetailPage,
  BuildingsPage,
  ContractsPage,
  DashboardTenant,
  GuestAbout,
  GuestApartmentDetail,
  GuestApartmentListing,
  GuestContact,
  GuestHomePage,
  GuestLayout,
  InvoicesPage,
  Login,
  MaintenancePage,
  ManagerDashboard,
  MyInvoices,
  MyMaintenance,
  MyOccupants,
  MyPayments,
  MyUtilities,
  NotificationsPage,
  PaymentsPage,
  ProfilePage,
  PublicDepositSuccessPage,
  PublicPaymentResultPage,
  SchedulesPage,
  SettingsPage,
  StaffDashboard,
  StaffPage,
  TenantContracts,
  TenantLayout,
  TenantsPage,
  UsersPage,
  UtilitiesPage,
} from "./lazyPages";

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
      { path: "deposit-success", element: <PublicDepositSuccessPage /> },
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
      <RoleRoute allowedRoles={["MANAGER"]}>
        <AdminLayout />
      </RoleRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <ManagerDashboard /> },
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
      { path: "profile", element: <ProfilePage /> },
    ],
  },

  // Staff routes
  {
    path: "/staff",
    element: (
      <RoleRoute allowedRoles={["STAFF"]}>
        <AdminLayout />
      </RoleRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <StaffDashboard /> },
      { path: "maintenance", element: <MaintenancePage /> },
      { path: "utilities", element: <UtilitiesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
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
