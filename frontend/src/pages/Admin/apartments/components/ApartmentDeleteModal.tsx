import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { ApartmentData } from "../../../../services/apartmentService";

interface ApartmentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  apartment: ApartmentData | null;
}

export default function ApartmentDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  apartment,
}: ApartmentDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa căn hộ"
      message={`Xóa căn hộ phòng "${apartment?.room_number}" tầng ${apartment?.floor}?`}
      confirmText="Xóa"
    />
  );
}
