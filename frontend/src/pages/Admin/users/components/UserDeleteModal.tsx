import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { UserData } from "../../../../services/authService";

interface UserDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserData | null;
}

export default function UserDeleteModal({ isOpen, onClose, onConfirm, user }: UserDeleteModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa tài khoản"
      message={`Bạn có chắc chắn muốn xóa tài khoản "${user?.username}"?`}
      confirmText="Xóa"
    />
  );
}
