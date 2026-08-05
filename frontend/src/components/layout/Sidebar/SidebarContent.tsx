import type { SidebarGroup as SidebarGroupType } from "../../../constants/sidebar";
import SidebarLogo from "./SidebarLogo";
import SidebarGroup from "./SidebarGroup";
import { cn } from "../../../lib/utils";

export interface SidebarContentProps {
  menuGroups: SidebarGroupType[];
  isOpen: boolean;
}

export function SidebarContent({ menuGroups, isOpen }: SidebarContentProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col h-full">
      <SidebarLogo isOpen={isOpen} />

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuGroups.map((group, index) => (
          <SidebarGroup key={group.title || index} group={group} isOpen={isOpen} />
        ))}
      </nav>

      <div
        className={cn(
          "px-5 py-4 border-t border-gray-100 transition-opacity duration-300 ease-in-out overflow-hidden shrink-0",
          isOpen ? "opacity-100 max-h-16" : "opacity-0 max-h-0 py-0 pointer-events-none"
        )}
      >
        <p className="text-[10px] text-gray-400 whitespace-nowrap">© {currentYear} YuKi House</p>
      </div>
    </div>
  );
}

export default SidebarContent;
