import React from "react";
import { Receipt, Wrench, Info, Mail } from "lucide-react";
import type { NotificationType } from "./enums";

export interface NotificationMetaItem {
  icon: React.ReactElement;
  bgClass: string;
  label: string;
}

export const NOTIFICATION_META = {
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
  GENERAL: {
    icon: React.createElement(Mail, { size: 14, className: "text-gray-500" }),
    bgClass: "bg-gray-100",
    label: "Thông báo",
  },
  CHAT: {
    icon: React.createElement(Mail, { size: 14, className: "text-violet-600" }),
    bgClass: "bg-violet-50",
    label: "Tin nhắn",
  },
  DEFAULT: {
    icon: React.createElement(Mail, { size: 14, className: "text-gray-500" }),
    bgClass: "bg-gray-100",
    label: "Thông báo",
  },
} satisfies Record<NotificationType | "DEFAULT", NotificationMetaItem>;

export function getNotificationMeta(type: NotificationType | string): NotificationMetaItem {
  return type in NOTIFICATION_META
    ? NOTIFICATION_META[type as keyof typeof NOTIFICATION_META]
    : NOTIFICATION_META.DEFAULT;
}
