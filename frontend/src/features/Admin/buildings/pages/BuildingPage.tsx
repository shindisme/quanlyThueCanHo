import { Plus, Building2 } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import Pagination from "../../../../components/ui/Pagination";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import EmptyState from "../../../../components/ui/EmptyState";

import BuildingFilterBar from "../components/BuildingFilterBar";
import BuildingCreateModal from "../components/BuildingCreateModal";
import BuildingModifyModal from "../components/BuildingModifyModal";
import BuildingDeleteModal from "../components/BuildingDeleteModal";
import BuildingList from "../components/BuildingList";
import { useBuildingPage } from "../hooks/useBuildingPage";

export default function BuildingPage() {
  const {
    role,
    canEdit,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    startIdx,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    loading,
    totalCount,
    totalPages,
    filtered,
    sortedBuildings,
    requestSort,
    sortConfig,
    handleDelete,
    deleting,
  } = useBuildingPage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách tòa nhà...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tòa nhà"
        subtitle="Quản lý danh sách tòa nhà"
        count={role === "MANAGER" ? filtered.length : totalCount}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <BuildingFilterBar
              search={search}
              onSearchChange={setSearch}
              onResetPage={() => setCurrentPage(1)}
            />
            {canEdit && (
              <Button onClick={createModal.onOpen} className="shrink-0 whitespace-nowrap justify-center">
                <Plus size={18} /> Thêm tòa nhà
              </Button>
            )}
          </div>
        }
      />

      {/* Bảng data list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} />}
          title="Không tìm thấy tòa nhà nào"
          description="Thử tìm kiếm với từ khóa khác"
        />
      ) : (
        <BuildingList
          sortedBuildings={sortedBuildings}
          role={role}
          startIdx={startIdx}
          totalItems={totalCount}
          sortConfig={sortConfig}
          onSort={(key) => { requestSort(key); setCurrentPage(1); }}
          setEditItem={setEditItem}
          setShowModifyModal={modifyModal.onOpen}
          setDeleteItem={setDeleteItem}
        />
      )}

      {/* Phân trang */}
      {(role === "MANAGER" ? 1 : totalPages) > 1 && (
        <Pagination currentPage={currentPage} totalPages={role === "MANAGER" ? 1 : totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modals */}
      <BuildingCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={() => { }}
      />

      <BuildingModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => { modifyModal.onClose(); setEditItem(null); }}
        onSuccess={() => { }}
        editItem={editItem}
      />

      <BuildingDeleteModal
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        building={deleteItem}
        loading={deleting}
      />
    </div>
  );
}
