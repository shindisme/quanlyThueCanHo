import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import type { ScheduleData } from "../../../../services/scheduleService";
import { formatApartmentDisplay } from "../../../../utils/format";
import { mockBuildings } from "../../../../data/buildings";

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleData | null;
  role: string | null;
}

export default function ScheduleDetailModal({
  isOpen,
  onClose,
  schedule,
  role,
}: ScheduleDetailModalProps) {
  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      PENDING: { label: "Chờ xác nhận", variant: "warning" },
      CONFIRMED: { label: "Đã xác nhận", variant: "success" },
      CANCELLED: { label: "Đã hủy", variant: "gray" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết lịch xem phòng"
      size="md"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      {schedule && (
        <div className="space-y-4 font-sans text-sm">
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Họ và tên khách:</span>
            <span className="font-semibold text-gray-800">{schedule.guest_name}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Số điện thoại:</span>
            <span className="font-semibold text-gray-800">{schedule.guest_phone}</span>
          </div>

          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Căn hộ:</span>
            <span className="font-semibold text-gray-800">
              {schedule.apartment ? (
                formatApartmentDisplay(
                  schedule.apartment.room_number,
                  schedule.apartment.floor,
                  role || undefined,
                  mockBuildings.find((b) => b.id === schedule.apartment?.building_id)?.branch_name
                )
              ) : (
                `#${schedule.apartment_id}`
              )}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Thời gian hẹn:</span>
            <span className="font-semibold text-gray-800">
              {new Date(schedule.schedule_time).toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Trạng thái:</span>
            <span>{getStatusBadge(schedule.status)}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Thời điểm đăng ký:</span>
            <span className="font-semibold text-gray-800">
              {schedule.created_at ? new Date(schedule.created_at).toLocaleString("vi-VN") : "-"}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
