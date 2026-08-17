import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import Header from "../components/layout/Header/Header";
import Sidebar from "../components/layout/Sidebar/Sidebar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { PageRefreshProvider } from "../contexts/PageRefreshContext";
import { usePageRefresh } from "../contexts/pageRefresh";

function AuthenticatedLayoutContent() {
  const { refreshKey } = usePageRefresh();

  return (
    <div className="flex min-h-screen bg-background">
      <ScrollRestoration />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 bg-gray-50/30">
          <div className="mx-auto w-full max-w-[1800px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <Suspense key={refreshKey} fallback={<div className="flex min-h-64 items-center justify-center"><LoadingSpinner size={32} /></div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AuthenticatedLayout() {
  return (
    <PageRefreshProvider>
      <AuthenticatedLayoutContent />
    </PageRefreshProvider>
  );
}
