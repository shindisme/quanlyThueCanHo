import React, { useState } from "react";
import NotificationItem from "./NotificationItem";
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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const handleToggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMarkRead = (e: React.MouseEvent, id: number, isRead: boolean) => {
    e.stopPropagation();
    markRead(id, isRead);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <div className="bg-white border border-gray-100 overflow-hidden divide-y divide-gray-100/80 shadow">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          isExpanded={expandedIds.has(notif.id)}
          onToggleExpand={handleToggleExpand}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
