import { Plus, Home } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import Pagination from "../../../../components/ui/Pagination";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import { useApartmentPage } from "../hooks/useApartmentPage";
import ApartmentList from "../components/ApartmentList";
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
    filterFeatured,
    setFilterFeatured,
    filterBuilding,
    setFilterBuilding,
    createModal,
    modifyModal,
    editItem,
    setEditItem,
    deleteItem,
    setDeleteItem,
    featuredIds,
    buildings,
    loading,
    fetchApartments,
    toggleFeatured,
    filtered,
    managedBuildingId,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedApartments,
    handleDelete,
    deleting,
  } = useApartmentPage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách căn hộ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={Home}
        title="Căn hộ"
        subtitle="Quản lý danh sách căn hộ"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #3B82F6, #60A5FA)"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Tìm kiếm..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {role !== "STAFF" && (
              <Button onClick={createModal.onOpen}><Plus size={18} /> Thêm căn hộ</Button>
            )}
          </div>
        }
      />
      {/* Search + Filter */}
      <div className="grid grid-cols-12 gap-3 w-full">
        {role !== "MANAGER" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={filterBuilding ? String(filterBuilding) : ""}
              onChange={(val) => {
                setFilterBuilding(val ? Number(val) : undefined);
                setCurrentPage(1);
              }}
              placeholder="Tất cả chi nhánh"
              className="w-full"
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
              clearable={true}
            />
          </div>
        )}
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={[
              { value: "AVAILABLE", label: "Còn trống" },
              { value: "RENTED", label: "Đang thuê" },
              { value: "MAINTENANCE", label: "Bảo trì" }
            ]}
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
            clearable={true}
          />
        </div>
        {role === "ADMIN" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={[
                { value: "featured", label: "Nổi bật" },
                { value: "non-featured", label: "Không nổi bật" }
              ]}
              value={filterFeatured}
              onChange={(val) => {
                setFilterFeatured(val);
                setCurrentPage(1);
              }}
              placeholder="Tất cả nổi bật"
              searchable={false}
              className="w-full"
              triggerClassName="h-[42px] rounded-xl border-gray-300 px-4 py-2.5"
              clearable={true}
            />
          </div>
        )}
      </div>

      {paginatedApartments.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200 mt-6">
          <Home size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy căn hộ nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <ApartmentList
          paginatedApartments={paginatedApartments}
          buildings={buildings}
          role={role}
          featuredIds={featuredIds}
          toggleFeatured={toggleFeatured}
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
        onSuccess={fetchApartments}
        buildings={buildings}
        role={role}
        managerBuildingId={managedBuildingId || undefined}
      />

      <ApartmentModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => { modifyModal.onClose(); setEditItem(null); }}
        onSuccess={fetchApartments}
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
