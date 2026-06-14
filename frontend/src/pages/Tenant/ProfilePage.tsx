import { useState } from "react";
import { User, Mail, Save } from "lucide-react";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import { useAuthStore } from "../../stores/auth.store";
import { changePassword } from "../../services/auth.service";
import { toast } from "sonner";

// ============================================================
// HỒ SƠ CÁ NHÂN - Xem và đổi mật khẩu
// ============================================================

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
    </div>
  );
}
