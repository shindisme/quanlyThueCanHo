import { Plus, Trash2, RotateCcw, UserCog, Eye, Pencil } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import Combobox from "../../../components/ui/Combobox";
import Pagination from "../../../components/ui/Pagination";
import { useUserList } from "../../../hooks/admin/useUserList";
import type { UserData } from "../../../services/authService";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

import UserCreateModal from "./components/UserCreateModal";
import UserModifyModal from "./components/UserModifyModal";
import UserDeleteModal from "./components/UserDeleteModal";
import UserResetPasswordModal from "./components/UserResetPasswordModal";
import UserDetailModal from "./components/UserDetailModal";

export default function User() {
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
    modifyItem,
    setModifyItem,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    filtered,
    sortedUsers,
    pagination,
    requestSort,
    getSortIcon,
    handleDelete,
    confirmResetPassword,
    fetchUsers,
    tenants,
    staff,
    getUserFullName,
    getUserBranch,
  } = useUserList();

  function getRoleBadge(user: UserData) {
    let label = user.role;
    let variant = "gray";

    if (user.role === "ADMIN") {
      label = "Admin";
      variant = "danger";
    } else if (user.role === "TENANT") {
      label = "Người thuê";
      variant = "info";
    } else if (user.role === "MANAGER" || user.role === "STAFF") {
      const match = staff.find(
        (s) =>
          s.user_id === user.id ||
          (s.user && s.user.id === user.id) ||
          (s.user && s.user.username === user.username)
      );
      label = match ? match.position : (user.role === "MANAGER" ? "Quản lý" : "Nhân viên");
      variant = user.role === "MANAGER" ? "warning" : "success";
    }

    return <Badge variant={variant as any}>{label}</Badge>;
  }

  function isUserFullNameEditable(u: UserData): boolean {
    if (u.role === "ADMIN") return true;
    if (u.role === "TENANT") {
      return !tenants.some((t) => t.user_id === u.id);
    }
    if (u.role === "MANAGER" || u.role === "STAFF") {
      return !staff.some((s) => s.user_id === u.id);
    }
    return true;
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
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {isAdmin && (
              <Button onClick={createModal.onOpen}>
                <Plus size={18} /> Thêm tài khoản
              </Button>
            )}
          </div>
        }
      />

      {/* Tìm kiếm và Bộ lọc */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">

        <Combobox
          options={[
            { value: "", label: "Tất cả vai trò" },
            { value: "ADMIN", label: "Admin" },
            { value: "MANAGER", label: "Quản lý" },
            { value: "STAFF", label: "Nhân viên" },
            { value: "TENANT", label: "Người thuê" }
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
          searchable={false}
          className="w-full"
          triggerClassName="rounded-md"
        />

        <Combobox
          options={[
            { value: "", label: "Tất cả trạng thái" },
            { value: "ACTIVE", label: "Hoạt động" },
            { value: "INACTIVE", label: "Tạm khóa" }
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          searchable={false}
          className="w-full"
          triggerClassName="rounded-md"
        />
      </div>

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
                    {getRoleBadge(user)}
                    <Badge variant={user.status === "ACTIVE" ? "success" : "gray"}>
                      {user.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Họ tên: <span className="font-semibold text-gray-700">{getUserFullName(user)}</span>
                </p>
                {getUserBranch(user) !== "-" && (
                  <p className="text-xs text-gray-500">
                    Chi nhánh <span className="font-semibold text-gray-700">{getUserBranch(user)}</span>
                  </p>
                )}

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
                        onClick={() => setModifyItem(user)}
                        className="px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Pencil size={14} /> Sửa
                      </button>
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
          <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-xl rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead className="font-semibold text-gray-750">Họ và tên</TableHead>
                  <TableHead onClick={() => requestSort("username")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Tên tài khoản {getSortIcon("username")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("role")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Vai trò {getSortIcon("role")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("branch")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Chi nhánh / Căn hộ {getSortIcon("branch")}
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
                    <TableCell className="font-medium text-gray-700">
                      {getUserFullName(user)}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-800">{user.username}</TableCell>
                    <TableCell>{getRoleBadge(user)}</TableCell>
                    <TableCell className="font-medium text-gray-600">{getUserBranch(user)}</TableCell>
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
                              onClick={() => setModifyItem(user)}
                              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                              title="Chỉnh sửa tài khoản"
                            >
                              <Pencil size={16} />
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
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
              className="mt-4"
            />
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

      <UserModifyModal
        isOpen={!!modifyItem}
        onClose={() => setModifyItem(null)}
        onSuccess={fetchUsers}
        user={modifyItem}
        initialFullName={modifyItem ? getUserFullName(modifyItem) : ""}
        isNameEditable={modifyItem ? isUserFullNameEditable(modifyItem) : true}
      />

      <UserDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        user={viewItem}
        fullName={viewItem ? getUserFullName(viewItem) : ""}
      />
    </div>
  );
}
