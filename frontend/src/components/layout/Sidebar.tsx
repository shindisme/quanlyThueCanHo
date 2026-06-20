import { NavLink, useLocation } from "react-router-dom";
import { X, Building2 } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useSidebarStore } from "../../stores/sidebar.store";
import { getSidebarMenu } from "../../constants/sidebar";

export default function Sidebar() {
  const { role } = useAuthStore();
  const { isOpen, toggle, isMobileOpen, setMobileOpen } = useSidebarStore();
  const location = useLocation();

  if (!role) return null;

  const menuGroups = getSidebarMenu(role as any);

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 rounded-t-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
            <Building2 size={20} className="text-white" />
          </div>
          <div className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-[150px] ml-1" : "opacity-0 max-w-0 pointer-events-none"
            }`}>
            <h1 className="text-lg font-extrabold text-gray-800 leading-tight">YuKi House</h1>
          </div>
        </div>

        {/* Nút đóng mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>

      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {group.title && (
              <p className={`px-4 mb-2 mt-4 text-[12px] font-bold text-blue-600 uppercase tracking-wider transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-h-10" : "opacity-0 max-h-0 py-0 my-0 pointer-events-none"
                }`}>
                {group.title}
              </p>
            )}

            {/* Đường kẻ phân cách khi sidebar thu gọn */}
            {group.title && !isOpen && (
              <hr className="my-2 border-gray-100 mx-2" />
            )}

            {group.items.map((item) => {
              const isActive = location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={!isOpen ? item.label : undefined}
                  className={[
                    "flex items-center gap-3 py-1.5 rounded-lg mb-1 mx-2",
                    "text-[14px] font-medium transition-all duration-150 relative",
                    isOpen
                      ? (isActive
                        ? "bg-[#e0f3ff] text-[#3f6ad8] border-l-4 border-[#3f6ad8] pl-3"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-850 border-l-4 border-transparent pl-3")
                      : "justify-center px-0 " + (isActive ? "bg-[#e0f3ff] text-[#3f6ad8]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-850"),
                  ].join(" ")}
                >
                  <Icon
                    size={22}
                    className={`shrink-0 ${isActive ? "text-[#3f6ad8]" : "text-gray-400"}`}
                  />
                  <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-[150px] translate-x-0" : "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
                    }`}>
                    {item.label}
                  </span>

                  {/* Badge (số thông báo) - Adminator hiển thị bên phải */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full bg-danger-100 text-danger-600 font-semibold transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-[40px]" : "opacity-0 max-w-0 p-0 pointer-events-none"
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div className={`px-5 py-4 border-t border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "opacity-100 max-h-16" : "opacity-0 max-h-0 py-0 pointer-events-none"
        }`}>
        <p className="text-[10px] text-gray-400 whitespace-nowrap">© 2026 YuKi House</p>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={[
          "hidden lg:flex flex-col bg-white border-r border-gray-200",
          "transition-[width] duration-300 ease-in-out shrink-0",
          isOpen ? "w-72" : "w-[80px]",
        ].join(" ")}
        style={{ boxShadow: "var(--shadow-sidebar)", willChange: "width" }}
      >
        {sidebarContent}
      </aside>

      {/* MOBILE SIDEBAR - Overlay */}
      {isMobileOpen && (
        <>
          {/* Overlay đen mờ */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar trượt từ trái (animate-slide-in-left) */}
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
