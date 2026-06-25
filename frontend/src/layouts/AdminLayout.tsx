import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="mx-auto px-4 sm:px-8 md:px-8 lg:px-8 xl:px-8 py-8 max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}