import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import AdminLayout from "../layouts/AdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import GuestLayout from "../layouts/GuestLayout";
import RoleRoute from "./RoleRoute";
import { useAuthStore } from "../stores/auth.store";

// Trang Admin
import AdminDashboard from "../pages/Admin/dashboard/DashboardAdmin";
import BuildingsPage from "../pages/Admin/buildings/BuildingsPage";
import BuildingDetail from "../pages/Admin/buildings/BuildingDetail";
import ApartmentsPage from "../pages/Admin/apartments/ApartmentsPage";
import ApartmentDetail from "../pages/Admin/apartments/ApartmentDetail";
import TenantsPage from "../pages/Admin/tenants/TenantsPage";
import StaffPage from "../pages/Admin/staff/StaffsPage";
import ContractsPage from "../pages/Admin/contracts/ContractsPage";
import InvoicesPage from "../pages/Admin/invoices/InvoicesPage";
import PaymentsPage from "../pages/Admin/payments/PaymentsPage";
import MaintenancePage from "../pages/Admin/maintenance/MaintenancePage";
import SchedulesPage from "../pages/Admin/schedules/SchedulesPage";
import UtilitiesPage from "../pages/Admin/utilities/UtilitiesPage";
import NotificationsPage from "../pages/Admin/notifications/NotificationsPage";
import UsersPage from "../pages/Admin/users/UsersPage";
import SettingsPage from "../pages/Admin/settings/SettingsPage";
// import ReportDashboard from "../pages/Admin/reports/ReportDashboard";

// Trang Manager
import ManagerDashboard from "../pages/Manager/dashboard/Dashboard";

// Trang Tenant
import TenantHome from "../pages/Tenant/home/Home";
import TenantContracts from "../pages/Tenant/contracts/MyContracts";
import MyInvoices from "../pages/Tenant/invoices/MyInvoices";
import MyPayments from "../pages/Tenant/payments/MyPayments";
import MyMaintenance from "../pages/Tenant/maintenance/MyMaintenance";
import MyUtilities from "../pages/Tenant/utilities/MyUtilities";
import ProfilePage from "../pages/Tenant/profile/ProfilePage";

// Trang Guest
import GuestHomePage from "../pages/Guest/HomePage";
import GuestApartmentListing from "../pages/Guest/ApartmentListing";
import GuestApartmentDetail from "../pages/Guest/ApartmentDetail";
import GuestContact from "../pages/Guest/Contact";
import GuestAbout from "../pages/Guest/About";

function ManagerIndexRedirect() {
  const { role } = useAuthStore();
  if (role === "STAFF") {
    return <Navigate to="maintenance" replace />;
  }
  return <Navigate to="dashboard" replace />;
}

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
    children: [
      { index: true, element: <GuestHomePage /> },
      { path: "apartments", element: <GuestApartmentListing /> },
      { path: "apartments/:id", element: <GuestApartmentDetail /> },
      { path: "buildings", element: <GuestApartmentListing /> },
      { path: "about", element: <GuestAbout /> },
      { path: "contact", element: <GuestContact /> },
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
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "buildings", element: <BuildingsPage /> },
      { path: "buildings/:id", element: <BuildingDetail /> },
      { path: "apartments", element: <ApartmentsPage /> },
      { path: "apartments/:id", element: <ApartmentDetail /> },
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
    children: [
      { index: true, element: <ManagerIndexRedirect /> },
      { path: "dashboard", element: <RoleRoute allowedRoles={["MANAGER"]}><ManagerDashboard /></RoleRoute> },
      { path: "apartments", element: <RoleRoute allowedRoles={["MANAGER"]}><ApartmentsPage /></RoleRoute> },
      { path: "apartments/:id", element: <RoleRoute allowedRoles={["MANAGER"]}><ApartmentDetail /></RoleRoute> },
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
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: "home", element: <TenantHome /> },
      { path: "contracts", element: <TenantContracts /> },
      { path: "invoices", element: <MyInvoices /> },
      { path: "payments", element: <MyPayments /> },
      { path: "utilities", element: <MyUtilities /> },
      { path: "maintenance", element: <MyMaintenance /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);

export default router;