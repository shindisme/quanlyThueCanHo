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
  const username = user?.username ?? "";

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      onConfirm={onConfirm}
      title="Đặt lại mật khẩu"
      message={`Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${username}" không? Mật khẩu sẽ được khởi tạo về mặc định "123123".`}
      confirmText="Đặt lại mật khẩu"
      isLoading={loading}
    />
  );
}
