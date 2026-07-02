import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { ScheduleData } from "../../../../services/scheduleService";
import { parseGuestName } from "../../../../utils/string";

interface ScheduleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  schedule: ScheduleData | null;
}

export default function ScheduleDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  schedule,
}: ScheduleDeleteModalProps) {
  const cleanName = schedule ? parseGuestName(schedule.guest_name).name : "";
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa lịch xem phòng"
      message={`Xóa lịch xem phòng của "${cleanName}"?`}
      confirmText="Xóa"
    />
  );
}
