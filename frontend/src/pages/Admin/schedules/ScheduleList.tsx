import { useState, useEffect } from "react";
import { CalendarDays, Check, X, Trash2, Loader2 } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { toast } from "sonner";

import { useAuthStore } from "../../../stores/auth.store";
import { mockUsers } from "../../../data/users";
import * as scheduleService from "../../../services/schedules.service";
import type { ScheduleData } from "../../../services/schedules.service";

import { useSort } from "../../../hooks/useSort";
import { formatApartmentDisplay, removeVietnameseTones } from "../../../utils/format";
import { mockBuildings } from "../../../data/buildings";

export default function ScheduleList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteItem, setDeleteItem] = useState<ScheduleData | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    try {
      setLoading(true);
      const data = await scheduleService.getSchedules();
      setSchedules(data);
    } catch {
      toast.error("Không thể tải danh sách lịch xem phòng");
    } finally {
      setLoading(false);
    }
  }

  const displaySchedules = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      return schedules.filter(
        (s) => s.apartment?.building_id === managerBuildingId
      );
    }
    return schedules;
  })();

  const filtered = displaySchedules.filter((s) => {
    const term = removeVietnameseTones(search);
    const nameNorm = removeVietnameseTones(s.guest_name);
    const phoneNorm = removeVietnameseTones(s.guest_phone);
    const emailNorm = removeVietnameseTones(s.guest_email || "");
    const roomNorm = removeVietnameseTones(s.apartment?.room_number || "");
    return (
      nameNorm.includes(term) ||
      phoneNorm.includes(term) ||
      emailNorm.includes(term) ||
      roomNorm.includes(term)
    );
  });

  const { items: sortedSchedules, requestSort, getSortIcon } = useSort(filtered, null, {
    apartment_id: (s) => s.apartment?.room_number || String(s.apartment_id),
    schedule_time: (s) => new Date(s.schedule_time).getTime(),
  });

  async function handleConfirm(id: number) {
    try {
      await scheduleService.confirmSchedule(id);
      toast.success("Đã xác nhận lịch xem phòng");
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xác nhận thất bại");
    }
  }

  async function handleCancel(id: number) {
    try {
      await scheduleService.cancelSchedule(id);
      toast.success("Đã hủy lịch");
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Hủy thất bại");
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await scheduleService.deleteSchedule(deleteItem.id);
      toast.success("Đã xóa lịch");
      setDeleteItem(null);
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xóa thất bại");
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      PENDING: { label: "Chờ xác nhận", variant: "warning" },
      CONFIRMED: { label: "Đã xác nhận", variant: "success" },
      CANCELLED: { label: "Đã hủy", variant: "gray" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
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

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." className="max-w-md" />

      {/* Bảng */}
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => requestSort("guest_name")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Khách {getSortIcon("guest_name")}
                </th>
                <th onClick={() => requestSort("guest_phone")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  SĐT {getSortIcon("guest_phone")}
                </th>
                <th onClick={() => requestSort("guest_email")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Email {getSortIcon("guest_email")}
                </th>
                <th onClick={() => requestSort("apartment_id")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Căn hộ {getSortIcon("apartment_id")}
                </th>
                <th onClick={() => requestSort("schedule_time")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Thời gian {getSortIcon("schedule_time")}
                </th>
                <th onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Trạng thái {getSortIcon("status")}
                </th>
                <th className="text-right">Chức năng</th>
              </tr>
            </thead>
            <tbody>
              {sortedSchedules.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-gray-800">{s.guest_name}</td>
                  <td className="text-gray-650">{s.guest_phone}</td>
                  <td className="text-gray-500">
                    {s.guest_email ? (
                      <span className="truncate max-w-[150px]">{s.guest_email}</span>
                    ) : "-"}
                  </td>
                  <td className="text-gray-600">
                    {s.apartment ? (
                      <span className="font-medium text-primary-600">
                        {formatApartmentDisplay(
                          s.apartment.room_number,
                          s.apartment.floor,
                          role || undefined,
                          mockBuildings.find((b) => b.id === s.apartment?.building_id)?.branch_name
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">#{s.apartment_id}</span>
                    )}
                  </td>
                  <td className="text-gray-600">
                    {new Date(s.schedule_time).toLocaleString("vi-VN")}
                  </td>
                  <td>{getStatusBadge(s.status)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
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
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <CalendarDays size={48} className="mx-auto mb-3 text-gray-300" />
                    Chưa có lịch xem phòng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xóa lịch xem phòng"
        message={`Xóa lịch xem phòng của "${deleteItem?.guest_name}"?`}
        confirmText="Xóa"
      />
    </div>
  );
}
