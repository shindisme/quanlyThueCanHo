import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { User } from "../../../../types";

interface UserResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
  loading?: boolean;
}

export default function UserResetPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading = false,
}: UserResetPasswordModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Đặt lại mật khẩu"
      message={`Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${user?.username}" không?`}
      confirmText="Đặt lại"
      isLoading={loading}
    />
  );
}
