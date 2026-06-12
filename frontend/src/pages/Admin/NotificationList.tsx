import { mockNotifications } from "../../data/notifications";
import { useAuthStore } from "../../stores/auth.store";
import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import { Bell, Receipt, Wrench, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "../../utils/format";
import type { NotificationType } from "../../constants/enums";

// Icon va mau theo loai thong bao
const typeConfig: Record<string, { icon: React.ComponentType<{size?: number; className?: string}>; color: string; bg: string }> = {
  SYSTEM: { icon: Bell, color: "text-primary-600", bg: "bg-primary-50" },
  INVOICE: { icon: Receipt, color: "text-success-600", bg: "bg-success-50" },
  MAINTENANCE: { icon: Wrench, color: "text-warning-600", bg: "bg-warning-50" },
  CHAT: { icon: MessageSquare, color: "text-info-600", bg: "bg-info-50" },
};

// Trang danh sach thong bao
export default function NotificationList() {
  const { user } = useAuthStore();

  // Lay thong bao cua user hien tai (admin xem tat ca)
  const notifications = user?.role === "ADMIN"
    ? mockNotifications
    : mockNotifications.filter((n) => n.user_id === user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Thong bao</h1>
        <p className="text-sm text-gray-500">Tat ca thong bao cua he thong</p>
      </div>

      <div className="space-y-3">
        {notifications.map((noti) => {
          const config = typeConfig[noti.type] || typeConfig.SYSTEM;
          const Icon = config.icon;

          return (
            <Card
              key={noti.id}
              className={`flex items-start gap-4 cursor-pointer hover:shadow-card-hover transition-shadow ${
                !noti.is_read ? "border-l-4 border-l-primary-500" : ""
              }`}
            >
              <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={config.color} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${!noti.is_read ? "text-gray-800" : "text-gray-600"}`}>
                    {noti.title}
                  </h4>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelativeTime(noti.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{noti.content}</p>
              </div>
              {!noti.is_read && (
                <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
