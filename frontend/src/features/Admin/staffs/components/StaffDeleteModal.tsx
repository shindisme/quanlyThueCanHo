import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { Staff } from "../../../../types";

interface StaffDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  staff: Staff | null;
  loading?: boolean;
}

export default function StaffDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  staff,
  loading = false,
}: StaffDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa nhân viên"
      message={`Bạn có chắc chắn muốn xóa nhân viên "${staff?.full_name}" khỏi hệ thống không?`}
      isLoading={loading}
    />
  );
}
