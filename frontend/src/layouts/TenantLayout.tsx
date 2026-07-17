import { Outlet, ScrollRestoration } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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
          <div className="mx-auto px-8 md:px-16 lg:px-24 xl:px-32 py-10 max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
