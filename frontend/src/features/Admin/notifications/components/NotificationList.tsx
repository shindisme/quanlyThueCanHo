import { useState } from "react";
import { Trash2, Check, Mail, Info, Wrench, Receipt } from "lucide-react";
import { formatDate } from "../../../../utils/date";
import type { Notification } from "../../../../types";

interface NotificationListProps {
  notifications: Notification[];
  markRead: (id: number, isRead: boolean) => void;
  deleteNotification: (id: number) => void;
  onViewDetails?: (notif: Notification) => void;
}

export default function NotificationList({
  notifications,
  markRead,
  deleteNotification,
  onViewDetails,
}: NotificationListProps) {
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  function getNotificationIcon(notifType: string) {
    if (notifType === "INVOICE")
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Receipt size={16} className="text-emerald-600" />
        </div>
      );
    if (notifType === "MAINTENANCE")
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Wrench size={16} className="text-amber-600" />
        </div>
      );
    if (notifType === "SYSTEM")
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Info size={16} className="text-blue-600" />
        </div>
      );
    return (
      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <Mail size={16} className="text-gray-500" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100/80">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`px-5 py-4 flex gap-4 items-start transition-all duration-200 hover:bg-gray-50/60 ${!notif.is_read
              ? "bg-indigo-50/20"
              : ""
            }`}
        >
          {/* Icon box */}
          {getNotificationIcon(notif.type)}

          {/* Content info */}
          <div
            className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewDetails?.(notif)}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4
                className={`text-sm leading-snug ${!notif.is_read
                    ? "font-bold text-gray-900"
                    : "font-medium text-gray-600"
                  }`}
              >
                {notif.title}
              </h4>
              <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap font-medium">
                {formatDate(notif.created_at)}
              </span>
            </div>
            <p className={`text-xs text-gray-500 mt-1.5 whitespace-pre-wrap leading-relaxed ${expandedIds[notif.id] ? "" : "line-clamp-2"
              }`}>
              {notif.content}
            </p>
            {notif.content.length > 100 && (
              <button
                type="button"
                onClick={(e) => toggleExpand(e, notif.id)}
                className="text-[11px] text-primary-600 hover:text-primary-700 font-bold mt-1 inline-block focus:outline-none cursor-pointer"
              >
                {expandedIds[notif.id] ? "Thu gọn" : "Xem thêm"}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {!notif.is_read ? (
              <button
                type="button"
                onClick={() => markRead(notif.id, true)}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer"
                title="Đánh dấu đã đọc"
              >
                <Check size={14} className="stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => markRead(notif.id, false)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 cursor-pointer"
                title="Đánh dấu chưa đọc"
              >
                <Mail size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => deleteNotification(notif.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
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
