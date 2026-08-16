import { Outlet, ScrollRestoration } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar/Sidebar";
import Header from "../components/layout/Header/Header";
import { useAuthStore } from "../stores/auth.store";
import { useSystemPrefetch } from "../hooks/useSystemPrefetch";

export default function TenantLayout() {
  const { role } = useAuthStore();
  useSystemPrefetch(role);

  return (
    <div className="flex min-h-screen bg-background">
      <ScrollRestoration />
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 bg-gray-50/30">
          <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 max-w-[1800px] w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
