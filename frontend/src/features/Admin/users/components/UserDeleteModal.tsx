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
  const username = user?.username ?? "";

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      onConfirm={onConfirm}
      title="Xóa tài khoản"
      message={`Bạn có chắc chắn muốn xóa tài khoản "${username}"? Thao tác này không thể hoàn tác.`}
      confirmText="Xóa tài khoản"
      isLoading={loading}
    />
  );
}
