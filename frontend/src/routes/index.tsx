import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import AdminLayout from "../layouts/AdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import GuestLayout from "../layouts/GuestLayout";
import RoleRoute from "./RoleRoute";
import RootRedirect from "./RootRedirect";

// Admin pages
import AdminDashboard from "../pages/Admin/Dashboard";
import BuildingList from "../pages/Admin/BuildingList";
import BuildingDetail from "../pages/Admin/BuildingDetail";
import ApartmentList from "../pages/Admin/ApartmentList";
import ApartmentDetail from "../pages/Admin/ApartmentDetail";
import TenantList from "../pages/Admin/TenantList";
import ContractList from "../pages/Admin/ContractList";
import InvoiceList from "../pages/Admin/InvoiceList";
import PaymentList from "../pages/Admin/PaymentList";
import MaintenanceKanban from "../pages/Admin/MaintenanceKanban";
import ScheduleList from "../pages/Admin/ScheduleList";
import UtilityList from "../pages/Admin/UtilityList";
import NotificationList from "../pages/Admin/NotificationList";
import AIAssistant from "../pages/Admin/AIAssistant";
import SettingsPage from "../pages/Admin/SettingsPage";
import UserList from "../pages/Admin/UserList";
import ReportDashboard from "../pages/Admin/ReportDashboard";

// Manager pages
import ManagerDashboard from "../pages/Manager/Dashboard";

// Tenant pages
import TenantHome from "../pages/Tenant/Home";
import TenantContracts from "../pages/Tenant/MyContracts";
import TenantInvoices from "../pages/Tenant/MyInvoices";
import TenantMaintenance from "../pages/Tenant/MyMaintenance";
import ProfilePage from "../pages/Tenant/ProfilePage";

// Guest pages
import GuestHomePage from "../pages/Guest/HomePage";
import GuestApartmentListing from "../pages/Guest/ApartmentListing";
import GuestApartmentDetail from "../pages/Guest/ApartmentDetail";
import GuestContact from "../pages/Guest/Contact";
import GuestAbout from "../pages/Guest/About";

const router = createBrowserRouter([
  // Trang login
  {
    path: "/login",
    element: <Login />,
  },

  // Điều hướng gốc /
  {
    path: "/",
    element: <RootRedirect />,
  },

  // Tạm thời chuyển trang Guest sang /guest
  {
    path: "/guest",
    element: <GuestLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "apartments", element: <GuestApartmentListing /> },
      { path: "apartments/:id", element: <GuestApartmentDetail /> },
      { path: "buildings", element: <GuestApartmentListing /> },
      { path: "about", element: <GuestAbout /> },
      { path: "contact", element: <GuestContact /> },
    ],
  },

  // Admin routes - can role ADMIN
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
      { path: "contracts", element: <ContractList /> },
      { path: "invoices", element: <InvoiceList /> },
      { path: "payments", element: <PaymentList /> },
      { path: "maintenance", element: <MaintenanceKanban /> },
      { path: "schedules", element: <ScheduleList /> },
      { path: "utilities", element: <UtilityList /> },
      { path: "notifications", element: <NotificationList /> },
      { path: "users", element: <UserList /> },
      { path: "reports", element: <ReportDashboard /> },
      { path: "ai-assistant", element: <AIAssistant /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },

  // Manager routes - can role MANAGER
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
      { path: "contracts", element: <ContractList /> },
      { path: "invoices", element: <InvoiceList /> },
      { path: "maintenance", element: <MaintenanceKanban /> },
      { path: "schedules", element: <ScheduleList /> },
      { path: "utilities", element: <UtilityList /> },
      { path: "notifications", element: <NotificationList /> },
      { path: "reports", element: <ReportDashboard /> },
      { path: "ai-assistant", element: <AIAssistant /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },

  // Tenant routes - can role TENANT
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
      { path: "invoices", element: <TenantInvoices /> },
      { path: "payments", element: <PaymentList /> },
      { path: "utilities", element: <UtilityList /> },
      { path: "maintenance", element: <TenantMaintenance /> },
      { path: "notifications", element: <NotificationList /> },
      { path: "ai-assistant", element: <AIAssistant /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
]);

export default router;