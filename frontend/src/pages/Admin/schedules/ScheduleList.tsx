import { CalendarDays, Check, X, Trash2, Eye } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import Pagination from "../../../components/ui/Pagination";
import Combobox from "../../../components/ui/Combobox";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

import { useScheduleList } from "../../../hooks/useScheduleList";
import { formatApartmentDisplay, maskPhone, parseGuestName } from "../../../utils/string";

import ScheduleDeleteModal from "./components/ScheduleDeleteModal";
import ScheduleDetailModal from "./components/ScheduleDetailModal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

export default function ScheduleList() {
  const {
    role,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deleteItem,
    setDeleteItem,
    viewItem,
    setViewItem,
    buildings,
    schedules,
    requestSort,
    getSortIcon,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedSchedules,
    handleConfirm,
    handleCancel,
    handleDelete,
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
    const variant = variantMap[status] || "gray";
    const labelMap: Record<string, string> = {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      CANCELLED: "Đã hủy",
    };
    const label = labelMap[status] || status;
    return <Badge variant={variant}>{label}</Badge>;
  }


  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title="Lịch xem phòng"
        subtitle="Quản lý lịch hẹn xem căn hộ"
        count={schedules.length}
        iconColor="linear-gradient(135deg, #EC4899, #F472B6)"
      />

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Tìm kiếm..." className="flex-1 max-w-md w-full sm:w-72" />
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

      {/* Bảng */}
      <div className="border border-gray-200 overflow-hidden bg-white shadow-sm">
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
            {paginatedSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  <CalendarDays size={48} className="mx-auto mb-3 text-gray-300" />
                  Chưa có lịch xem phòng nào
                </TableCell>
              </TableRow>
            ) : (
              paginatedSchedules.map((s) => (
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
                  <TableCell className="text-gray-650 font-medium">
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

                      {s.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleConfirm(s.id)}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer"
                            title="Xác nhận"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                            title="Hủy"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteItem(s)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-655 hover:bg-red-55/60 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
