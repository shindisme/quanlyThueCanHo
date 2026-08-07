import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import Pagination from "../../../../components/ui/Pagination";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import UtilityList from "../components/UtilityList";
import UtilityCreateModal from "../components/UtilityCreateModal";
import UtilityModifyModal from "../components/UtilityModifyModal";
import { useUtilityList } from "../hooks/useUtilityList";

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
    showCreateModal,
    setShowCreateModal,
    showModifyModal,
    setShowModifyModal,
    editItem,
    setEditItem,
    isViewOnly,
    preselectedApartment,
    fetchData,
    handleOpenCreateModal,
    handleOpenModifyModal,
    filteredRentedApartments,
    paginatedApartments,
    sortConfig,
    requestSort,
    totalPages,
    pageSize,
    isLockedMonth,
    filterFloorOptions,
    getMonthOptions,
    getYearOptions,
  } = useUtilityList();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải danh sách chỉ số điện nước...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Điện nước"
        subtitle="Quản lý và ghi chỉ số tiêu thụ điện nước"
        count={filteredRentedApartments.length}
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
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-3 w-full">
        {role === "ADMIN" && (
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={filterBuilding}
              onChange={(val) => {
                setFilterBuilding(val);
                setCurrentPage(1);
              }}
              placeholder="Tất cả chi nhánh"
              className="w-full"
              triggerClassName="h-10 border-gray-300"
              clearable={true}
            />
          </div>
        )}

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={filterFloorOptions}
            value={filterFloor}
            onChange={(val) => {
              setFilterFloor(val);
              setCurrentPage(1);
            }}
            placeholder={filterBuilding ? "Tất cả tầng" : "Chọn tòa nhà trước"}
            searchable={false}
            className="w-full"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
            disabled={!filterBuilding}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={getMonthOptions()}
            value={filterMonth}
            onChange={(val) => {
              setFilterMonth(val);
              setCurrentPage(1);
            }}
            placeholder="Chọn tháng"
            searchable={false}
            className="w-full"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={getYearOptions()}
            value={filterYear}
            onChange={(val) => {
              setFilterYear(val);
              setCurrentPage(1);
            }}
            placeholder="Chọn năm"
            searchable={false}
            className="w-full"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
          />
        </div>
      </div>

      <UtilityList
        paginatedApartments={paginatedApartments}
        readings={readings}
        filterMonth={filterMonth}
        filterYear={filterYear}
        currentPage={currentPage}
        pageSize={pageSize}
        sortConfig={sortConfig}
        onSort={requestSort}
        isLockedMonth={isLockedMonth}
        isWritable={isWritable}
        handleOpenCreateModal={handleOpenCreateModal}
        handleOpenModifyModal={handleOpenModifyModal}
        role={role}
      />

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      <UtilityCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
        buildings={buildings}
        apartments={apartments}
        preselectedApartment={preselectedApartment}
        defaultMonth={Number(filterMonth) || new Date().getMonth() + 1}
        defaultYear={Number(filterYear) || new Date().getFullYear()}
        role={role}
        managedBuildingId={managedBuildingId}
      />

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
    </div>
  );
}
