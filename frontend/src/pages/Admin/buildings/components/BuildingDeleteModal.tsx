import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { BuildingData } from "../../../../services/buildingService";

interface BuildingDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  building: BuildingData | null;
}

export default function BuildingDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  building,
}: BuildingDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa tòa nhà"
      message={`Bạn chắc chắn muốn xóa tòa nhà "${building?.name}"?`}
      confirmText="Xóa"
    />
  );
}
