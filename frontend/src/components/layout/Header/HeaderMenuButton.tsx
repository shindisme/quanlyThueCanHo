import { Menu } from "lucide-react";
import { useSidebarStore } from "../../../stores/sidebar.store";

export function HeaderMenuButton() {
  const { setMobileOpen, toggle } = useSidebarStore();

  return (
    <button
      type="button"
      aria-label="Mở hoặc thu gọn menu"
      onClick={() => {
        if (window.innerWidth < 1024) {
          setMobileOpen(true);
        } else {
          toggle();
        }
      }}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
      title="Menu"
    >
      <Menu size={20} />
    </button>
  );
}

export default HeaderMenuButton;
