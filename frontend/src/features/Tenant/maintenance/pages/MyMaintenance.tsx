import { Camera, Plus, X } from "lucide-react";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import SearchInput from "../../../../components/ui/SearchInput";
import PageHeader from "../../../../components/layout/PageHeader";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay, removeVietnameseTones } from "../../../../utils/string";
import { useTenantMaintenance } from "../hooks/useTenantMaintenance";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, type RequestStatus, type Priority } from "../../../../constants/enums";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { MaintenanceRequest } from "../../../../types";

export default function MyMaintenance() {
  const {
    myRequests,
    search,
    setSearch,
    createModal,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    imageFile,
    imagePreviewUrl,
    handleImageChange,
    clearImage,
    loading,
    handleCreateMaintenanceRequest,
    handleCancelRequest,
    activeContract,
    saving,
  } = useTenantMaintenance();

  const filteredRequests = myRequests.filter((r) => {
    const term = removeVietnameseTones(search.toLowerCase());
    const titleNorm = removeVietnameseTones(r.title.toLowerCase());
    const descNorm = removeVietnameseTones(r.description.toLowerCase());
    return titleNorm.includes(term) || descNorm.includes(term);
  });

  function getStatusBadge(status: RequestStatus) {
    const label = REQUEST_STATUS_LABELS[status] || status;
    const variant = REQUEST_STATUS_COLORS[status] || "gray";
    return <Badge variant={variant as BadgeVariant}>{label}</Badge>;
  }

  function getPriorityBadge(priority: Priority) {
    const label = PRIORITY_LABELS[priority] || priority;
    const variant = PRIORITY_COLORS[priority] || "gray";
    return <Badge variant={variant as BadgeVariant}>{label}</Badge>;
  }

  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800 w-2">{index + 1}</span>,
    },
    {
      key: "created_at",
      label: "Ngày gửi",
      render: (req: MaintenanceRequest) => <span className="text-gray-600 whitespace-nowrap">{formatDate(req.created_at)}</span>,
    },
    {
      key: "room",
      label: "Phòng",
      render: (req: MaintenanceRequest) => {
        const aptRoom = req.apartment ? formatApartmentDisplay(req.apartment.room_number, req.apartment.floor) : "Chưa xác định";
        return <span className="font-medium text-gray-805 whitespace-nowrap">{aptRoom}</span>;
      }
    },
    {
      key: "title",
      label: "Tiêu đề",
      isTitle: true,
      render: (req: MaintenanceRequest) => <span className="font-semibold text-primary-600">{req.title}</span>,
    },
    {
      key: "description",
      label: "Mô tả chi tiết",
      render: (req: MaintenanceRequest) => (
        <span className="text-gray-600 max-w-xs truncate block" title={req.description}>
          {req.description}
        </span>
      )
    },
    {
      key: "priority",
      label: "Độ ưu tiên",
      className: "text-center",
      render: (req: MaintenanceRequest) => getPriorityBadge(req.priority as Priority),
    },
    {
      key: "status",
      label: "Trạng thái",
      className: "text-center",
      render: (req: MaintenanceRequest) => getStatusBadge(req.status as RequestStatus),
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      isAction: true,
      render: (req: MaintenanceRequest) => (
        req.status === "PENDING" ? (
          <button
            type="button"
            onClick={() => handleCancelRequest(req.id)}
            disabled={saving}
            className="p-2 rounded-lg text-gray-500 hover:text-red-605 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            title="Hủy yêu cầu"
          >
            <X size={14} /> Hủy
          </button>
        ) : null
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách yêu cầu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Yêu cầu sửa chữa"
        subtitle="Gửi yêu cầu và theo dõi tiến độ xử lý sự cố thiết bị"
        count={myRequests.length}
        actions={
          <Button onClick={createModal.onOpen} disabled={loading || !activeContract} className="gap-2 shadow-xs cursor-pointer">
            <Plus size={16} /> Tạo yêu cầu mới
          </Button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm yêu cầu..." className="max-w-md" />

      {!activeContract && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-sans font-semibold">
          Lưu ý: Bạn phải có hợp đồng thuê hoạt động mới có thể tạo yêu cầu bảo trì, sửa chữa.
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredRequests}
        emptyMessage="Không tìm thấy yêu cầu sửa chữa nào"
      />

      {/* Modal gửi yêu cầu mới */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} title="Gửi Yêu Cầu Sửa Chữa Mới">
        <form onSubmit={handleCreateMaintenanceRequest} className="space-y-4 font-sans text-left">
          <Input
            label="Tiêu đề yêu cầu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mô tả chi tiết sự cố</label>
            <textarea
              className="w-full min-h-25 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Ảnh chỗ hư hại</label>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 p-3">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Ảnh chỗ hư hại"
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-28 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                  <Camera size={28} />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <Camera size={16} />
                  Chụp hoặc tải ảnh
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={saving}
                    onChange={(e) => {
                      handleImageChange(e.target.files?.[0] ?? null);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={clearImage}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={16} /> Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={createModal.onClose} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving}>Gửi yêu cầu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
