import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useUserCreate } from "../../../../hooks/admin/useUserCreate";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCreateModal({ isOpen, onClose, onSuccess }: UserCreateModalProps) {
  const { formData, setFormData, saving, handleCreate } = useUserCreate({ onClose, onSuccess });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm tài khoản mới"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleCreate} isLoading={saving}>Tạo tài khoản</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Input
              label="Họ và tên"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Nhập họ và tên người dùng"
              className="rounded-md"
            />
          </div>
          <div className="col-span-12">
            <Input
              label="Username *"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Nhập username"
              className="rounded-md"
            />
          </div>
          <div className="col-span-12">
            <Combobox
              label="Role *"
              options={[
                { value: "TENANT", label: "Người thuê (Tenant)" },
                { value: "MANAGER", label: "Quản lý (Manager)" },
                { value: "ADMIN", label: "Quản trị viên (Admin)" }
              ]}
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val })}
              placeholder="Chọn vai trò"
              searchable={false}
              triggerClassName="rounded-md"
              clearable={false}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">Mật khẩu ngẫu nhiên sẽ được tạo tự động và hiển thị sau khi lưu.</p>
      </div>
    </Modal>
  );
}
