import { Plus, Trash2, RotateCcw, UserCog, Eye } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useUserList } from "../../../hooks/useUserList";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

import UserCreateModal from "./components/UserCreateModal";
import UserDeleteModal from "./components/UserDeleteModal";
import UserResetPasswordModal from "./components/UserResetPasswordModal";
import UserDetailModal from "./components/UserDetailModal";

export default function UserList() {
  const {
    isAdmin,
    createModal,
    users,
    loading,
    search,
    setSearch,
    deleteItem,
    setDeleteItem,
    resetItem,
    setResetItem,
    viewItem,
    setViewItem,
    filtered,
    sortedUsers,
    requestSort,
    getSortIcon,
    handleDelete,
    confirmResetPassword,
    fetchUsers,
  } = useUserList();

  function getRoleBadge(roleName: string) {
    const map: Record<string, { label: string; variant: string }> = {
      ADMIN: { label: "Admin", variant: "danger" },
      MANAGER: { label: "Quản lý", variant: "warning" },
      TENANT: { label: "Người thuê", variant: "info" },
    };
    const r = map[roleName] || { label: roleName, variant: "gray" };
    return <Badge variant={r.variant as any}>{r.label}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách tài khoản...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={UserCog}
        title="Tài khoản"
        subtitle="Quản lý tài khoản người dùng"
        count={users.length}
        iconColor="linear-gradient(135deg, #F59E0B, #FBBF24)"
        actions={
          isAdmin ? (
            <Button onClick={createModal.onOpen}>
              <Plus size={18} /> Thêm tài khoản
            </Button>
          ) : null
        }
      />

      {/* Tìm kiếm */}
      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." className="max-w-md" />

      {/* Bảng */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
          <UserCog size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy tài khoản nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedUsers.map((user) => (
              <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 text-base">
                    {user.username}
                  </span>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    <Badge variant={user.status === "ACTIVE" ? "success" : "gray"}>
                      {user.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setViewItem(user)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setResetItem(user)}
                        className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <RotateCcw size={14} /> Reset Pass
                      </button>
                      <button
                        onClick={() => setDeleteItem(user)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* View List */}
          <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead onClick={() => requestSort("username")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Tên tài khoản {getSortIcon("username")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("role")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Vai trò {getSortIcon("role")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Trạng thái {getSortIcon("status")}
                  </TableHead>
                  <TableHead className="text-right">Chức năng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-gray-500 font-medium">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-gray-800">{user.username}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "ACTIVE" ? "success" : "gray"}>
                        {user.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewItem(user)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
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
