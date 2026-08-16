import { Plus, Users } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import Pagination from "../../../../components/ui/Pagination";
import { useTenantPage } from "../hooks/useTenantPage";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import EmptyState from "../../../../components/ui/EmptyState";
import Combobox from "../../../../components/ui/Combobox";

import TenantList from "../components/TenantList";
import TenantCreateModal from "../components/TenantCreateModal";
import TenantModifyModal from "../components/TenantModifyModal";
import TenantDeleteModal from "../components/TenantDeleteModal";
import TenantDetailModal from "../components/TenantDetailModal";

export default function TenantPage() {
  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    filtered,
    paginated,
    requestSort,
    sortConfig,
    handleDelete,
    loading,
    role,
    selectedBuilding,
    setSelectedBuilding,
    selectedFloor,
    setSelectedFloor,
    selectedStatus,
    setSelectedStatus,
    availableFloors,
    buildings,
    deleting,
  } = useTenantPage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách người thuê...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người thuê"
        subtitle="Quản lý thông tin người thuê"
        count={filtered.length}
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm..."
              className="w-64 sm:w-80"
            />
            {role !== "STAFF" && (
              <Button onClick={createModal.onOpen}>
                <Plus size={18} /> Thêm người thuê
              </Button>
            )}
          </div>
        }
      />

      {/* Bộ lọc */}
      <div className="grid grid-cols-12 gap-3 w-full font-sans">
        {role === "ADMIN" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={selectedBuilding}
              onChange={(val) => {
                setSelectedBuilding(val);
                setSelectedFloor("");
                setCurrentPage(1);
              }}
              placeholder="Tất cả tòa nhà"
              className="w-full"
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
              clearable={true}
            />
          </div>
        )}

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={availableFloors.map((fl) => ({ value: String(fl), label: `Tầng ${fl}` }))}
            value={selectedFloor}
            onChange={(val) => {
              setSelectedFloor(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả tầng"
            className="w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={[
              { value: "ACTIVE", label: "Đang thuê" },
              { value: "INACTIVE", label: "Ngừng thuê" },
            ]}
            value={selectedStatus}
            onChange={(val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
            placeholder="Trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="Không tìm thấy người thuê nào"
          description="Thử tìm kiếm với từ khóa khác"
        />
      ) : (
        <TenantList
          paginatedTenants={paginated}
          role={role}
          startIdx={startIdx}
          totalItems={filtered.length}
          sortConfig={sortConfig}
          onSort={(key) => { requestSort(key); setCurrentPage(1); }}
          setViewItem={setViewItem}
          setEditItem={setEditItem}
          onOpenModifyModal={modifyModal.onOpen}
          setDeleteItem={setDeleteItem}
        />
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modals */}
      <TenantCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={() => {}}
      />

      <TenantModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => {
          modifyModal.onClose();
          setEditItem(null);
        }}
        onSuccess={() => {
          setEditItem(null);
        }}
        editItem={editItem}
      />

      <TenantDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        tenant={deleteItem}
        loading={deleting}
      />

      <TenantDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        tenant={viewItem}
      />
    </div>
  );
}
