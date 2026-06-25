import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import type { ScheduleData } from "../../../../services/scheduleService";
import { formatApartmentDisplay, parseGuestName } from "../../../../utils/format";
import type { BuildingData } from "../../../../services/buildingService";

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleData | null;
  role: string | null;
  buildings?: BuildingData[];
}

export default function ScheduleDetailModal({
  isOpen,
  onClose,
  schedule,
  role,
  buildings = [],
}: ScheduleDetailModalProps) {
  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: "success" | "warning" | "gray" | "info" | "danger" }> = {
      PENDING: { label: "Chờ xác nhận", variant: "warning" },
      CONFIRMED: { label: "Đã xác nhận", variant: "success" },
      CANCELLED: { label: "Đã hủy", variant: "gray" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết lịch xem phòng"
      size="md"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      {schedule && (() => {
        const building = buildings.find((b) => b.id === schedule.apartment?.building_id);
        const { name: guestName, note: guestNote } = parseGuestName(schedule.guest_name);
        return (
          <div className="space-y-4 font-sans text-sm">
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Họ và tên khách:</span>
              <span className="font-semibold text-gray-800">{guestName}</span>
            </div>
            {guestNote && (
              <div className="flex justify-between border-b pb-2 border-gray-100">
                <span className="text-gray-500 font-medium">Ghi chú:</span>
                <span className="font-semibold text-amber-600">{guestNote}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Số điện thoại:</span>
              <span className="font-semibold text-gray-800">{schedule.guest_phone}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Email khách:</span>
              <span className="font-semibold text-gray-800">{schedule.guest_email || "-"}</span>
            </div>

            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Tên tòa nhà:</span>
              <span className="font-semibold text-gray-850">{building?.branch_name || building?.name || "Yuki House"}</span>
            </div>
            <div className="flex flex-col border-b pb-2 border-gray-100 gap-1">
              <span className="text-gray-500 font-medium">Địa chỉ tòa nhà:</span>
              <span className="font-semibold text-gray-700 text-xs text-right max-w-xs ml-auto leading-normal">{building?.address_new || building?.address_old || "-"}</span>
            </div>

            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Căn hộ:</span>
              <span className="font-semibold text-gray-800">
                {schedule.apartment ? (
                  formatApartmentDisplay(
                    schedule.apartment.room_number,
                    schedule.apartment.floor,
                    role || undefined,
                    building?.branch_name
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
        );
      })()}
    </Modal>
  );
}
