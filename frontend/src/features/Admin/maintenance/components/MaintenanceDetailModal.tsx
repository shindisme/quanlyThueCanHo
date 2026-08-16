import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import { getImageUrl } from "../../../../utils/file";
import { formatDate, formatDateTime } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import {
  REQUEST_STATUS_CONFIG,
  PRIORITY_CONFIG,
  type RequestStatus,
  type Priority,
  type Role,
} from "../../../../constants";
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

const renderEmptyText = (val?: string | number | null) => {
  if (!val && val !== 0) {
    return <span className="text-gray-400 italic font-normal">Trống</span>;
  }
  return val;
};

export default function MaintenanceDetailModal({
  isOpen,
  onClose,
  detailRequest,
}: MaintenanceDetailModalProps) {
  if (!detailRequest) return null;

  const {
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
    charge_tenant,
    repair_fee,
  } = detailRequest;

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

        {/* Info */}
        <div className="grid grid-cols-12 gap-4">
          {/* Information */}
          <div className="col-span-12 md:col-span-6 bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2 flex flex-col justify-between">
            <div>
              <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Thông tin người gửi & phòng</h5>
              <div className="space-y-2">
                <p><span className="font-semibold text-gray-600">Căn hộ:</span> {apartment ? formatApartmentDisplay(apartment.room_number, apartment.floor) : <span className="text-gray-400 italic font-normal">Trống</span>}</p>
                <p><span className="font-semibold text-gray-600">Chi nhánh:</span> {renderEmptyText(apartment?.building?.branch_name)}</p>
                <p><span className="font-semibold text-gray-600">Họ tên người gửi:</span> {renderEmptyText(tenant?.full_name)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="col-span-12 md:col-span-6 bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2 flex flex-col">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Mô tả sự cố</h5>
            <div className="bg-white p-3.5 rounded-none border border-gray-200 text-gray-700 flex-1 whitespace-pre-wrap leading-relaxed min-h-[90px]">
              {description || <span className="text-gray-400 italic font-normal">Trống</span>}
            </div>
          </div>
        </div>

        {/* Image */}
        {image_url && (
          <div className="col-span-12 w-full pt-2 flex flex-col items-center justify-center text-center">
            <span className="block text-xs font-semibold text-gray-600 mb-2">Hình ảnh đính kèm chỗ hư hại</span>
            <a href={getImageUrl(image_url)} target="_blank" rel="noreferrer" className="w-full flex flex-col items-center group cursor-pointer">
              <img
                src={getImageUrl(image_url)}
                alt="Hình ảnh sự cố thực tế"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
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
              <p><span className="font-semibold text-gray-600">Số điện thoại:</span> {renderEmptyText(assigned_staff.phone)}</p>
              <p className="col-span-1 md:col-span-2">
                <span className="font-semibold text-gray-600">Thời gian hẹn sửa chữa:</span>{" "}
                {scheduled_at ? formatDateTime(scheduled_at) : <span className="text-gray-400 italic font-normal">Trống</span>}
              </p>
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

        {/* Chi phí sửa chữa */}
        {(status === "DONE" || charge_tenant !== undefined) && (
          <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-1">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Chi phí sửa chữa</h5>
            {charge_tenant ? (
              <p className="text-amber-700 font-bold text-sm">
                <span className="font-semibold text-gray-600">Loại chi phí:</span> Có tính phí ({formatCurrency(repair_fee || 0)})
              </p>
            ) : (
              <p className="text-emerald-700 font-bold text-sm">
                <span className="font-semibold text-gray-600">Loại chi phí:</span> Không tính phí
              </p>
            )}
          </div>
        )}

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
