import { Zap, Plus } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import Combobox from "../../../components/ui/Combobox";
import Pagination from "../../../components/ui/Pagination";
import Button from "../../../components/ui/Button";
import { useUtilityList } from "../../../hooks/admin/useUtilityList";
import UtilityList from "./components/UtilityList";
import UtilityCreateModal from "./components/UtilityCreateModal";
import UtilityModifyModal from "./components/UtilityModifyModal";
import UtilityDeleteModal from "./components/UtilityDeleteModal";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

export default function UtilitiesPage() {
  const {
    role,
    managedBuildingId,
    isWritable,
    readings,
    buildings,
    apartments,
    loading,
    search,
    setSearch,
    filterBuilding,
    setFilterBuilding,
    filterFloor,
    setFilterFloor,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    currentPage,
    setCurrentPage,
    // Modals
    showCreateModal,
    setShowCreateModal,
    showModifyModal,
    setShowModifyModal,
    editItem,
    setEditItem,
    isViewOnly,
    preselectedApartment,
    deleteItem,
    setDeleteItem,
    // Handlers
    fetchData,
    handleOpenCreateModal,
    handleOpenModifyModal,
    handleOpenDeleteModal,
    handleConfirmDelete,
    filteredRentedApartments,
    paginatedApartments,
    requestSort,
    getSortIcon,
    totalPages,
    pageSize,
    isLockedMonth,
    filterFloorOptions,
    getMonthOptions,
    getYearOptions,
  } = useUtilityList();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách chỉ số điện nước...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Zap}
        title="Điện nước"
        subtitle="Quản lý và ghi chỉ số tiêu thụ điện nước"
        count={filteredRentedApartments.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setCurrentPage(1);
              }}
              placeholder="Tìm phòng, tòa nhà, người ghi..."
              className="w-64 sm:w-80 flex-1 min-w-0"
            />
            {isWritable && (
              <Button
                onClick={() => handleOpenCreateModal()}
                className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl shadow-sm"
              >
                <Plus size={16} /> Ghi chỉ số mới
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center">

        {role === "ADMIN" && (
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={filterBuilding}
            onChange={(val) => {
              setFilterBuilding(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả chi nhánh"
            className="w-full sm:w-48 "
            triggerClassName="h-10 border-gray-300 "
            clearable={true}
          />
        )}

        <Combobox
          options={filterFloorOptions}
          value={filterFloor}
          onChange={(val) => {
            setFilterFloor(val);
            setCurrentPage(1);
          }}
          placeholder={filterBuilding ? "Tất cả tầng" : "Chọn tòa nhà trước"}
          searchable={false}
          className="w-full sm:w-36"
          triggerClassName="h-10 border-gray-300"
          clearable={true}
          disabled={!filterBuilding}
        />

        <Combobox
          options={getMonthOptions()}
          value={filterMonth}
          onChange={(val) => {
            setFilterMonth(val);
            setCurrentPage(1);
          }}
          placeholder="Chọn tháng"
          searchable={false}
          className="w-full sm:w-36"
          triggerClassName="h-10 border-gray-300"
          clearable={true}
        />

        <Combobox
          options={getYearOptions()}
          value={filterYear}
          onChange={(val) => {
            setFilterYear(val);
            setCurrentPage(1);
          }}
          placeholder="Chọn năm"
          searchable={false}
          className="w-full sm:w-36"
          triggerClassName="h-10 border-gray-300"
          clearable={true}
        />
      </div>

      {/* Table Component */}
      <UtilityList
        paginatedApartments={paginatedApartments}
        readings={readings}
        filterMonth={filterMonth}
        filterYear={filterYear}
        currentPage={currentPage}
        pageSize={pageSize}
        requestSort={requestSort}
        getSortIcon={getSortIcon}
        isLockedMonth={isLockedMonth}
        isWritable={isWritable}
        handleOpenCreateModal={handleOpenCreateModal}
        handleOpenModifyModal={handleOpenModifyModal}
        handleOpenDeleteModal={handleOpenDeleteModal}
        filteredRentedApartmentsLength={filteredRentedApartments.length}
        role={role}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Create Modal Component */}
      <UtilityCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
        buildings={buildings}
        apartments={apartments}
        readings={readings}
        preselectedApartment={preselectedApartment}
        defaultMonth={Number(filterMonth) || new Date().getMonth() + 1}
        defaultYear={Number(filterYear) || new Date().getFullYear()}
        role={role}
        managedBuildingId={managedBuildingId}
      />

      {/* Modify/View Modal Component */}
      <UtilityModifyModal
        isOpen={showModifyModal}
        onClose={() => {
          setShowModifyModal(false);
          setEditItem(null);
        }}
        onSuccess={fetchData}
        editItem={editItem}
        isViewOnly={isViewOnly}
        buildings={buildings}
        apartments={apartments}
      />

      {/* Delete Confirmation Modal */}
      <UtilityDeleteModal
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        item={deleteItem}
      />
    </div>
  );
}
