import { Plus, Building2 } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import Button from "../../../../components/ui/Button";
import SearchInput from "../../../../components/ui/SearchInput";
import Pagination from "../../../../components/ui/Pagination";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";

import BuildingCreateModal from "../components/BuildingCreateModal";
import BuildingModifyModal from "../components/BuildingModifyModal";
import BuildingDeleteModal from "../components/BuildingDeleteModal";
import BuildingList from "../components/BuildingList";
import { useBuildingList } from "../hooks/useBuildingList";

export default function BuildingPage() {
  const {
    role,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
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
    handleDelete,
    fetchBuildings,
    deleting,
  } = useBuildingList();

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
        icon={Building2}
        title="Tòa nhà"
        subtitle="Quản lý danh sách tòa nhà"
        count={role === "MANAGER" ? filtered.length : totalCount}
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Tìm kiếm theo tên, địa chỉ..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {role === "ADMIN" && (
              <Button onClick={createModal.onOpen}>
                <Plus size={18} /> Thêm tòa nhà
              </Button>
            )}
          </div>
        }
      />

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
          <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy tòa nhà nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <BuildingList
          sortedBuildings={sortedBuildings}
          role={role}
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
        onSuccess={fetchBuildings}
      />

      <BuildingModifyModal
        isOpen={modifyModal.isOpen}
        onClose={() => { modifyModal.onClose(); setEditItem(null); }}
        onSuccess={fetchBuildings}
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
