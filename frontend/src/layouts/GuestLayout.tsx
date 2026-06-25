import { Outlet } from "react-router-dom";
import GuestNavbar from "../pages/Guest/components/GuestNavbar";
import GuestFooter from "../pages/Guest/components/GuestFooter";
import GuestChatbox from "../pages/Guest/components/GuestChatbox";

export default function GuestLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GuestNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <GuestFooter />
      <GuestChatbox />
    </div>
  );
}
