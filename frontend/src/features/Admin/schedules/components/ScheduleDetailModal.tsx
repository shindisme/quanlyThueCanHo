import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import type { ViewingSchedule, Building } from "../../../../types";
import { formatApartmentDisplay, parseGuestName } from "../../../../utils/string";
import { formatVietnamDate, formatDateTime } from "../../../../utils/date";
import {
  ATTENDANCE_STATUS_CONFIG,
  SCHEDULE_STATUS_CONFIG,
  type AttendanceStatus,
  type ScheduleStatus,
} from "../../../../constants";
interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ViewingSchedule | null;
  role: string | null;
  buildings?: Building[];
  buildingMap?: Record<number, Building>;
}

export default function ScheduleDetailModal({
  isOpen,
  onClose,
  schedule,
  role,
  buildings = [],
  buildingMap,
}: ScheduleDetailModalProps) {
  function getStatusBadge(status: ScheduleStatus) {
    const config = SCHEDULE_STATUS_CONFIG[status];
    return <Badge variant={config.badge}>{config.label}</Badge>;
  }

  function getAttendanceBadge(attendance?: AttendanceStatus) {
    const key = (attendance || "NOT_YET") as AttendanceStatus;
    const config = ATTENDANCE_STATUS_CONFIG[key];
    return <Badge variant={config.badge}>{config.label}</Badge>;
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
        const building = schedule.apartment?.building_id
          ? buildingMap?.[schedule.apartment.building_id] || buildings.find((b) => b.id === schedule.apartment?.building_id)
          : undefined;
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
              <span className="font-semibold text-gray-855">{building?.branch_name || "Yuki House"}</span>
            </div>
            <div className="flex flex-col border-b pb-2 border-gray-100 gap-1">
              <span className="text-gray-500 font-medium">Địa chỉ tòa nhà:</span>
              <span className="font-semibold text-gray-700 text-xs text-right max-w-xs ml-auto leading-normal">{building?.address || "-"}</span>
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
              <span className="text-gray-500 font-medium">Ngày xem:</span>
              <span className="font-semibold text-gray-800">
                {formatVietnamDate(schedule.schedule_time)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Trạng thái duyệt:</span>
              <span>{getStatusBadge(schedule.status)}</span>
            </div>
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Kết quả xem phòng:</span>
              <span>{getAttendanceBadge(schedule.attendance_status)}</span>
            </div>
            {schedule.cancel_reason && (
              <div className="flex justify-between border-b pb-2 border-gray-100">
                <span className="text-gray-500 font-medium">Lý do hủy:</span>
                <span className="font-medium text-red-600 max-w-xs text-right">{schedule.cancel_reason}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Thời điểm đăng ký:</span>
              <span className="font-semibold text-gray-800">
                {formatDateTime(schedule.created_at)}
              </span>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
