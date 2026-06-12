import { Bell, Menu, Bot, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/auth.store";
import { useSidebarStore } from "../../../stores/sidebar.store";
import { mockNotifications } from "../../../data/notifications";
import Avatar from "../ui/Avatar";

// Header phia tren voi notification, AI, va profile dropdown
export default function Header() {
  const { user, role, logout } = useAuthStore();
  const { setMobileOpen } = useSidebarStore();
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);

  // Dong dropdown khi click ra ngoai
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dem thong bao chua doc
  const unreadCount = mockNotifications.filter(
    (n) => n.user_id === user?.id && !n.is_read
  ).length;

  // Ten hien thi theo role
  const displayName = user?.email?.split("@")[0] || "User";
  const roleLabel = role === "ADMIN" ? "Quan tri vien" : role === "MANAGER" ? "Quan ly" : "Nguoi thue";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Ben trai: nut menu mobile + tieu de */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Ben phai: notification, AI, profile */}
      <div className="flex items-center gap-2">
        {/* Nut tro ly AI */}
        <button
          onClick={() => navigate(`/${role?.toLowerCase()}/ai-assistant`)}
          className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Tro ly AI"
        >
          <Bot size={20} />
        </button>

        {/* Nut thong bao */}
        <div ref={notiRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown thong bao */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-dropdown border border-gray-200 z-50 animate-slide-in-up">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="font-semibold text-gray-800">Thong bao</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications
                  .filter((n) => n.user_id === user?.id)
                  .slice(0, 5)
                  .map((noti) => (
                    <div
                      key={noti.id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                        !noti.is_read ? "bg-primary-50/50" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800">{noti.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{noti.content}</p>
                    </div>
                  ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate(`/${role?.toLowerCase()}/notifications`);
                  }}
                  className="text-xs text-primary-600 font-medium hover:underline cursor-pointer"
                >
                  Xem tat ca
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Avatar name={displayName} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800">{displayName}</p>
              <p className="text-[11px] text-gray-400">{roleLabel}</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-dropdown border border-gray-200 z-50 animate-slide-in-up">
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowProfile(false);
                    navigate(`/${role?.toLowerCase()}/profile`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <User size={16} />
                  Ho so ca nhan
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-50 cursor-pointer"
                >
                  <LogOut size={16} />
                  Dang xuat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
