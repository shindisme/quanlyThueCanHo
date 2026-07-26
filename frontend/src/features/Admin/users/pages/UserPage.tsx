import { Plus, Trash2, RotateCcw, UserCog, Eye, Pencil } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Combobox from "../../../../components/ui/Combobox";
import Pagination from "../../../../components/ui/Pagination";
import { useUserPage } from "../hooks/useUserPage";
import type { User, Tenant, Staff } from "../../../../types";
import DataTable, { type Column } from "../../../../components/ui/DataTable";

import UserCreateModal from "../components/UserCreateModal";
import UserModifyModal from "../components/UserModifyModal";
import UserDeleteModal from "../components/UserDeleteModal";
import UserResetPasswordModal from "../components/UserResetPasswordModal";
import UserDetailModal from "../components/UserDetailModal";

export default function UserPage() {
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
    buildingFilter,
    setBuildingFilter,
    buildings,
    filtered,
    pagination,
    sortedUsers,
    handleDelete,
    confirmResetPassword,
    fetchUsers,
    tenants,
    staff,
    getUserFullName,
    getUserBranch,
    deleting,
    resetting,
  } = useUserPage();

  const columns: Column<User>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800 w-2">{index + 1}</span>,
    },
    {
      key: "fullName",
      label: "Họ và tên",
      sortValue: (u) => getUserFullName(u),
      render: (u) => <span className="font-medium text-gray-700">{getUserFullName(u)}</span>,
    },
    {
      key: "username",
      label: "Tên tài khoản",
      sortValue: (u) => u.username,
      render: (u) => <span className="font-semibold text-gray-800">{u.username}</span>,
    },
    {
      key: "role",
      label: "Vai trò",
      sortValue: (u) => u.role,
      render: (u) => getRoleBadge(u),
    },
    {
      key: "branch",
      label: "Chi nhánh",
      sortValue: (u) => getUserBranch(u),
      render: (u) => <span className="font-medium text-primary-600">{getUserBranch(u)}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      sortValue: (u) => u.status,
      render: (u) => (
        <Badge variant={u.status === "ACTIVE" ? "success" : "gray"}>
          {u.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewItem(u)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setModifyItem(u)}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                title="Chỉnh sửa tài khoản"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setResetItem(u)}
                className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                title="Đặt lại mật khẩu"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setDeleteItem(u)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  function getRoleBadge(user: User) {
    let label: string = user.role;
    let variant: BadgeVariant = "gray";

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
      label = match ? match.position : user.role === "MANAGER" ? "Quản lý" : "Nhân viên";
      variant = user.role === "MANAGER" ? "warning" : "success";
    }

    return <Badge variant={variant}>{label}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">
          Đang tải danh sách tài khoản...
        </span>
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
      <div className="grid grid-cols-12 gap-4 w-full font-sans">
        <div className="col-span-12 sm:col-span-3">
          <Combobox
            options={[
              { value: "ADMIN", label: "Admin" },
              { value: "MANAGER", label: "Quản lý" },
              { value: "STAFF", label: "Nhân viên" },
              { value: "TENANT", label: "Người thuê" },
            ]}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Tất cả vai trò"
            searchable={false}
            className="w-full"
            triggerClassName="rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-3">
          <Combobox
            options={[
              { value: "ACTIVE", label: "Hoạt động" },
              { value: "INACTIVE", label: "Tạm khóa" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tất cả trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-3">
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={buildingFilter}
            onChange={setBuildingFilter}
            placeholder="Tất cả chi nhánh"
            triggerClassName="rounded-xl"
            clearable={true}
          />
        </div>
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
          <DataTable columns={columns} data={sortedUsers as User[]} />
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
            className="mt-4"
          />
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
        loading={deleting}
      />

      <UserResetPasswordModal
        isOpen={!!resetItem}
        onClose={() => setResetItem(null)}
        onConfirm={confirmResetPassword}
        user={resetItem}
        loading={resetting}
      />

      <UserModifyModal
        isOpen={!!modifyItem}
        onClose={() => setModifyItem(null)}
        onSuccess={fetchUsers}
        user={modifyItem}
        initialFullName={modifyItem ? getUserFullName(modifyItem) : ""}
        tenantId={
          modifyItem && modifyItem.role === "TENANT"
            ? tenants.find(
              (t: Tenant) =>
                t.user_id === modifyItem.id ||
                (t.email && modifyItem.username && t.email.toLowerCase() === modifyItem.username.toLowerCase())
            )?.id || modifyItem.tenant?.id || modifyItem.tenant_profile?.id || null
            : null
        }
        staffId={
          modifyItem && (modifyItem.role === "MANAGER" || modifyItem.role === "STAFF")
            ? staff.find(
              (s: Staff) =>
                s.user_id === modifyItem.id ||
                (s.user && s.user.id === modifyItem.id) ||
                (s.user && s.user.username === modifyItem.username)
            )?.id || null
            : null
        }
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
