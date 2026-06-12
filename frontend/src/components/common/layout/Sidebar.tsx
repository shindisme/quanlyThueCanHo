import { cn } from "../../../lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { useAuthStore } from "../../../stores/auth.store";
import { useSidebarStore } from "../../../stores/sidebar.store";
import { getSidebarMenu } from "../../../constants/sidebar";
import { mockBuildings } from "../../../data/buildings";

// Sidebar navigation ben trai
// Hien thi logo DuKiHome, menu theo role, va ten toa nha neu la Manager
export default function Sidebar() {
  const { role, user } = useAuthStore();
  const { isOpen, toggle, isMobileOpen, setMobileOpen } = useSidebarStore();
  const location = useLocation();

  if (!role) return null;

  const menuGroups = getSidebarMenu(role);

  // Neu la Manager, lay ten toa nha dang quan ly
  const managedBuilding = user?.managedBuildingId
    ? mockBuildings.find((b) => b.id === user.managedBuildingId)
    : null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo va ten he thong */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Text logo */}
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">DK</span>
          </div>
          {isOpen && (
            <div>
              <h1 className="text-base font-bold text-gray-800">DuKiHome</h1>
              {managedBuilding && (
                <p className="text-xs text-primary-600 font-medium">
                  {managedBuilding.name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Nut dong sidebar tren mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Nut thu gon sidebar tren desktop */}
        <button
          onClick={toggle}
          className="hidden lg:flex p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <ChevronLeft
            size={18}
            className={cn("transition-transform", !isOpen && "rotate-180")}
          />
        </button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {/* Tieu de nhom (neu co) */}
            {group.title && isOpen && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {group.title}
              </p>
            )}

            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {isOpen && <span>{item.label}</span>}
                  {isOpen && item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      "ml-auto text-xs px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary-100 text-primary-700"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Thong tin phia duoi */}
      {isOpen && (
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">DuKiHome v1.0</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar tren desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0",
          isOpen ? "w-64" : "w-20"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar tren mobile - overlay */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-modal animate-slide-in-right">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
