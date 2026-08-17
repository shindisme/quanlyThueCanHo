import { useEffect } from "react";
import { useAuthStore } from "../../../stores/auth.store";
import { useSidebarStore } from "../../../stores/sidebar.store";
import { getSidebarMenu } from "../../../constants/sidebar";
import SidebarContent from "./SidebarContent";
import { cn } from "../../../lib/utils";

export function Sidebar() {
  const { role } = useAuthStore();
  const { isOpen, isMobileOpen, setMobileOpen } = useSidebarStore();

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileOpen, setMobileOpen]);

  if (!role) return null;

  const menuGroups = getSidebarMenu(role);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-gray-200 sticky top-0 h-screen",
          "transition-[width] duration-300 ease-in-out shrink-0 z-20",
          isOpen ? "w-72" : "w-20"
        )}
        style={{ boxShadow: "var(--shadow-sidebar, 0 4px 20px rgba(0,0,0,0.03))", willChange: "width" }}
      >
        <SidebarContent menuGroups={menuGroups} isOpen={isOpen} />
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng menu"
            className="fixed inset-0 z-40 bg-black/40 transition-opacity animate-fade-in lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            aria-label="Điều hướng chính"
            className="fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-3rem))] bg-white shadow-xl animate-slide-in-left lg:hidden"
          >
            <SidebarContent menuGroups={menuGroups} isOpen={true} />
          </aside>
        </>
      )}
    </>
  );
}

export default Sidebar;
