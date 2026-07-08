import { Trash2, Check, Mail, Info, Wrench, Receipt } from "lucide-react";
import { formatDate } from "../../../../utils/date";
import type { Notification } from "../../../../types";

interface NotificationListProps {
  notifications: Notification[];
  markRead: (id: number) => void;
  deleteNotification: (id: number) => void;
}

export default function NotificationList({
  notifications,
  markRead,
  deleteNotification,
}: NotificationListProps) {
  function getNotificationIcon(notifType: string) {
    if (notifType === "INVOICE") return <Receipt size={18} className="text-emerald-600" />;
    if (notifType === "MAINTENANCE") return <Wrench size={18} className="text-amber-600" />;
    if (notifType === "SYSTEM") return <Info size={18} className="text-blue-600" />;
    return <Mail size={18} className="text-gray-500" />;
  }

  return (
    <div className="bg-white border border-gray-250 shadow-md rounded-none divide-y divide-gray-150">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-4 flex gap-4 items-start transition-all hover:bg-gray-50/50 ${!notif.is_read ? "bg-primary-50/10 font-medium" : "text-gray-600"
            }`}
        >
          {/* Icon box */}
          <div className={`p-2.5 shrink-0 ${!notif.is_read ? "bg-primary-50" : "bg-gray-100"}`}>
            {getNotificationIcon(notif.type)}
          </div>

          {/* Content info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className={`text-sm ${!notif.is_read ? "font-bold text-gray-900" : "text-gray-700"}`}>
                {notif.title}
              </h4>
              <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                {formatDate(notif.created_at)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">
              {notif.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!notif.is_read && (
              <button
                type="button"
                onClick={() => markRead(notif.id)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                title="Đánh dấu đã đọc"
              >
                <Check size={14} className="stroke-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => deleteNotification(notif.id)}
              className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors cursor-pointer"
              title="Xóa thông báo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
