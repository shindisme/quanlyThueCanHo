import { Mail, CheckSquare, Plus } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import DefaultPagination from "../../../../components/ui/Pagination";
import Button from "../../../../components/ui/Button";
import NotificationList from "../components/NotificationList";
import NotificationDetailModal from "../components/NotificationDetailModal";
import NotificationBroadcastModal from "../components/NotificationBroadcastModal";
import { useNotificationCenter } from "../hooks/useNotificationCenter";
import { useNotificationSend } from "../hooks/useNotificationSend";
import { useNotificationDetail } from "../hooks/useNotificationDetail";

export default function NotificationPage() {
  const {
    role,
    notifications,
    unreadCount,
    isLoading,
    search,
    setSearch,
    isReadFilter,
    setIsReadFilter,
    markRead,
    markAllRead,
    deleteNotification,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useNotificationCenter();

  const sendModal = useNotificationSend();
  const detail = useNotificationDetail({ notifications, markRead });

  const isOperator = role === "ADMIN" || role === "MANAGER";

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Thông báo"
        subtitle="Xem tin tức, hóa đơn mới phát sinh và các thông tin vận hành từ ban quản lý"
        count={unreadCount}
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm tiêu đề hoặc nội dung thông báo..."
              className="w-full min-w-0 flex-1 sm:w-80"
            />
            {isOperator && (
              <Button onClick={sendModal.broadcastModal.onOpen} className="flex items-center gap-2 rounded-xl shrink-0 shadow-md font-semibold">
                <Plus size={16} />
                <span>Phát thông báo mới</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-4 font-sans">
        <div className="col-span-12 sm:col-span-3">
          <Combobox
            options={[
              { value: "false", label: "Chưa đọc" },
              { value: "true", label: "Đã đọc" },
            ]}
            value={isReadFilter}
            onChange={setIsReadFilter}
            placeholder="Tất cả trạng thái"
            searchable={false}
            triggerClassName="h-[42px] rounded-xl border-gray-200"
            clearable={true}
          />
        </div>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-75">
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
            onViewDetails={detail.openModal}
          />
          <div className="pt-2">
            <DefaultPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {isOperator && (
        <NotificationBroadcastModal
          isOpen={sendModal.broadcastModal.isOpen}
          onClose={sendModal.broadcastModal.onClose}
          role={role}
          buildings={sendModal.buildings}
          apartments={sendModal.apartments}
          loadingApartments={sendModal.loadingApartments}
          title={sendModal.title}
          setTitle={sendModal.setTitle}
          content={sendModal.content}
          setContent={sendModal.setContent}
          type={sendModal.type}
          setType={sendModal.setType}
          buildingId={sendModal.buildingId}
          setBuildingId={sendModal.setBuildingId}
          targetType={sendModal.targetType}
          setTargetType={sendModal.setTargetType}
          selectedApartmentIds={sendModal.selectedApartmentIds}
          handleToggleApartment={sendModal.handleToggleApartment}
          handleSendNotificationSubmit={sendModal.handleSendNotificationSubmit}
          isSending={sendModal.isSending}
        />
      )}

      <NotificationDetailModal
        isOpen={detail.isOpen}
        onClose={detail.closeModal}
        notification={detail.selectedNotif}
      />
    </div>
  );
}
