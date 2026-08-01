import React from "react";
import { Receipt, Wrench, Info, Mail } from "lucide-react";
import type { NotificationType } from "./enums";

export interface NotificationMetaItem {
  icon: React.ReactElement;
  bgClass: string;
  label: string;
}

export const NOTIFICATION_META: Record<string, NotificationMetaItem> = {
  INVOICE: {
    icon: React.createElement(Receipt, { size: 14, className: "text-emerald-600" }),
    bgClass: "bg-emerald-50",
    label: "Hóa đơn",
  },
  MAINTENANCE: {
    icon: React.createElement(Wrench, { size: 14, className: "text-amber-600" }),
    bgClass: "bg-amber-50",
    label: "Sửa chữa",
  },
  SYSTEM: {
    icon: React.createElement(Info, { size: 14, className: "text-blue-600" }),
    bgClass: "bg-blue-50",
    label: "Hệ thống",
  },
  DEFAULT: {
    icon: React.createElement(Mail, { size: 14, className: "text-gray-500" }),
    bgClass: "bg-gray-100",
    label: "Thông báo",
  },
};

export function getNotificationMeta(type: NotificationType | string): NotificationMetaItem {
  return NOTIFICATION_META[type] || NOTIFICATION_META.DEFAULT;
}
