import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { UtilityReadingData } from "../../../../services/utilityService";

interface UtilityDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: UtilityReadingData | null;
}

export default function UtilityDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}: UtilityDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa chỉ số điện nước"
      message={`Bạn có chắc chắn muốn xóa bản ghi chỉ số điện nước tháng ${item?.month}/${item?.year} của căn hộ P.${item?.apartment?.floor}${item?.apartment?.room_number}?`}
      confirmText="Xóa"
    />
  );
}
