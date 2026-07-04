import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import type { UserData } from "../../../../services/authService";

interface UserResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserData | null;
}

export default function UserResetPasswordModal({ isOpen, onClose, onConfirm, user }: UserResetPasswordModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Đặt lại mật khẩu"
      message={`Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${user?.username}" không? Mật khẩu mới sẽ được tạo lại ngẫu nhiên và hiển thị sau khi thực hiện.`}
      confirmText="Đặt lại"
    />
  );
}
