import type { SidebarGroup as SidebarGroupType } from "../../../constants/sidebar";
import SidebarItem from "./SidebarItem";
import { cn } from "../../../lib/utils";

export interface SidebarGroupProps {
  group: SidebarGroupType;
  isOpen: boolean;
}

export function SidebarGroup({ group, isOpen }: SidebarGroupProps) {
  return (
    <div className="mb-4">
      {group.title && (
        <p
          className={cn(
            "px-5 mb-2 mt-4 text-[12px] font-bold text-blue-600 uppercase tracking-wider transition-opacity duration-300 ease-in-out whitespace-nowrap overflow-hidden",
            isOpen ? "opacity-100 max-h-10" : "opacity-0 max-h-0 py-0 my-0 pointer-events-none"
          )}
        >
          {group.title}
        </p>
      )}

      {group.title && !isOpen && <hr className="my-2 border-gray-100 mx-5" />}

      {group.items.map((item) => (
        <SidebarItem key={item.path} item={item} isOpen={isOpen} />
      ))}
    </div>
  );
}

export default SidebarGroup;
