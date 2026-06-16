import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { ScheduleData } from "../../../../services/scheduleService";

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
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa lịch xem phòng"
      message={`Xóa lịch xem phòng của "${schedule?.guest_name}"?`}
      confirmText="Xóa"
    />
  );
}
