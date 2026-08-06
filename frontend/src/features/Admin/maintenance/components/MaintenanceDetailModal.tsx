import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import { getImageUrl } from "../../../../utils/file";
import { formatDate } from "../../../../utils/date";
import {
  REQUEST_STATUS_CONFIG,
  PRIORITY_CONFIG,
  type RequestStatus,
  type Priority,
  type Role,
} from "../../../../constants/enums";
import type { MaintenanceRequest } from "../../../../types";

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detailRequest: MaintenanceRequest | null;
  role: Role | string | null;
  onUpdatePriority?: (id: number, priority: Priority) => void;
}

function getStatusBadge(status: string) {
  const config = REQUEST_STATUS_CONFIG[status as RequestStatus];
  return <Badge variant={config?.badge || "gray"}>{config?.label || status}</Badge>;
}

function getPriorityBadge(priority: string) {
  const config = PRIORITY_CONFIG[priority as Priority];
  return <Badge variant={config?.badge || "gray"}>{config?.label || priority}</Badge>;
}

export default function MaintenanceDetailModal({
  isOpen,
  onClose,
  detailRequest,
  role,
  onUpdatePriority,
}: MaintenanceDetailModalProps) {
  if (!detailRequest) return null;

  const canAssign = role === "ADMIN" || role === "MANAGER";
  const {
    id,
    title,
    created_at,
    status,
    priority = "MEDIUM",
    description,
    image_url,
    apartment,
    tenant,
    assigned_staff,
    scheduled_at,
    unable_reason,
  } = detailRequest;

  const handlePrioritySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as Priority;
    if (onUpdatePriority) {
      onUpdatePriority(id, newPriority);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Yêu Cầu Sửa Chữa" size="lg">
      <div className="space-y-6 text-sm font-sans text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h4 className="text-base font-bold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-400 mt-1">Ngày gửi: {formatDate(created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(status)}
            {getPriorityBadge(priority)}
          </div>
        </div>

        {/* Tenant info */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6 bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Thông tin phòng thuê</h5>
            <p><span className="font-semibold text-gray-600">Căn hộ:</span> P.{apartment?.room_number || "Chưa rõ"}</p>
            <p><span className="font-semibold text-gray-600">Tầng:</span> Tầng {apartment?.floor || "Chưa rõ"}</p>
            {role === "ADMIN" && (
              <p><span className="font-semibold text-gray-600">Chi nhánh:</span> {apartment?.building?.branch_name || "Chưa rõ"}</p>
            )}
          </div>
          <div className="col-span-12 md:col-span-6 bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Người gửi yêu cầu</h5>
            <p><span className="font-semibold text-gray-600">Họ và tên:</span> {tenant?.full_name || "Chưa rõ"}</p>
            <p><span className="font-semibold text-gray-600">Số điện thoại:</span> {tenant?.phone || "-"}</p>
            <p><span className="font-semibold text-gray-600">Email:</span> {tenant?.email || "-"}</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h5 className="font-bold text-gray-800 border-b border-gray-100 pb-1">Mô tả sự cố</h5>
          <div className="bg-white p-3.5 rounded-none border border-gray-200 text-gray-700 min-h-20 whitespace-pre-wrap leading-relaxed">
            {description}
          </div>
        </div>

        {/* Image - Full 12 columns centered */}
        {image_url && (
          <div className="col-span-12 w-full pt-2 flex flex-col items-center justify-center text-center">
            <span className="block text-xs font-semibold text-gray-600 mb-2">Hình ảnh đính kèm chỗ hư hại</span>
            <a href={getImageUrl(image_url)} target="_blank" rel="noreferrer" className="w-full flex flex-col items-center group cursor-pointer">
              <img
                src={getImageUrl(image_url)}
                alt="Hình ảnh sự cố thực tế"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                }}
                className="w-full max-w-2xl max-h-96 object-contain rounded-none border border-gray-300 shadow-xs mx-auto group-hover:opacity-90 transition-opacity"
              />
              <span className="text-xs text-primary-600 font-semibold mt-2 inline-block">Bấm để xem ảnh phóng to / tải ảnh gốc</span>
            </a>
          </div>
        )}

        {/* Assignment */}
        <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
          <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Phân công xử lý</h5>
          {assigned_staff ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <p><span className="font-semibold text-gray-600">Kỹ thuật viên:</span> {assigned_staff.full_name}</p>
              <p><span className="font-semibold text-gray-600">Số điện thoại:</span> {assigned_staff.phone || "-"}</p>
              <p className="col-span-1 md:col-span-2"><span className="font-semibold text-gray-600">Lịch hẹn sửa:</span> {scheduled_at ? formatDate(scheduled_at) : "-"}</p>
            </div>
          ) : (
            <p className="text-gray-400 italic text-xs">Yêu cầu này chưa được phân công kỹ thuật viên phụ trách.</p>
          )}
          {unable_reason && (
            <div className="mt-3 pt-2.5 border-t border-gray-200">
              <span className="font-semibold text-red-600 block text-xs">Lý do không thể sửa chữa:</span>
              <p className="text-red-600 italic bg-red-50 p-3 rounded-none mt-1">{unable_reason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button type="button" onClick={onClose} className="font-semibold">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
