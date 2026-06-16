import { useState } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import * as authService from "../../../../services/authService";
import { toast } from "sonner";

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCreateModal({ isOpen, onClose, onSuccess }: UserCreateModalProps) {
  const [formData, setFormData] = useState({ username: "", role: "TENANT" });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!formData.username) {
      toast.error("Vui lòng nhập tên tài khoản");
      return;
    }
    setSaving(true);
    try {
      await authService.createUser(formData);
      toast.success("Đã tạo tài khoản mới (mật khẩu mặc định: 123456)");
      setFormData({ username: "", role: "TENANT" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Tạo tài khoản thất bại");
    } finally {
      setSaving(false);
    }
  }

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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="VD: manager_q1"
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="premium-select w-full rounded-xl"
            >
              <option value="TENANT">Người thuê (Tenant)</option>
              <option value="MANAGER">Quản lý (Manager)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400">Mật khẩu mặc định: 123456</p>
      </div>
    </Modal>
  );
}
