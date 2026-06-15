import { Outlet } from "react-router-dom";
import GuestNavbar from "../components/layout/GuestNavbar";
import GuestFooter from "../components/layout/GuestFooter";
import GuestChatbox from "../components/layout/GuestChatbox";

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
