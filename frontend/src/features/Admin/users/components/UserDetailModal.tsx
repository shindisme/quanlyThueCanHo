import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import { formatDateTime } from "../../../../utils/date";
import { ROLE_CONFIG, USER_STATUS_CONFIG } from "../../../../constants/badges";
import type { Role, UserStatus } from "../../../../constants/enums";
import type { User } from "../../../../types";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  fullName: string;
}

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  fullName,
}: UserDetailModalProps) {
  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role as Role] || { label: user.role, badge: "gray" as const };
  const statusConfig = USER_STATUS_CONFIG[user.status as UserStatus] || { label: user.status, badge: "gray" as const };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tài khoản"
      size="md"
      footer={
        <Button onClick={onClose} className="rounded-xl font-semibold">
          Đóng
        </Button>
      }
    >
      <div className="space-y-4 font-sans text-sm text-left">
        <div className="flex justify-between items-center border-b pb-2.5 border-gray-100">
          <span className="text-gray-500 font-medium">Mã tài khoản (ID):</span>
          <span className="font-semibold font-mono text-gray-800">#{user.id}</span>
        </div>

        <div className="flex justify-between items-center border-b pb-2.5 border-gray-100">
          <span className="text-gray-500 font-medium">Họ và tên:</span>
          <span className="font-semibold text-gray-900">{fullName || <span className="text-gray-400 italic">Trống</span>}</span>
        </div>

        <div className="flex justify-between items-center border-b pb-2.5 border-gray-100">
          <span className="text-gray-500 font-medium">Tên tài khoản (Username):</span>
          <span className="font-semibold text-primary-600">{user.username}</span>
        </div>

        <div className="flex justify-between items-center border-b pb-2.5 border-gray-100">
          <span className="text-gray-500 font-medium">Vai trò (Role):</span>
          <Badge variant={roleConfig.badge}>{roleConfig.label}</Badge>
        </div>

        {user.role === "MANAGER" && (
          <div className="flex justify-between items-center border-b pb-2.5 border-gray-100">
            <span className="text-gray-500 font-medium">Tòa nhà quản lý:</span>
            <span className="font-semibold text-gray-800 text-right">
              {user.managed_building ? user.managed_building.branch_name : <span className="text-gray-400 italic">Chưa phân công</span>}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center border-b pb-2.5 border-gray-100">
          <span className="text-gray-500 font-medium">Trạng thái:</span>
          <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
        </div>

        <div className="flex justify-between items-center border-b pb-2.5 border-gray-100">
          <span className="text-gray-500 font-medium">Ngày tạo:</span>
          <span className="font-semibold text-gray-800">
            {user.created_at ? formatDateTime(user.created_at) : <span className="text-gray-400 italic">Trống</span>}
          </span>
        </div>
      </div>
    </Modal>
  );
}
