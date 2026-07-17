import { Outlet, ScrollRestoration } from "react-router-dom";
import GuestNavbar from "../features/Guest/components/GuestNavbar";
import GuestFooter from "../features/Guest/components/GuestFooter";
import GuestChatbox from "../features/Guest/components/GuestChatbox";

export default function GuestLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollRestoration />
      <GuestNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <GuestFooter />
      <GuestChatbox />
    </div>
  );
}
