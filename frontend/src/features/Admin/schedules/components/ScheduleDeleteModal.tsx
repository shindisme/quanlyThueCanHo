import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { ViewingSchedule } from "../../../../types";
import { parseGuestName } from "../../../../utils/string";

interface ScheduleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  schedule: ViewingSchedule | null;
  loading?: boolean;
}

export default function ScheduleDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  schedule,
  loading = false,
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
      isLoading={loading}
    />
  );
}
