import { CalendarDays, Eye, Check, X, Trash2 } from "lucide-react";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import PageHeader from "../../../components/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Combobox from "../../../components/ui/Combobox";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../components/ui/Table";
import Pagination from "../../../components/ui/Pagination";
import { maskPhone } from "../../../utils/string";
import { formatApartmentDisplay, parseGuestName } from "../../../utils/string";
import { useScheduleList } from "../../../hooks/admin/useScheduleList";

import ScheduleDeleteModal from "./components/ScheduleDeleteModal";
import ScheduleDetailModal from "./components/ScheduleDetailModal";

export default function Schedule() {
  const {
    role,
    buildings,
    schedules,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
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
    requestSort,
    getSortIcon,
  } = useScheduleList();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title="Lịch xem phòng"
        subtitle="Quản lý các lượt hẹn xem phòng của khách hàng"
        count={schedules.length}
        iconColor="linear-gradient(135deg, #3B82F6, #60A5FA)"
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

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
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
          className="w-full sm:w-48"
          triggerClassName="h-10 rounded-xl border-gray-300"
          clearable={true}
        />
      </div>

      {paginatedSchedules.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
          <CalendarDays size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Chưa có lịch xem phòng nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginatedSchedules.map((s) => {
              const guestName = parseGuestName(s.guest_name).name;
              const aptDisplay = s.apartment ? formatApartmentDisplay(
                s.apartment.room_number,
                s.apartment.floor,
                role || undefined,
                buildings.find((b) => b.id === s.apartment?.building_id)?.branch_name
              ) : `#${s.apartment_id}`;
              const formattedTime = new Date(s.schedule_time).toLocaleString("vi-VN");

              return (
                <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-base">
                      {guestName}
                    </span>
                    {getStatusBadge(s.status)}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">Căn hộ:</span> <span className="text-primary-600 font-semibold">{aptDisplay}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Số điện thoại:</span> {maskPhone(s.guest_phone)}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Email:</span> {s.guest_email || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Thời gian xem:</span> <span className="font-medium text-gray-800">{formattedTime}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setViewItem(s)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Eye size={14} /> Chi tiết
                    </button>
                    {s.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() => handleConfirm(s.id)}
                          className="px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 flex items-center gap-1 text-xs cursor-pointer"
                        >
                          <Check size={14} /> Xác nhận
                        </button>
                        <button
                          onClick={() => handleCancel(s.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                        >
                          <X size={14} /> Hủy lịch
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteItem(s)}
                        className="px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* View List */}
          <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-lg">
            <Table className="compact">
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("guest_name")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Khách {getSortIcon("guest_name")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("apartment_id")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Căn hộ {getSortIcon("apartment_id")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("guest_phone")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    SĐT {getSortIcon("guest_phone")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("guest_email")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Email {getSortIcon("guest_email")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("schedule_time")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Thời gian {getSortIcon("schedule_time")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Trạng thái {getSortIcon("status")}
                  </TableHead>
                  <TableHead className="text-right">Chức năng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSchedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-gray-800">{parseGuestName(s.guest_name).name}</TableCell>
                    <TableCell className="text-gray-655">
                      {s.apartment ? (
                        <span className="font-medium text-primary-600">
                          {formatApartmentDisplay(
                            s.apartment.room_number,
                            s.apartment.floor,
                            role || undefined,
                            buildings.find((b) => b.id === s.apartment?.building_id)?.branch_name
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">#{s.apartment_id}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">{maskPhone(s.guest_phone)}</TableCell>
                    <TableCell className="text-gray-655 font-medium">
                      {s.guest_email || "-"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(s.schedule_time).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell>
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
                              className="p-2 rounded-lg text-red-655 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hủy lịch"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteItem(s)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      <ScheduleDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        schedule={deleteItem}
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
