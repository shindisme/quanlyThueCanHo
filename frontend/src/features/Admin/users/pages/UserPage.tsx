import { useMemo } from "react";
import { Plus, UserCog } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import Combobox from "../../../../components/ui/Combobox";
import EmptyState from "../../../../components/ui/EmptyState";
import Pagination from "../../../../components/ui/Pagination";

import { useUserPage } from "../hooks/useUserPage";
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from "../../../../constants/labels";
import type { Tenant, Staff } from "../../../../types";

import UserList from "../components/UserList";
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
    filtered,
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
    requestSort,
    sortConfig,
  } = useUserPage();

  const selectedTenantId = useMemo(() => {
    if (!modifyItem || modifyItem.role !== "TENANT") return null;
    const found = tenants.find(
      (t: Tenant) =>
        t.user_id === modifyItem.id ||
        (t.email && modifyItem.username && t.email.toLowerCase() === modifyItem.username.toLowerCase())
    );
    return found?.id || modifyItem.tenant?.id || modifyItem.tenant_profile?.id || null;
  }, [modifyItem, tenants]);

  const selectedStaffId = useMemo(() => {
    if (!modifyItem || (modifyItem.role !== "MANAGER" && modifyItem.role !== "STAFF")) return null;
    const found = staff.find(
      (s: Staff) =>
        s.user_id === modifyItem.id ||
        (s.user && s.user.id === modifyItem.id) ||
        (s.user && s.user.username === modifyItem.username)
    );
    return found?.id || null;
  }, [modifyItem, staff]);

  const buildingOptions = useMemo(
    () => buildings.map((b) => ({ value: String(b.id), label: b.branch_name })),
    [buildings]
  );

  const startIdx = (pagination.currentPage - 1) * 10;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 font-sans">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">
          Đang tải danh sách tài khoản...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <PageHeader
        title="Tài khoản"
        subtitle="Quản lý tài khoản người dùng"
        count={users.length}
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm tài khoản..."
              className="w-full min-w-0 flex-1 sm:w-80"
            />
            {isAdmin && (
              <Button onClick={createModal.onOpen} className="rounded-xl font-semibold gap-1.5 shadow-xs cursor-pointer">
                <Plus size={18} /> Thêm Quản trị viên
              </Button>
            )}
          </div>
        }
      />

      {/* Tìm kiếm và Bộ lọc */}
      <div className="grid grid-cols-12 gap-4 w-full font-sans">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={USER_ROLE_OPTIONS}
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Tất cả vai trò"
            searchable={false}
            className="w-full"
            triggerClassName="rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={USER_STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tất cả trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="rounded-xl"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={buildingOptions}
            value={buildingFilter}
            onChange={setBuildingFilter}
            placeholder="Tất cả chi nhánh"
            triggerClassName="rounded-xl"
            clearable={true}
          />
        </div>
      </div>

      {/* Bảng dữ liệu */}
      {sortedUsers.length === 0 ? (
        <EmptyState
          icon={<UserCog size={48} />}
          title="Không tìm thấy tài khoản nào"
          description="Thử tìm kiếm với từ khóa hoặc bộ lọc khác"
        />
      ) : (
        <div className="space-y-4">
          <UserList
            users={sortedUsers}
            staff={staff}
            isAdmin={isAdmin}
            startIdx={startIdx}
            totalItems={filtered.length}
            getUserFullName={getUserFullName}
            getUserBranch={getUserBranch}
            onViewDetail={setViewItem}
            onModify={setModifyItem}
            onResetPassword={setResetItem}
            onDelete={setDeleteItem}
            sortConfig={sortConfig}
            onSort={(key) => { requestSort(key); pagination.setCurrentPage(1); }}
          />

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
        tenantId={selectedTenantId}
        staffId={selectedStaffId}
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
