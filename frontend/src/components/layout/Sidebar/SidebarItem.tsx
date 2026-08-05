import { NavLink } from "react-router-dom";
import { useSidebarStore } from "../../../stores/sidebar.store";
import type { SidebarItem as SidebarItemType } from "../../../constants/sidebar";
import { cn } from "../../../lib/utils";

export interface SidebarItemProps {
  item: SidebarItemType;
  isOpen: boolean;
}

export function SidebarItem({ item, isOpen }: SidebarItemProps) {
  const { setMobileOpen } = useSidebarStore();
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={() => setMobileOpen(false)}
      title={!isOpen ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 py-2.5 mb-1 w-full text-[14px] font-medium transition-colors duration-150 relative",
          isOpen
            ? isActive
              ? "bg-linear-to-r from-[#e0f3ff] to-transparent text-[#3f6ad8] pl-5 pr-5"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 pl-5 pr-5"
            : cn(
              "justify-center px-0",
              isActive
                ? "bg-linear-to-r from-[#e0f3ff] to-transparent text-[#3f6ad8]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
            className={cn("shrink-0 transition-colors", isActive ? "text-[#3f6ad8]" : "text-gray-400")}
          />
          <span
            className={cn(
              "transition-opacity duration-300 ease-in-out whitespace-nowrap overflow-hidden",
              isOpen
                ? "opacity-100 max-w-37.5 translate-x-0"
                : "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
            )}
          >
            {item.label}
          </span>

          {item.badge !== undefined && item.badge > 0 && (
            <span
              className={cn(
                "ml-auto text-[10px] px-2 py-0.5 rounded-full bg-danger-100 text-danger-600 font-semibold transition-opacity duration-300 ease-in-out whitespace-nowrap overflow-hidden",
                isOpen ? "opacity-100 max-w-10" : "opacity-0 max-w-0 p-0 pointer-events-none"
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default SidebarItem;
