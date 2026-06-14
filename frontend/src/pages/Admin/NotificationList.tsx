import { Bell, Check } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/ui/PageHeader";

// ============================================================
// TRANG THÔNG BÁO - Mock data nội tuyến
// ============================================================

const mockNotifications = [
  { id: 1, title: "Hóa đơn tháng 6 đã được tạo", content: "Hóa đơn tháng 6/2026 đã được phát hành. Vui lòng thanh toán trước ngày 30/06.", type: "INVOICE", is_read: false, created_at: "2026-06-10" },
  { id: 2, title: "Yêu cầu sửa chữa #5 đã hoàn thành", content: "Yêu cầu sửa chữa bóng đèn phòng khách đã được xử lý xong.", type: "MAINTENANCE", is_read: false, created_at: "2026-06-09" },
  { id: 3, title: "Lịch bảo trì thang máy", content: "Thang máy Tower A sẽ được bảo trì từ 8h-12h ngày 15/06/2026.", type: "SYSTEM", is_read: true, created_at: "2026-06-08" },
  { id: 4, title: "Thanh toán thành công", content: "Hóa đơn tháng 5/2026 đã được thanh toán thành công qua chuyển khoản.", type: "INVOICE", is_read: true, created_at: "2026-06-05" },
  { id: 5, title: "Chào mừng đến YuKi House", content: "Cảm ơn bạn đã sử dụng hệ thống quản lý căn hộ YuKi House.", type: "SYSTEM", is_read: true, created_at: "2026-06-01" },
];

export default function NotificationList() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function markAsRead(id: number) {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  function markAllAsRead() {
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  }

  function getTypeBadge(type: string) {
    const map: Record<string, { label: string; color: string }> = {
      SYSTEM: { label: "Hệ thống", color: "bg-gray-100 text-gray-600 border border-gray-200" },
      INVOICE: { label: "Hóa đơn", color: "bg-amber-50 text-amber-600 border border-amber-200" },
      MAINTENANCE: { label: "Sửa chữa", color: "bg-blue-50 text-blue-600 border border-blue-200" },
    };
    const t = map[type] || { label: type, color: "bg-gray-100 text-gray-600" };
    return <span className={`text-xs px-2.5 py-0.5 rounded-full ${t.color}`}>{t.label}</span>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bell}
        title="Thông báo"
        subtitle="Quản lý và cập nhật các thông báo mới nhất"
        count={unreadCount}
        iconColor="linear-gradient(135deg, #EC4899, #8B5CF6)"
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-1 bg-white border border-gray-200 shadow-xs px-4 py-2.5 rounded-xl hover:shadow-sm transition-all"
            >
              <Check size={16} /> Đánh dấu tất cả đã đọc
            </button>
          ) : undefined
        }
      />

      <div className="space-y-2">
        {notifications.map((noti) => (
          <div
            key={noti.id}
            onClick={() => markAsRead(noti.id)}
            className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${!noti.is_read ? "border-l-3 border-l-primary-500" : ""
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${!noti.is_read ? "bg-primary-50" : "bg-gray-100"
                }`}>
                <Bell size={18} className={!noti.is_read ? "text-primary-600" : "text-gray-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm ${!noti.is_read ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                    {noti.title}
                  </p>
                  {getTypeBadge(noti.type)}
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{noti.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(noti.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
              {!noti.is_read && (
                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
