import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { ContractTermination } from "../../../../types";
import { useCancelContractTermination } from "../hooks/useContractTermination";

interface ContractTerminationCancelDialogProps {
  termination: ContractTermination | null;
  onClose: () => void;
}

export default function ContractTerminationCancelDialog({
  termination,
  onClose,
}: ContractTerminationCancelDialogProps) {
  const cancelMutation = useCancelContractTermination();

  const handleConfirm = async () => {
    if (!termination) return;

    try {
      await cancelMutation.mutateAsync(termination.id);
      onClose();
    } catch {
      // Thông báo lỗi được xử lý trong mutation.
    }
  };

  return (
    <ConfirmDialog
      isOpen={termination !== null}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Hủy yêu cầu trả phòng"
      message="Bạn có chắc muốn hủy yêu cầu trả phòng đang chờ xử lý không?"
      confirmText="Hủy yêu cầu"
      variant="danger"
      isLoading={cancelMutation.isPending}
    />
  );
}
