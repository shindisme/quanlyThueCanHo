import { Outlet } from "react-router-dom";
import GuestNavbar from "../components/Guest/GuestNavbar";
import GuestFooter from "../components/Guest/GuestFooter";

// Layout cho Guest Website - khong co sidebar
// Chi co Navbar phia tren va Footer phia duoi
export default function GuestLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GuestNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <GuestFooter />
    </div>
  );
}
