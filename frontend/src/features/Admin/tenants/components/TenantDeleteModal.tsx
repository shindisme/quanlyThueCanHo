import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { Tenant } from "../../../../types";

interface TenantDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tenant: Tenant | null;
  loading?: boolean;
}

export default function TenantDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  tenant,
  loading = false,
}: TenantDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa người thuê"
      message={`Bạn có chắc chắn muốn xóa người thuê "${tenant?.full_name}" không?`}
      isLoading={loading}
    />
  );
}
