import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/layout/Sidebar";
import Header from "../components/common/layout/Header";

// Layout cho Tenant Portal - cau truc giong AdminLayout
// Menu sidebar se khac (hien thi menu cua Tenant)
export default function TenantLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
