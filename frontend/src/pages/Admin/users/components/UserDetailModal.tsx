import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Badge from "../../../../components/ui/Badge";
import type { UserData } from "../../../../services/authService";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
}

export default function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  function getRoleBadge(role: string) {
    const map: Record<string, { label: string; variant: string }> = {
      ADMIN: { label: "Admin", variant: "danger" },
      MANAGER: { label: "Quản lý", variant: "warning" },
      TENANT: { label: "Người thuê", variant: "info" },
    };
    const r = map[role] || { label: role, variant: "gray" };
    return <Badge variant={r.variant as any}>{r.label}</Badge>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tài khoản"
      size="md"
      footer={
        <Button onClick={onClose}>Đóng</Button>
      }
    >
      {user && (
        <div className="space-y-4 font-sans text-sm">
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Mã tài khoản (ID):</span>
            <span className="font-semibold text-gray-800">#{user.id}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Username:</span>
            <span className="font-semibold text-gray-800">{user.username}</span>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Vai trò (Role):</span>
            <span>{getRoleBadge(user.role)}</span>
          </div>
          {user.role === "MANAGER" && (
            <div className="flex justify-between border-b pb-2 border-gray-100">
              <span className="text-gray-500 font-medium">Tòa nhà quản lý:</span>
              <span className="font-semibold text-gray-800 text-right">
                {user.managed_buildings && user.managed_buildings.length > 0
                  ? user.managed_buildings.map((b: any) => b.branch_name).join(", ")
                  : "Chưa phân công"}
              </span>
            </div>
          )}
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Trạng thái:</span>
            <Badge variant={user.status === "ACTIVE" ? "success" : "gray"}>
              {user.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
            </Badge>
          </div>
          <div className="flex justify-between border-b pb-2 border-gray-100">
            <span className="text-gray-500 font-medium">Ngày tạo:</span>
            <span className="font-semibold text-gray-800">
              {user.created_at ? new Date(user.created_at).toLocaleString("vi-VN") : "-"}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
