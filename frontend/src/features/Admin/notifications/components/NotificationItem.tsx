import React from "react";
import { Trash2, Check, Mail } from "lucide-react";
import { getNotificationMeta } from "../../../../constants/notification";
import { formatDate } from "../../../../utils/date";
import type { Notification } from "../../../../types";

interface NotificationItemProps {
  notification: Notification;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent, id: number) => void;
  onMarkRead: (e: React.MouseEvent, id: number, isRead: boolean) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  onViewDetails?: (notif: Notification) => void;
}

export default function NotificationItem({
  notification,
  isExpanded,
  onToggleExpand,
  onMarkRead,
  onDelete,
  onViewDetails,
}: NotificationItemProps) {
  const { id, title, content, type, is_read, created_at } = notification;
  const notificationMeta = getNotificationMeta(type);

  return (
    <div
      className={`px-5 py-4 flex gap-4 items-start transition-all duration-200 hover:bg-gray-50/60 ${
        !is_read ? "bg-indigo-50/20" : ""
      }`}
    >
      {/* Icon Box */}
      <div className={`w-9 h-9 rounded-xl ${notificationMeta.bgClass} flex items-center justify-center shrink-0`}>
        {notificationMeta.icon}
      </div>

      {/* Content Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onViewDetails?.(notification)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h4 className={`text-sm leading-snug ${!is_read ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
            {title}
          </h4>
          <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap font-medium">
            {formatDate(created_at)}
          </span>
        </div>
        <p className={`text-xs text-gray-500 mt-1.5 whitespace-pre-wrap leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
          {content}
        </p>
        {content.length > 100 && (
          <button
            type="button"
            onClick={(e) => onToggleExpand(e, id)}
            className="text-[11px] text-primary-600 hover:text-primary-700 font-bold mt-1 inline-block focus:outline-none cursor-pointer"
          >
            {isExpanded ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 ml-1">
        {!is_read ? (
          <button
            type="button"
            onClick={(e) => onMarkRead(e, id, true)}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="Đánh dấu đã đọc"
          >
            <Check size={14} className="stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => onMarkRead(e, id, false)}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 cursor-pointer"
            title="Đánh dấu chưa đọc"
          >
            <Mail size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => onDelete(e, id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
          title="Xóa thông báo"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
