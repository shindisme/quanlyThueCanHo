import { Plus, Home } from "lucide-react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import Pagination from "../../../../components/ui/Pagination";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import EmptyState from "../../../../components/ui/EmptyState";

import { useApartmentPage } from "../hooks/useApartmentPage";
import ApartmentList from "../components/ApartmentList";
import ApartmentFilterBar from "../components/ApartmentFilterBar";
import ApartmentCreateModal from "../components/ApartmentCreateModal";
import ApartmentModifyModal from "../components/ApartmentModifyModal";
import ApartmentDeleteModal from "../components/ApartmentDeleteModal";

export default function ApartmentPage() {
  const {
    role,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterFloor,
    setFilterFloor,
    availableFloors,
    filterBuilding,
    setFilterBuilding,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    buildings,
    loading,
    filtered,
    managedBuildingId,
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,
    paginatedApartments,
    handleDelete,
    deleting,
  } = useApartmentPage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách căn hộ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Căn hộ"
        subtitle="Quản lý danh sách căn hộ"
        count={filtered.length}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Tìm kiếm..."
              className="w-full sm:w-80 flex-1 min-w-0"
            />
            {role !== "STAFF" && (
              <Button onClick={createModal.onOpen} className="shrink-0 whitespace-nowrap justify-center"><Plus size={18} /> Thêm căn hộ</Button>
            )}
          </div>
        }
      />

      {/* Thanh bộ lọc dùng chung */}
      <ApartmentFilterBar
        role={role}
        buildings={buildings}
        filterBuilding={filterBuilding}
        setFilterBuilding={setFilterBuilding}
        filterFloor={filterFloor}
        setFilterFloor={setFilterFloor}
        availableFloors={availableFloors}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onFilterChange={() => setCurrentPage(1)}
      />

      {/* Danh sách căn hộ */}
      {paginatedApartments.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Home size={48} />}
          title="Không tìm thấy căn hộ nào"
          description="Thử tìm kiếm với từ khóa khác"
        />
      ) : (
        <ApartmentList
          paginatedApartments={paginatedApartments}
          buildings={buildings}
          role={role}
          startIdx={startIdx}
          setEditItem={setEditItem}
          modifyModal={modifyModal}
          setDeleteItem={setDeleteItem}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Modals */}
      <ApartmentCreateModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={() => { }}
        buildings={buildings}
        role={role}
        managerBuildingId={managedBuildingId || undefined}
      />

      <ApartmentModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => { modifyModal.onClose(); setEditItem(null); }}
        onSuccess={() => { setEditItem(null); }}
        editItem={editItem}
        buildings={buildings}
        role={role}
      />

      <ApartmentDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        apartment={deleteItem}
        loading={deleting}
      />
    </div>
  );
}
