import { useState, useEffect } from "react";
import { CalendarDays, Check, X, Trash2, Loader2, Mail } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import SearchInput from "../../components/ui/SearchInput";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { toast } from "sonner";

import { useAuthStore } from "../../stores/auth.store";
import { mockUsers } from "../../data/users";
import * as scheduleService from "../../services/schedules.service";
import type { ScheduleData } from "../../services/schedules.service";

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

  const filtered = displaySchedules.filter(
    (s) =>
      s.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      s.guest_phone.includes(search) ||
      (s.guest_email && s.guest_email.toLowerCase().includes(search.toLowerCase()))
  );

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

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, SĐT, email..." className="max-w-md" />

      {/* Bảng */}
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Khách</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Căn hộ</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-gray-800">{s.guest_name}</td>
                  <td className="text-gray-650">{s.guest_phone}</td>
                  <td className="text-gray-500">
                    {s.guest_email ? (
                      <div className="flex items-center gap-1">
                        <Mail size={13} className="text-gray-400" />
                        <span className="truncate max-w-[150px]">{s.guest_email}</span>
                      </div>
                    ) : "-"}
                  </td>
                  <td className="text-gray-600">
                    {s.apartment ? (
                      <span className="font-medium text-primary-600">
                        P.{s.apartment.room_number} - T{s.apartment.floor}
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
