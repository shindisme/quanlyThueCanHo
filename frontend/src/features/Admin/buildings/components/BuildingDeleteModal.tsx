import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { Building } from "../../../../types";

interface BuildingDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  building: Building | null;
  loading?: boolean;
}

export default function BuildingDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  building,
  loading = false,
}: BuildingDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa tòa nhà"
      message={`Bạn chắc chắn muốn xóa tòa nhà "${building?.branch_name || building?.branch_name}"? Hành động này không thể hoàn tác.`}
      confirmText="Xóa"
      isLoading={loading}
    />
  );
}
