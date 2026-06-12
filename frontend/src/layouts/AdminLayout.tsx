import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/layout/Sidebar";
import Header from "../components/common/layout/Header";

// Layout chinh cho Admin va Manager
// Cau truc: Sidebar ben trai | Header + Content ben phai
// Outlet se render trang con (Dashboard, Buildings, v.v.)
export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar ben trai */}
      <Sidebar />

      {/* Phan noi dung ben phai */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header phia tren */}
        <Header />

        {/* Noi dung trang - co the cuon */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}