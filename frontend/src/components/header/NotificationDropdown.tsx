import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useHeaderNotifications } from "./hooks/useHeaderNotifications";
import { getNotificationMeta } from "../../constants/notification";
import { formatTimeAgo } from "../../utils/date";

export function NotificationDropdown() {
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const { notifications, unreadCount, markAllRead, markRead } = useHeaderNotifications();

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      btnRef.current &&
      !btnRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleNotificationClick = (id: number, isRead: boolean) => {
    if (!isRead) markRead(id);
    setOpen(false);
    const targetRole = (role || "TENANT").toLowerCase();
    navigate(`/${targetRole}/notifications`, { state: { selectedNotifId: id } });
  };

  const handleViewAllClick = () => {
    setOpen(false);
    const targetRole = (role || "TENANT").toLowerCase();
    navigate(`/${targetRole}/notifications`);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 flex items-center justify-center bg-danger-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse-dot">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-95 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Thông báo</h3>
              {unreadCount > 0 && (
                <p className="text-[11px] text-gray-400 mt-0.5">{unreadCount} chưa đọc</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold cursor-pointer hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-all"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-90 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = getNotificationMeta(notif.type);
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif.id, notif.is_read)}
                    className={`w-full text-left px-5 py-3.5 flex gap-3 items-start hover:bg-gray-50/60 transition-all duration-150 cursor-pointer ${
                      !notif.is_read ? "bg-indigo-50/15" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${meta.bgClass} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[13px] leading-snug truncate ${
                          !notif.is_read ? "font-bold text-gray-900" : "font-medium text-gray-600"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                        {notif.content}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-1 font-medium">
                        {formatTimeAgo(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <button
              type="button"
              onClick={handleViewAllClick}
              className="w-full text-center text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5 py-1 cursor-pointer transition-colors"
            >
              Xem tất cả thông báo
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
