import { useState, useEffect } from "react";
import { Plus, Trash2, RotateCcw, Loader2, UserCog } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Badge from "../../../components/ui/Badge";
import { toast } from "sonner";

import * as authService from "../../../services/auth.service";
import type { UserData } from "../../../services/auth.service";

import { useSort } from "../../../hooks/useSort";
import { removeVietnameseTones } from "../../../utils/format";

export default function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<UserData | null>(null);
  const [resetItem, setResetItem] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ email: "", role: "TENANT", phone: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch {
      toast.error("Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter((u) => {
    const term = removeVietnameseTones(search);
    const emailNorm = removeVietnameseTones(u.email);
    const roleNorm = removeVietnameseTones(u.role);
    const phoneNorm = removeVietnameseTones(u.phone || "");
    return emailNorm.includes(term) || roleNorm.includes(term) || phoneNorm.includes(term);
  });

  const { items: sortedUsers, requestSort, getSortIcon } = useSort(filtered);

  // Thêm user mới
  async function handleCreate() {
    if (!formData.email) {
      toast.error("Vui lòng nhập email");
      return;
    }
    setSaving(true);
    try {
      await authService.createUser(formData);
      toast.success("Đã tạo tài khoản mới (mật khẩu mặc định: 123456)");
      setShowForm(false);
      setFormData({ email: "", role: "TENANT", phone: "" });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Tạo tài khoản thất bại");
    } finally {
      setSaving(false);
    }
  }

  // Xóa user
  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await authService.deleteUser(deleteItem.id);
      toast.success("Đã xóa tài khoản");
      setDeleteItem(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xóa thất bại");
    }
  }

  // Reset password
  async function confirmResetPassword() {
    if (!resetItem) return;
    try {
      await authService.resetPassword(resetItem.id);
      toast.success(`Đã đặt lại mật khẩu cho tài khoản "${resetItem.email}" về mặc định "123456"`);
      setResetItem(null);
    } catch {
      toast.error("Đặt lại mật khẩu thất bại");
    }
  }

  // Map role → tiếng Việt + màu badge
  function getRoleBadge(role: string) {
    const map: Record<string, { label: string; variant: string }> = {
      ADMIN: { label: "Admin", variant: "danger" },
      MANAGER: { label: "Quản lý", variant: "warning" },
      TENANT: { label: "Người thuê", variant: "info" },
    };
    const r = map[role] || { label: role, variant: "gray" };
    return <Badge variant={r.variant as any}>{r.label}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={UserCog}
        title="Tài khoản"
        subtitle="Quản lý tài khoản người dùng"
        count={users.length}
        iconColor="linear-gradient(135deg, #F59E0B, #FBBF24)"
        actions={
          <Button onClick={() => {
            setFormData({ email: "", role: "TENANT", phone: "" });
            setShowForm(true);
          }}>
            <Plus size={18} /> Thêm tài khoản
          </Button>
        }
      />

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." className="max-w-md" />

      {/* Bảng dữ liệu */}
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => requestSort("id")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  ID {getSortIcon("id")}
                </th>
                <th onClick={() => requestSort("email")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Email {getSortIcon("email")}
                </th>
                <th onClick={() => requestSort("phone")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  SĐT {getSortIcon("phone")}
                </th>
                <th onClick={() => requestSort("role")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Role {getSortIcon("role")}
                </th>
                <th onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Trạng thái {getSortIcon("status")}
                </th>
                <th className="text-right">Chức năng</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="text-gray-650">#{user.id}</td>
                  <td className="font-semibold text-gray-800">{user.email}</td>
                  <td className="text-gray-600">{user.phone || "-"}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <Badge variant={user.status === "ACTIVE" ? "success" : "gray"}>
                      {user.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setResetItem(user)}
                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                        title="Đặt lại mật khẩu"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteItem(user)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <UserCog size={48} className="mx-auto mb-3 text-gray-300" />
                    Không tìm thấy tài khoản nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm tài khoản */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Thêm tài khoản mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button onClick={handleCreate} isLoading={saving}>Tạo tài khoản</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@dukihome.vn"
                className="premium-input rounded-xl"
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
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
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0901234567"
                className="premium-input rounded-xl"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">Mật khẩu mặc định: 123456</p>
        </div>
      </Modal>

      {/* Dialog xóa */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${deleteItem?.email}"?`}
        confirmText="Xóa"
      />

      {/* Dialog reset mật khẩu */}
      <ConfirmDialog
        isOpen={!!resetItem}
        onClose={() => setResetItem(null)}
        onConfirm={confirmResetPassword}
        title="Đặt lại mật khẩu"
        message={`Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${resetItem?.email}" về mặc định "123456" không?`}
        confirmText="Đặt lại"
      />
    </div>
  );
}
