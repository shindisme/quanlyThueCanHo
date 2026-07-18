import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import { formatDate } from "../../../../utils/date";

interface MaintenanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailRequest: any;
  role: string | null;
}

export default function MaintenanceDetailModal({
  isOpen,
  onClose,
  detailRequest,
  role,
}: MaintenanceDetailModalProps) {
  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
      PENDING: { label: "Chờ xử lý", variant: "warning" },
      PROCESSING: { label: "Đang sửa chữa", variant: "info" },
      DONE: { label: "Hoàn thành", variant: "success" },
      NEEDS_RESCHEDULE: { label: "Báo không sửa được", variant: "danger" },
    };
    const s = statusMap[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  }

  function getPriorityBadge(priority: string) {
    if (priority === "HIGH") return <Badge variant="danger">Khẩn cấp</Badge>;
    if (priority === "MEDIUM") return <Badge variant="warning">Trung bình</Badge>;
    return <Badge variant="gray">Thấp</Badge>;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết Yêu Cầu Sửa Chữa" size="lg">
      {detailRequest && (
        <div className="space-y-6 text-sm font-sans">
          {/* Header / Basic info */}
          <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h4 className="text-base font-bold text-gray-900">{detailRequest.title}</h4>
              <p className="text-xs text-gray-400 mt-1">Ngày gửi: {formatDate(detailRequest.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(detailRequest.status)}
              {getPriorityBadge(detailRequest.priority)}
            </div>
          </div>

          {/* Room / Tenant info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
              <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Thông tin phòng thuê</h5>
              <p><span className="font-semibold text-gray-600">Căn hộ:</span> P.{detailRequest.apartment?.room_number || "Chưa rõ"}</p>
              <p><span className="font-semibold text-gray-600">Tầng:</span> Tầng {detailRequest.apartment?.floor || "Chưa rõ"}</p>
              {role === "ADMIN" && (
                <p><span className="font-semibold text-gray-600">Chi nhánh:</span> {detailRequest.apartment?.building?.branch_name || "Chưa rõ"}</p>
              )}
            </div>
            <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
              <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Người gửi yêu cầu</h5>
              <p><span className="font-semibold text-gray-600">Họ và tên:</span> {detailRequest.tenant?.full_name || "Chưa rõ"}</p>
              <p><span className="font-semibold text-gray-600">Số điện thoại:</span> {detailRequest.tenant?.phone || "-"}</p>
              <p><span className="font-semibold text-gray-600">Email:</span> {detailRequest.tenant?.email || "-"}</p>
            </div>
          </div>

          {/* Description & Image */}
          <div className="space-y-2">
            <h5 className="font-bold text-gray-850 border-b border-gray-100 pb-1">Mô tả sự cố</h5>
            <div className="bg-white p-3 rounded-none border border-gray-200 text-gray-700 min-h-[80px] whitespace-pre-wrap leading-relaxed">
              {detailRequest.description}
            </div>
            {detailRequest.image_url && (
              <div className="mt-3">
                <span className="block text-xs font-semibold text-gray-400 mb-1.5">Hình ảnh đính kèm:</span>
                <img
                  src={detailRequest.image_url}
                  alt="Hình ảnh sự cố thực tế"
                  className="max-w-md w-full max-h-[300px] object-contain rounded-none border border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Assignment & Process Info */}
          <div className="bg-gray-50/50 p-4 rounded-none border border-gray-200 space-y-2">
            <h5 className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">Phân công xử lý</h5>
            {detailRequest.assigned_staff ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <p><span className="font-semibold text-gray-600">Kỹ thuật viên:</span> {detailRequest.assigned_staff.full_name}</p>
                <p><span className="font-semibold text-gray-600">Số điện thoại:</span> {detailRequest.assigned_staff.phone}</p>
                <p className="col-span-1 md:col-span-2"><span className="font-semibold text-gray-600">Lịch hẹn sửa:</span> {detailRequest.scheduled_at ? formatDate(detailRequest.scheduled_at) : "-"}</p>
              </div>
            ) : (
              <p className="text-gray-400 italic text-xs">Yêu cầu này chưa được phân công kỹ thuật viên phụ trách.</p>
            )}
            {detailRequest.unable_reason && (
              <div className="mt-3 pt-2.5 border-t border-gray-200">
                <span className="font-semibold text-red-650 block text-xs">Lý do kỹ thuật / cản trở được báo cáo:</span>
                <p className="text-red-600 italic bg-red-50 p-2.5 rounded-none mt-1">{detailRequest.unable_reason}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-2.5 border-t border-gray-100">
            <Button type="button" onClick={onClose} className="rounded-none">
              Đóng
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
