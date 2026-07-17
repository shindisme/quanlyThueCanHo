import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { Apartment } from "../../../../types";

interface ApartmentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  apartment: Apartment | null;
  loading?: boolean;
}

export default function ApartmentDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  apartment,
  loading = false,
}: ApartmentDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa căn hộ"
      message={`Xóa căn hộ phòng "${apartment?.room_number}" tầng ${apartment?.floor}? Hành động này không thể hoàn tác.`}
      confirmText="Xóa"
      isLoading={loading}
    />
  );
}
