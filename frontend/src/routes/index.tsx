import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import AdminLayout from "../layouts/AdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import GuestLayout from "../layouts/GuestLayout";
import RoleRoute from "./RoleRoute";

// Trang Admin
import AdminDashboard from "../pages/Admin/dashboard/Dashboard";
import BuildingList from "../pages/Admin/buildings/BuildingList";
import BuildingDetail from "../pages/Admin/buildings/BuildingDetail";
import ApartmentList from "../pages/Admin/apartments/ApartmentList";
import ApartmentDetail from "../pages/Admin/apartments/ApartmentDetail";
import TenantList from "../pages/Admin/tenants/TenantList";
import StaffList from "../pages/Admin/staff/StaffList";
import ContractList from "../pages/Admin/contracts/ContractList";
import InvoiceList from "../pages/Admin/invoices/InvoiceList";
import PaymentList from "../pages/Admin/payments/PaymentList";
import MaintenanceKanban from "../pages/Admin/maintenance/MaintenanceKanban";
import ScheduleList from "../pages/Admin/schedules/ScheduleList";
import UtilityList from "../pages/Admin/utilities/UtilityList";
import NotificationList from "../pages/Admin/notifications/NotificationList";
import SettingsPage from "../pages/Admin/settings/SettingsPage";
import UserList from "../pages/Admin/users/UserList";
// import ReportDashboard from "../pages/Admin/reports/ReportDashboard";

// Trang Manager
import ManagerDashboard from "../pages/Manager/dashboard/Dashboard";

// Trang Tenant
import TenantHome from "../pages/Tenant/home/Home";
import TenantContracts from "../pages/Tenant/contracts/MyContracts";
import ProfilePage from "../pages/Tenant/profile/ProfilePage";

// Trang Guest
import GuestHomePage from "../pages/Guest/HomePage";
import GuestApartmentListing from "../pages/Guest/ApartmentListing";
import GuestApartmentDetail from "../pages/Guest/ApartmentDetail";
import GuestContact from "../pages/Guest/Contact";
import GuestAbout from "../pages/Guest/About";

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
      { path: "buildings", element: <BuildingList /> },
      { path: "buildings/:id", element: <BuildingDetail /> },
      { path: "apartments", element: <ApartmentList /> },
      { path: "apartments/:id", element: <ApartmentDetail /> },
      { path: "tenants", element: <TenantList /> },
      { path: "staff", element: <StaffList /> },
      { path: "contracts", element: <ContractList /> },
      { path: "invoices", element: <InvoiceList /> },
      { path: "payments", element: <PaymentList /> },
      { path: "maintenance", element: <MaintenanceKanban /> },
      { path: "schedules", element: <ScheduleList /> },
      { path: "utilities", element: <UtilityList /> },
      { path: "notifications", element: <NotificationList /> },
      { path: "users", element: <UserList /> },
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
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <ManagerDashboard /> },
      { path: "apartments", element: <ApartmentList /> },
      { path: "apartments/:id", element: <ApartmentDetail /> },
      { path: "tenants", element: <TenantList /> },
      { path: "staff", element: <StaffList /> },
      { path: "contracts", element: <ContractList /> },
      { path: "invoices", element: <InvoiceList /> },
      { path: "maintenance", element: <MaintenanceKanban /> },
      { path: "schedules", element: <ScheduleList /> },
      { path: "utilities", element: <UtilityList /> },
      { path: "notifications", element: <NotificationList /> },
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
      { path: "invoices", element: <InvoiceList /> },
      { path: "payments", element: <PaymentList /> },
      { path: "utilities", element: <UtilityList /> },
      { path: "maintenance", element: <MaintenanceKanban /> },
      { path: "notifications", element: <NotificationList /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);

export default router;