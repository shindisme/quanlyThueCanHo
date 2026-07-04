import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useUserModify } from "../../../../hooks/admin/useUserModify";
import type { UserData } from "../../../../services/authService";

interface UserModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserData | null;
  initialFullName: string;
  isNameEditable: boolean;
}

export default function UserModifyModal({ isOpen, onClose, onSuccess, user, initialFullName, isNameEditable }: UserModifyModalProps) {
  const {
    username,
    setUsername,
    role,
    setRole,
    status,
    setStatus,
    fullName,
    setFullName,
    saving,
    handleSave,
  } = useUserModify({ user, onClose, onSuccess, initialFullName });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa tài khoản"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} isLoading={saving}>Lưu thay đổi</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Input
              label="Họ và tên"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={"Nhập họ và tên người dùng"}
              disabled={!isNameEditable}
              className={`rounded-md ${!isNameEditable ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="col-span-12">
            <Input
              label="Username *"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
              className="rounded-md"
            />
          </div>
          <div className="col-span-12">
            <Combobox
              label="Vai trò *"
              options={[
                { value: "TENANT", label: "Người thuê (Tenant)" },
                { value: "MANAGER", label: "Quản lý (Manager)" },
                { value: "ADMIN", label: "Quản trị viên (Admin)" }
              ]}
              value={role}
              onChange={(val) => setRole(val)}
              placeholder="Chọn vai trò"
              searchable={false}
              triggerClassName="rounded-md"
              clearable={false}
            />
          </div>
          <div className="col-span-12">
            <Combobox
              label="Trạng thái *"
              options={[
                { value: "ACTIVE", label: "Hoạt động" },
                { value: "INACTIVE", label: "Tạm khóa" }
              ]}
              value={status}
              onChange={(val) => setStatus(val)}
              placeholder="Chọn trạng thái"
              searchable={false}
              triggerClassName="rounded-md"
              clearable={false}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
