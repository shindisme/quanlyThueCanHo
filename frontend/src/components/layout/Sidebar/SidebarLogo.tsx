import { Building2, X } from "lucide-react";
import { useSidebarStore } from "../../../stores/sidebar.store";
import { cn } from "../../../lib/utils";

export interface SidebarLogoProps {
  isOpen: boolean;
}

export function SidebarLogo({ isOpen }: SidebarLogoProps) {
  const { setMobileOpen } = useSidebarStore();

  return (
    <div className="px-5 py-5 flex items-center justify-between border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-t-lg bg-linear-to-r from-purple-600 to-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
          <Building2 size={20} className="text-white" />
        </div>
        <div
          className={cn(
            "transition-opacity duration-300 ease-in-out whitespace-nowrap overflow-hidden",
            isOpen ? "opacity-100 max-w-37.5 ml-1" : "opacity-0 max-w-0 pointer-events-none"
          )}
        >
          <h1 className="text-lg font-extrabold text-gray-800 leading-tight">YuKi House</h1>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(false)}
        className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors"
        title="Đóng menu"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default SidebarLogo;
