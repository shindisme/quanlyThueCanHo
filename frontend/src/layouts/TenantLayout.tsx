import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

// Layout cho Tenant Portal - cau truc giong AdminLayout
// Menu sidebar se khac (hien thi menu cua Tenant)
export default function TenantLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="mx-auto px-8 md:px-16 lg:px-24 xl:px-32 py-10 max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
