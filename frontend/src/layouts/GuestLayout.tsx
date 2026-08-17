import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import GuestNavbar from "../features/Guest/components/GuestNavbar";
import GuestFooter from "../features/Guest/components/GuestFooter";
import GuestChatbox from "../features/Guest/components/GuestChatbox";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { PageRefreshProvider } from "../contexts/PageRefreshContext";
import { usePageRefresh } from "../contexts/pageRefresh";

function GuestLayoutContent() {
  const { refreshKey } = usePageRefresh();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollRestoration />
      <GuestNavbar />
      <main className="flex-1">
        <Suspense key={refreshKey} fallback={<div className="flex min-h-80 items-center justify-center"><LoadingSpinner size={32} /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <GuestFooter />
      <GuestChatbox />
    </div>
  );
}

export default function GuestLayout() {
  return (
    <PageRefreshProvider>
      <GuestLayoutContent />
    </PageRefreshProvider>
  );
}
