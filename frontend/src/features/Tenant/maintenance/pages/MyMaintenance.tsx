import { useState } from "react";
import { Camera, Plus, X, Upload, Eye, Image as ImageIcon } from "lucide-react";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import SearchInput from "../../../../components/ui/SearchInput";
import PageHeader from "../../../../components/layout/PageHeader";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay, removeVietnameseTones } from "../../../../utils/string";
import { getImageUrl } from "../../../../utils/file";
import { formatCurrency } from "../../../../utils/currency";
import { useTenantMaintenance } from "../hooks/useTenantMaintenance";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  type RequestStatus,
  type Priority,
} from "../../../../constants/enums";
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

  const [detailRequest, setDetailRequest] = useState<MaintenanceRequest | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

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

  const confirmCancel = () => {
    if (cancelTargetId) {
      handleCancelRequest(cancelTargetId);
      setCancelTargetId(null);
    }
  };

  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800 w-2">{index + 1}</span>,
    },
    {
      key: "title",
      label: "Tiêu đề sự cố",
      isTitle: true,
      render: (req: MaintenanceRequest) => <span className="font-semibold text-primary-600">{req.title}</span>,
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
      },
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
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setDetailRequest(req)}
            className="p-2 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={15} />
          </button>

          {req.status === "PENDING" && (
            <button
              type="button"
              onClick={() => setCancelTargetId(req.id)}
              disabled={saving}
              className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
              title="Hủy yêu cầu"
            >
              <X size={15} /> Hủy
            </button>
          )}
        </div>
      ),
    },
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
          <Button onClick={createModal.onOpen} disabled={loading || !activeContract} className="gap-2 shadow-xs cursor-pointer rounded-xl font-semibold">
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

      <DataTable columns={columns} data={filteredRequests} emptyMessage="Không tìm thấy yêu cầu sửa chữa nào" />

      {/* Modal gửi yêu cầu mới */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} title="Gửi Yêu Cầu Sửa Chữa Mới">
        <form onSubmit={handleCreateMaintenanceRequest} className="space-y-4 font-sans text-left">
          <Input label="Tiêu đề yêu cầu *" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={saving} className="rounded-lg" />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mô tả chi tiết sự cố *</label>
            <textarea
              className="w-full min-h-25 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Ảnh chỗ hư hại</label>
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 p-3 bg-gray-50/50">
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Ảnh chỗ hư hại" className="h-44 w-full rounded-lg object-contain border border-gray-200 bg-white" />
              ) : (
                <div className="flex h-28 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400">
                  <ImageIcon size={28} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                  <Upload size={15} />
                  Tải ảnh từ máy
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={saving}
                    onChange={(e) => {
                      handleImageChange(e.target.files?.[0] ?? null);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                  <Camera size={15} />
                  Chụp ảnh trực tiếp
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
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <X size={15} /> Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={createModal.onClose} disabled={saving} className="rounded-xl">
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl font-semibold">
              Gửi yêu cầu
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal xác nhận hủy yêu cầu */}
      {cancelTargetId && (
        <Modal isOpen={Boolean(cancelTargetId)} onClose={() => setCancelTargetId(null)} title="Xác nhận hủy yêu cầu" size="sm">
          <div className="space-y-4 font-sans text-left text-sm">
            <p className="text-gray-600">Bạn có chắc chắn muốn hủy yêu cầu sửa chữa này không? Thao tác này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setCancelTargetId(null)} disabled={saving} className="rounded-xl">
                Không, giữ lại
              </Button>

              <Button variant="danger" type="button" onClick={confirmCancel} isLoading={saving} className="rounded-xl font-semibold">
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal xem chi tiết sự cố cho Cư dân */}
      {detailRequest && (
        <Modal isOpen={Boolean(detailRequest)} onClose={() => setDetailRequest(null)} title="Chi Tiết Yêu Cầu Sửa Chữa" size="lg">
          <div className="space-y-5 text-sm font-sans text-left">
            <div className="flex flex-col sm:flex-row justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h4 className="text-base font-bold text-gray-900">{detailRequest.title}</h4>
                <p className="text-xs text-gray-400 mt-1">Ngày gửi: {formatDate(detailRequest.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(detailRequest.status as RequestStatus)}
                {getPriorityBadge(detailRequest.priority as Priority)}
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-gray-800">Mô tả chi tiết</h5>
              <div className="bg-gray-50/60 p-3.5 border border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
                {detailRequest.description}
              </div>
            </div>

            {detailRequest.image_url && (
              <div className="col-span-12 w-full flex flex-col items-center justify-center text-center ">
                <h5 className="font-bold text-gray-800 mb-2 w-full text-left">Hình ảnh chỗ hư hại</h5>
                <a href={getImageUrl(detailRequest.image_url)} target="_blank" rel="noreferrer" className="w-full flex flex-col items-center group cursor-pointer">
                  <img
                    src={getImageUrl(detailRequest.image_url)}
                    alt="Ảnh chỗ hư hại"
                    className="w-full max-w-2xl max-h-96 object-contain rounded-none border border-gray-300 shadow-xs mx-auto group-hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                </a>
              </div>
            )}

            {detailRequest.assigned_staff && (
              <div className="bg-blue-50/40 p-3.5 rounded-none border border-blue-100 space-y-1.5 text-xs text-blue-900">
                <p className="font-bold text-sm text-blue-950">Thông tin Nhân viên kỹ thuật phụ trách</p>
                <p><span className="font-semibold">Họ tên:</span> {detailRequest.assigned_staff.full_name}</p>
                <p><span className="font-semibold">Số điện thoại:</span> {detailRequest.assigned_staff.phone || "Không"}</p>
                <p><span className="font-semibold">Dự kiến sửa trước ngày:</span> {detailRequest.scheduled_at ? formatDate(detailRequest.scheduled_at) : "Chưa xếp lịch"}</p>
              </div>
            )}

            {detailRequest.unable_reason && (
              <div className="bg-red-50/60 p-3.5 rounded-none border border-red-200 text-xs text-red-700 space-y-1">
                <p className="font-bold text-red-800">Lý do cản trở kỹ thuật được báo cáo:</p>
                <p className="italic">{detailRequest.unable_reason}</p>
              </div>
            )}

            {/* Chi phí sửa chữa */}
            {(detailRequest.status === "DONE" || detailRequest.charge_tenant !== undefined) && (
              <div className="bg-gray-50/50 p-3.5 rounded-none border border-gray-200 space-y-1 text-xs">
                <p className="font-bold text-sm text-gray-900 border-b border-gray-200 pb-1 mb-1.5">Chi phí sửa chữa</p>
                {detailRequest.charge_tenant ? (
                  <p className="text-amber-700 font-bold text-sm">
                    <span className="font-semibold text-gray-600">Loại chi phí:</span> Có tính phí ({formatCurrency(detailRequest.repair_fee || 0)})
                  </p>
                ) : (
                  <p className="text-emerald-700 font-bold text-sm">
                    <span className="font-semibold text-gray-600">Loại chi phí:</span> Không tính phí
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button type="button" onClick={() => setDetailRequest(null)} className="rounded-xl font-semibold">
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
