import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { getDayOptions, getMonthOptions, getYearOptions } from "../../../../utils/date";
import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import Pagination from "../../../../components/ui/Pagination";
import { SCHEDULE_STATUS_OPTIONS } from "../../../../constants";
import { useSchedulePage } from "../hooks/useSchedulePage";

import ScheduleList from "../components/ScheduleList";
import ScheduleDeleteModal from "../components/ScheduleDeleteModal";
import ScheduleCancelModal from "../components/ScheduleCancelModal";
import ScheduleDetailModal from "../components/ScheduleDetailModal";

export default function SchedulePage() {
  const {
    role,
    buildings,
    buildingMap,
    schedules,
    filtered,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filterDay,
    setFilterDay,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    currentPage,
    setCurrentPage,
    deleteItem,
    setDeleteItem,
    cancelItem,
    setCancelItem,
    viewItem,
    setViewItem,
    totalPages,
    handleDelete,
    handleConfirm,
    handleMarkAttended,
    handleMarkAbsent,
    handleConfirmCancel,
    deleting,
    canceling,
  } = useSchedulePage();

  if (loading) {
    return <LoadingSpinner />;
  }

  const daysOptions = getDayOptions();
  const monthsOptions = getMonthOptions();
  const yearsOptions = getYearOptions();

  const statusOptions = SCHEDULE_STATUS_OPTIONS;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Quản lý lịch xem phòng"
        subtitle={`Quản lý ${schedules.length} lịch đặt hẹn xem phòng`}
        count={filtered.length}
        actions={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo khách, SĐT, phòng, tòa nhà..."
              className="w-full min-w-0 flex-1 sm:w-80"
            />
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="grid grid-cols-12 gap-3 w-full">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả trạng thái"
            className="w-full"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={daysOptions}
            value={filterDay}
            onChange={(val) => {
              setFilterDay(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả ngày"
            className="w-full"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={monthsOptions}
            value={filterMonth}
            onChange={(val) => {
              setFilterMonth(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả tháng"
            className="w-full"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={yearsOptions}
            value={filterYear}
            onChange={(val) => {
              setFilterYear(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả năm"
            className="w-full"
            triggerClassName="h-10 border-gray-300"
            clearable={true}
          />
        </div>
      </div>

      <ScheduleList
        schedules={filtered}
        currentPage={currentPage}
        onSortResetPage={() => setCurrentPage(1)}
        role={role}
        buildingMap={buildingMap}
        onView={setViewItem}
        onConfirm={handleConfirm}
        onCancel={setCancelItem}
        onMarkAttended={handleMarkAttended}
        onMarkAbsent={handleMarkAbsent}
        onDelete={setDeleteItem}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modals */}
      <ScheduleDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        schedule={deleteItem}
        loading={deleting}
      />

      <ScheduleCancelModal
        isOpen={!!cancelItem}
        onClose={() => setCancelItem(null)}
        onConfirm={handleConfirmCancel}
        schedule={cancelItem}
        loading={canceling}
      />

      <ScheduleDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        schedule={viewItem}
        role={role}
        buildings={buildings}
        buildingMap={buildingMap}
      />
    </div>
  );
}
