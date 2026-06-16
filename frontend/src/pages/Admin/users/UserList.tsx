import { useState, useEffect } from "react";
import { Plus, Trash2, RotateCcw, Loader2, UserCog, Eye } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import { toast } from "sonner";

import * as authService from "../../../services/authService";
import type { UserData } from "../../../services/authService";

import { useSort } from "../../../hooks/useSort";
import { removeVietnameseTones } from "../../../utils/format";

import UserCreateModal from "./components/UserCreateModal";
import UserDeleteModal from "./components/UserDeleteModal";
import UserResetPasswordModal from "./components/UserResetPasswordModal";
import UserDetailModal from "./components/UserDetailModal";

export default function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<UserData | null>(null);
  const [resetItem, setResetItem] = useState<UserData | null>(null);
  const [viewItem, setViewItem] = useState<UserData | null>(null);

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
    const usernameNorm = removeVietnameseTones(u.username || "");
    const roleNorm = removeVietnameseTones(u.role || "");
    return usernameNorm.includes(term) || roleNorm.includes(term);
  });

  const { items: sortedUsers, requestSort, getSortIcon } = useSort(filtered);

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
      toast.success(`Đã đặt lại mật khẩu cho tài khoản "${resetItem.username}" về mặc định "123456"`);
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
          <Button onClick={() => setShowCreateModal(true)}>
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
                <th onClick={() => requestSort("username")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Username {getSortIcon("username")}
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
                  <td className="font-semibold text-gray-800">{user.username}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <Badge variant={user.status === "ACTIVE" ? "success" : "gray"}>
                      {user.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewItem(user)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
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

      {/* Modals */}
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchUsers}
      />

      <UserDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        user={deleteItem}
      />

      <UserResetPasswordModal
        isOpen={!!resetItem}
        onClose={() => setResetItem(null)}
        onConfirm={confirmResetPassword}
        user={resetItem}
      />

      <UserDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        user={viewItem}
      />
    </div>
  );
}

