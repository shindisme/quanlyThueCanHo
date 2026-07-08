import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import AdminLayout from "../layouts/AdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import GuestLayout from "../layouts/GuestLayout";
import RoleRoute from "./RoleRoute";

// Trang Admin
import AdminDashboard from "../pages/Admin/dashboard/Dashboard";
import Building from "../pages/Admin/buildings/Building";
import BuildingDetail from "../pages/Admin/buildings/BuildingDetail";
import Apartment from "../pages/Admin/apartments/Apartment";
import ApartmentDetail from "../pages/Admin/apartments/ApartmentDetail";
import Tenant from "../pages/Admin/tenants/Tenant";
import Staff from "../pages/Admin/staff/Staff";
import Contract from "../pages/Admin/contracts/Contract";
import Invoice from "../pages/Admin/invoices/Invoice";
import Payment from "../pages/Admin/payments/Payment";
import MaintenanceKanban from "../pages/Admin/maintenance/Maintenance";
import Schedule from "../pages/Admin/schedules/Schedule";
import Utility from "../pages/Admin/utilities/Utility";
import Notification from "../pages/Admin/notifications/Notification";
import SettingsPage from "../pages/Admin/settings/SettingsPage";
import UserList from "../pages/Admin/users/User";
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
      { path: "buildings", element: <Building /> },
      { path: "buildings/:id", element: <BuildingDetail /> },
      { path: "apartments", element: <Apartment /> },
      { path: "apartments/:id", element: <ApartmentDetail /> },
      { path: "tenants", element: <Tenant /> },
      { path: "staff", element: <Staff /> },
      { path: "contracts", element: <Contract /> },
      { path: "invoices", element: <Invoice /> },
      { path: "payments", element: <Payment /> },
      { path: "maintenance", element: <MaintenanceKanban /> },
      { path: "schedules", element: <Schedule /> },
      { path: "utilities", element: <Utility /> },
      { path: "notifications", element: <Notification /> },
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
      <RoleRoute allowedRoles={["MANAGER", "STAFF"]}>
        <AdminLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <ManagerDashboard /> },
      { path: "apartments", element: <Apartment /> },
      { path: "apartments/:id", element: <ApartmentDetail /> },
      { path: "tenants", element: <Tenant /> },
      { path: "staff", element: <Staff /> },
      { path: "contracts", element: <Contract /> },
      { path: "invoices", element: <Invoice /> },
      { path: "payments", element: <Payment /> },
      { path: "maintenance", element: <MaintenanceKanban /> },
      { path: "schedules", element: <Schedule /> },
      { path: "utilities", element: <Utility /> },
      { path: "notifications", element: <Notification /> },
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
      { path: "notifications", element: <Notification /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);

export default router;