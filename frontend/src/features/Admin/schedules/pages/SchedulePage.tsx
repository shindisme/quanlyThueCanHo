import { Eye, Check, X, Trash2 } from "lucide-react";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import PageHeader from "../../../../components/layout/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import Badge from "../../../../components/ui/Badge";
import Combobox from "../../../../components/ui/Combobox";
import Pagination from "../../../../components/ui/Pagination";
import { maskPhone } from "../../../../utils/string";
import { formatApartmentDisplay, parseGuestName } from "../../../../utils/string";
import { useSchedulePage } from "../hooks/useSchedulePage";
import type { ViewingSchedule } from "../../../../types";

import ScheduleDeleteModal from "../components/ScheduleDeleteModal";
import ScheduleDetailModal from "../components/ScheduleDetailModal";
import DataTable, { type Column } from "../../../../components/ui/DataTable";

export default function SchedulePage() {
  const {
    role,
    buildings,
    schedules,
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
    viewItem,
    setViewItem,
    totalPages,
    paginatedSchedules,
    handleDelete,
    handleConfirm,
    handleCancel,
    deleting,
  } = useSchedulePage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải lịch hẹn...</span>
      </div>
    );
  }

  function getStatusBadge(status: string) {
    const variantMap: Record<string, "warning" | "success" | "gray" | "info"> = {
      PENDING: "warning",
      CONFIRMED: "success",
      CANCELLED: "gray",
    };
    const labelMap: Record<string, string> = {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      CANCELLED: "Đã hủy",
    };
    return (
      <Badge variant={variantMap[status] || "gray"}>
        {labelMap[status] || status}
      </Badge>
    );
  }

  const columns: Column<ViewingSchedule>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800 w-2">{index + 1}</span>,
    },
    {
      key: "guest_name",
      label: "Khách",
      isTitle: true,
      render: (s: ViewingSchedule) => <span className="font-semibold text-gray-805">{parseGuestName(s.guest_name).name}</span>,
    },
    {
      key: "apartment",
      label: "Căn hộ",
      render: (s: ViewingSchedule) => {
        if (!s.apartment) return <span className="text-gray-400">#{s.apartment_id}</span>;
        const roomName = formatApartmentDisplay(s.apartment.room_number, s.apartment.floor);
        const branch = buildings.find((b) => b.id === s.apartment?.building_id)?.branch_name;
        return (
          <div className="flex flex-col">
            <span className="font-semibold">{roomName}</span>
            {role === "ADMIN" && branch && (
              <span className="text-[10px] font-semibold text-primary-600">{branch}</span>
            )}
          </div>
        );
      }
    },
    {
      key: "guest_phone",
      label: "SĐT",
      render: (s: ViewingSchedule) => <span className="text-gray-650">{maskPhone(s.guest_phone)}</span>,
    },
    {
      key: "guest_email",
      label: "Email",
      render: (s: ViewingSchedule) => <span className="text-gray-655 font-medium">{s.guest_email || "-"}</span>,
    },
    {
      key: "schedule_time",
      label: "Thời gian",
      render: (s: ViewingSchedule) => <span className="text-gray-650 font-medium">{new Date(s.schedule_time).toLocaleString("vi-VN")}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (s: ViewingSchedule) => getStatusBadge(s.status),
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      isAction: true,
      render: (s: ViewingSchedule) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewItem(s)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>

          {s.status === "PENDING" ? (
            <>
              <button
                onClick={() => handleConfirm(s.id)}
                className="p-2 rounded-lg text-green-655 hover:text-green-600 hover:bg-green-50 cursor-pointer"
                title="Xác nhận"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleCancel(s.id)}
                className="p-2 rounded-lg text-red-655 hover:text-red-600 hover:bg-red-55/20 cursor-pointer"
                title="Hủy lịch"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setDeleteItem(s)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-55/20 cursor-pointer"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch xem phòng"
        subtitle="Quản lý các lượt hẹn xem phòng của khách hàng"
        count={schedules.length}
        actions={
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên khách, SĐT..."
            className="w-64 sm:w-80"
          />
        }
      />

      <div className="grid grid-cols-12 gap-3 w-full font-sans">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={[
              { value: "PENDING", label: "Chờ xác nhận" },
              { value: "CONFIRMED", label: "Đã xác nhận" },
              { value: "CANCELLED", label: "Đã hủy" }
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            placeholder="Tất cả trạng thái"
            searchable={false}
            className="w-full"
            triggerClassName="h-10 rounded-xl border-gray-300"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `Ngày ${i + 1}` }))}
            value={filterDay}
            onChange={(val) => {
              setFilterDay(val);
              setCurrentPage(1);
            }}
            placeholder="Chọn ngày"
            searchable={true}
            className="w-full"
            triggerClassName="h-10 rounded-xl border-gray-300"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }))}
            value={filterMonth}
            onChange={(val) => {
              setFilterMonth(val);
              setCurrentPage(1);
            }}
            placeholder="Chọn tháng"
            searchable={false}
            className="w-full"
            triggerClassName="h-10 rounded-xl border-gray-300"
            clearable={true}
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <Combobox
            options={(() => {
              const cy = new Date().getFullYear();
              return Array.from({ length: 5 }, (_, i) => ({ value: String(cy - 1 + i), label: `Năm ${cy - 1 + i}` }));
            })()}
            value={filterYear}
            onChange={(val) => {
              setFilterYear(val);
              setCurrentPage(1);
            }}
            placeholder="Chọn năm"
            searchable={false}
            className="w-full"
            triggerClassName="h-10 rounded-xl border-gray-300"
            clearable={true}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedSchedules}
        emptyMessage="Chưa có lịch xem phòng nào"
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

      <ScheduleDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        schedule={viewItem}
        role={role}
        buildings={buildings}
      />
    </div>
  );
}
