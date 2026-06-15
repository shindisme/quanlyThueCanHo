import { useState } from "react";
import { User, Mail, Save, Plus, Pencil, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import { useAuthStore } from "../../../stores/auth.store";
import { changePassword } from "../../../services/authService";
import { toast } from "sonner";

export default function ProfilePage() {
  const { email, role } = useAuthStore();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName = email?.split("@")[0] || "User";
  const roleLabel =
    role === "ADMIN" ? "Quản trị viên" :
      role === "MANAGER" ? "Quản lý" : "Người thuê";

  async function handleChangePassword() {
    if (!oldPass || !newPass) {
      toast.error("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (newPass.length < 6) {
      toast.error("Mật khẩu mới phải ít nhất 6 ký tự");
      return;
    }
    setSaving(true);
    try {
      await changePassword(oldPass, newPass);
      toast.success("Đổi mật khẩu thành công!");
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        icon={User}
        title="Hồ sơ cá nhân"
        subtitle="Xem thông tin tài khoản và đổi mật khẩu bảo mật"
        iconColor="linear-gradient(135deg, #7C3AED, #A78BFA)"
      />

      {/* Thông tin cá nhân */}
      <div className="premium-card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Thông tin tài khoản</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md text-white text-2xl font-bold" style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">{displayName}</p>
            <p className="text-sm text-gray-500">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Vai trò</p>
              <p className="text-sm font-medium text-gray-800">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Đổi mật khẩu - kết nối API thật */}
      <div className="premium-card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Đổi mật khẩu</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)}
              className="premium-input rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              className="premium-input rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
              className="premium-input rounded-xl" />
          </div>
          <Button onClick={handleChangePassword} isLoading={saving}>
            <Save size={16} /> Đổi mật khẩu
          </Button>
        </div>
      </div>

      {/* Khai báo người ở cùng */}
      {role === "TENANT" && (
        <div className="premium-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Khai báo người ở cùng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Khai báo thông tin những người sinh hoạt cùng căn hộ của bạn</p>
            </div>
            <Button size="sm" onClick={() => handleOpenOccupantForm(null)}>
              <Plus size={16} /> Khai báo người ở
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-150">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Họ và tên</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Số CCCD</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ngày sinh</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">SĐT</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Chức năng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {occupants.map((occ) => (
                  <tr key={occ.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{occ.name}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.cccd}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.dob ? new Date(occ.dob).toLocaleDateString("vi-VN") : "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{occ.phone || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenOccupantForm(occ)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteOccupant(occ.id)}
                          className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {occupants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Chưa khai báo người ở cùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal khai báo/chỉnh sửa người ở cùng */}
          <Modal
            isOpen={showOccupantModal}
            onClose={() => setShowOccupantModal(false)}
            title={editOccupant ? "Chỉnh sửa thông tin người ở" : "Khai báo người ở cùng mới"}
            footer={
              <>
                <Button variant="outline" onClick={() => setShowOccupantModal(false)}>Hủy</Button>
                <Button onClick={handleSaveOccupant}>Lưu thông tin</Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input
                label="Họ và tên *"
                value={occupantForm.name}
                onChange={(v) => setOccupantForm({ ...occupantForm, name: v })}
                placeholder="Nguyễn Văn A"
              />
              <Input
                label="Số CCCD (Căn cước công dân) *"
                value={occupantForm.cccd}
                onChange={(v) => setOccupantForm({ ...occupantForm, cccd: v })}
                placeholder="079200001234"
              />
              <Input
                label="Ngày sinh"
                type="date"
                value={occupantForm.dob}
                onChange={(v) => setOccupantForm({ ...occupantForm, dob: v })}
              />
              <Input
                label="Số điện thoại"
                value={occupantForm.phone}
                onChange={(v) => setOccupantForm({ ...occupantForm, phone: v })}
                placeholder="0901234567"
              />
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
