import { useAuthStore } from "../../../stores/auth.store";
import { useSidebarStore } from "../../../stores/sidebar.store";
import { getSidebarMenu } from "../../../constants/sidebar";
import SidebarContent from "./SidebarContent";
import { cn } from "../../../lib/utils";

export function Sidebar() {
  const { role } = useAuthStore();
  const { isOpen, isMobileOpen, setMobileOpen } = useSidebarStore();

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
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40 animate-fade-in transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl animate-slide-in-left">
            <SidebarContent menuGroups={menuGroups} isOpen={true} />
          </aside>
        </>
      )}
    </>
  );
}

export default Sidebar;
