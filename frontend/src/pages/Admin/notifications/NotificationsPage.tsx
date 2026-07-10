import { useState, useEffect } from "react";
import { Bell, Mail, CheckSquare, Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import Combobox from "../../../components/ui/Combobox";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import NotificationList from "./components/NotificationList";
import NotificationDetailModal from "./components/NotificationDetailModal";
import { useNotificationCenter } from "../../../hooks/common/useNotificationCenter";
import { useNotificationSend } from "../../../hooks/admin/useNotificationSend";

export default function NotificationsPage() {
  const {
    role,
    notifications,
    unreadCount,
    isLoading,
    search,
    setSearch,
    isReadFilter,
    setIsReadFilter,

    // Actions
    markRead,
    markAllRead,
    deleteNotification,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
  } = useNotificationCenter();
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.selectedNotifId && notifications.length > 0) {
      const found = notifications.find((n) => n.id === location.state.selectedNotifId);
      if (found) {
        setSelectedNotif(found);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, notifications]);

  useEffect(() => {
    if (selectedNotif && !selectedNotif.is_read) {
      markRead(selectedNotif.id, true);
      selectedNotif.is_read = true;
    }
  }, [selectedNotif, markRead]);

  // Send hook for Admin
  const {
    buildings,
    apartments,
    loadingApartments,
    title,
    setTitle,
    content,
    setContent,
    type,
    setType,
    buildingId,
    setBuildingId,
    targetType,
    setTargetType,
    selectedApartmentIds,
    handleToggleApartment,
    broadcastModal,
    handleBroadcastSubmit,
    isSending,
  } = useNotificationSend();

  const isOperator = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Bell}
        title="Thông báo"
        subtitle="Xem tin tức, hóa đơn mới phát sinh và các thông tin vận hành từ ban quản lý"
        count={unreadCount}
        iconColor="linear-gradient(135deg, #EC4899, #8B5CF6)"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm tiêu đề hoặc nội dung thông báo..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {isOperator && (
              <Button
                onClick={broadcastModal.onOpen}
                className="flex items-center gap-2 rounded-xl shrink-0 shadow-md font-semibold"
              >
                <Plus size={16} />
                <span>Phát thông báo mới</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Filter and Mark All Read */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <Combobox
          options={[
            { value: "", label: "Tất cả thông báo" },
            { value: "false", label: "Chưa đọc" },
            { value: "true", label: "Đã đọc" },
          ]}
          value={isReadFilter}
          onChange={setIsReadFilter}
          placeholder="Lọc trạng thái"
          searchable={false}
          triggerClassName="h-[42px] rounded-xl border-gray-200 px-3"
          clearable={false}
        />
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => markAllRead()}
          className="text-primary-600 hover:text-primary-700 font-semibold text-xs flex items-center gap-1.5 justify-center py-2.5 px-4 hover:bg-primary-50 transition-all duration-200 rounded-xl border border-primary-200 cursor-pointer"
        >
          <CheckSquare size={14} />
          <span>Đánh dấu tất cả đã đọc</span>
        </button>
      )}

      {/* Notifications listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2">Đang tải hộp thư thông báo...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <Mail size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Hộp thư thông báo trống</p>
        </div>
      ) : (
        <div className="space-y-4">
          <NotificationList
            notifications={notifications}
            markRead={markRead}
            deleteNotification={deleteNotification}
            onViewDetails={(notif) => setSelectedNotif(notif)}
          />

          {/* Pagination */}
          <div className="pt-2">
            <DefaultPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Broadcast Modal for Operators */}
      <Modal isOpen={broadcastModal.isOpen} onClose={broadcastModal.onClose} title="Phát Thông Báo Ban Quản Trị">
        <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1">Tòa nhà / Chi nhánh</label>
              {role === "ADMIN" ? (
                <Combobox
                  options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
                  value={buildingId ? String(buildingId) : ""}
                  onChange={(val) => setBuildingId(val ? Number(val) : undefined)}
                  placeholder="Chọn tòa nhà"
                  clearable={false}
                  triggerClassName="h-[42px] rounded-xl border-gray-200"
                />
              ) : (
                <div className="h-[42px] flex items-center px-4 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl font-bold">
                  {buildings.find((b) => b.id === buildingId)?.branch_name || "Tòa nhà quản lý"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-650 block mb-1">Phân loại thông báo</label>
              <Combobox
                options={[
                  { value: "GENERAL", label: "Thông tin chung" },
                  { value: "INVOICE", label: "Tiền điện nước / Hóa đơn" },
                  { value: "MAINTENANCE", label: "Sửa chữa / Bảo trì tòa nhà" },
                  { value: "SYSTEM", label: "Cảnh báo hệ thống" },
                ]}
                value={type}
                onChange={setType}
                searchable={false}
                clearable={false}
                triggerClassName="h-[42px] rounded-xl border-gray-200"
              />
            </div>
          </div>

          {/* Targeting type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-650 block">Đối tượng nhận thông báo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="targetType"
                  value="BUILDING"
                  checked={targetType === "BUILDING"}
                  onChange={() => setTargetType("BUILDING")}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-xs font-medium text-gray-800">Tất cả cư dân tòa nhà</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="targetType"
                  value="APARTMENTS"
                  checked={targetType === "APARTMENTS"}
                  onChange={() => setTargetType("APARTMENTS")}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-xs font-medium text-gray-800">Chọn căn hộ cụ thể</span>
              </label>
            </div>
          </div>

          {/* Target Apartments Grid selector */}
          {targetType === "APARTMENTS" && buildingId && (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <label className="text-xs font-semibold text-gray-600 block">
                Chọn căn hộ nhận thông báo ({selectedApartmentIds.length} đã chọn):
              </label>
              {loadingApartments ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size={20} />
                </div>
              ) : apartments.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Không có căn hộ nào được tìm thấy trong tòa nhà.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-[160px] overflow-y-auto border border-gray-100 p-2.5 bg-gray-50/50 rounded-xl">
                  {apartments.map((apt) => {
                    const isSelected = selectedApartmentIds.includes(apt.id);
                    return (
                      <button
                        type="button"
                        key={apt.id}
                        onClick={() => handleToggleApartment(apt.id)}
                        className={`py-1.5 text-center font-bold text-xs select-none border transition-all cursor-pointer rounded-lg ${isSelected
                          ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        P.{apt.room_number}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Title input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-650 block">Tiêu đề thông báo</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề ngắn gọn..."
              required
              className="rounded-xl h-[42px]"
              disabled={isSending}
            />
          </div>

          {/* Content textarea */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-650 block">Nội dung thông báo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập chi tiết nội dung thông báo.."
              required
              className="w-full min-h-[120px] p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 text-sm transition-all"
              disabled={isSending}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={broadcastModal.onClose} disabled={isSending} className="rounded-xl">
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isSending} className="rounded-xl">
              {isSending ? "Đang gửi..." : "Phát sóng thông báo"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Chi tiết Thông báo */}
      <NotificationDetailModal
        isOpen={selectedNotif !== null}
        onClose={() => setSelectedNotif(null)}
        notification={selectedNotif}
      />
    </div>
  );
}
