import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { User } from "../../../../types";

interface UserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
  loading?: boolean;
}

export default function UserDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading = false,
}: UserDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa tài khoản"
      message={`Bạn có chắc chắn muốn xóa tài khoản "${user?.username}"? Hành động này không thể hoàn tác.`}
      confirmText="Xóa"
      isLoading={loading}
    />
  );
}
