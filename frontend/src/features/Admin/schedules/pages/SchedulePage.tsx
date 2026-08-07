import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Combobox from "../../../../components/ui/Combobox";
import Pagination from "../../../../components/ui/Pagination";
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

  const daysOptions = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `Ngày ${i + 1}`,
  }));

  const monthsOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }));

  const currentYear = new Date().getFullYear();
  const yearsOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - 2 + i),
    label: `Năm ${currentYear - 2 + i}`,
  }));

  const statusOptions = [
    { value: "PENDING", label: "Chờ duyệt" },
    { value: "CONFIRMED", label: "Đã duyệt" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Quản lý lịch xem phòng"
        subtitle={`Quản lý ${schedules.length} lịch đặt hẹn xem phòng`}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo khách, SĐT, phòng, tòa nhà..."
          className="w-full md:col-span-1"
        />

        <Combobox
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Tất cả trạng thái"
          triggerClassName="h-10 rounded-xl border-gray-300"
          clearable={true}
        />

        <Combobox
          options={daysOptions}
          value={filterDay}
          onChange={setFilterDay}
          placeholder="Tất cả ngày"
          triggerClassName="h-10 rounded-xl border-gray-300"
          clearable={true}
        />

        <Combobox
          options={monthsOptions}
          value={filterMonth}
          onChange={setFilterMonth}
          placeholder="Tất cả tháng"
          triggerClassName="h-10 rounded-xl border-gray-300"
          clearable={true}
        />

        <Combobox
          options={yearsOptions}
          value={filterYear}
          onChange={setFilterYear}
          placeholder="Tất cả năm"
          triggerClassName="h-10 rounded-xl border-gray-300"
          clearable={true}
        />
      </div>

      {/* Schedule Table Component */}
      <ScheduleList
        schedules={filtered}
        currentPage={currentPage}
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
