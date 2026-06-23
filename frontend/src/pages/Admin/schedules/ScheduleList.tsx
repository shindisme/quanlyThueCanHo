import { useState, useEffect } from "react";
import { CalendarDays, Check, X, Trash2, Loader2, Eye, Mail } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import { toast } from "sonner";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

import { useAuthStore } from "../../../stores/auth.store";
import * as scheduleService from "../../../services/scheduleService";
import type { ScheduleData } from "../../../services/scheduleService";

import { useSort } from "../../../hooks/useSort";
import { formatApartmentDisplay, removeVietnameseTones, maskPhone } from "../../../utils/format";
import { mockBuildings } from "../../../data/buildings";

import ScheduleDeleteModal from "./components/ScheduleDeleteModal";
import ScheduleDetailModal from "./components/ScheduleDetailModal";

export default function ScheduleList() {
  const { role, managedBuildingId } = useAuthStore();

  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteItem, setDeleteItem] = useState<ScheduleData | null>(null);
  const [viewItem, setViewItem] = useState<ScheduleData | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Email modal states
  const [emailItem, setEmailItem] = useState<ScheduleData | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<"confirm" | "cancel" | "reminder">("confirm");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (!emailItem) return;
    const building = mockBuildings.find(b => b.id === emailItem.apartment?.building_id);
    const roomNumber = emailItem.apartment?.room_number || "";
    const floor = emailItem.apartment?.floor || "";
    const buildingName = building?.branch_name || building?.name || "Yuki House";
    const aptLabel = roomNumber ? `Căn hộ P.${floor}${roomNumber} tại chi nhánh ${buildingName}` : "căn hộ";
    const timeStr = new Date(emailItem.schedule_time).toLocaleString("vi-VN");

    if (emailTemplate === "confirm") {
      setEmailSubject(`[Yuki House] Xác nhận lịch xem phòng ${aptLabel}`);
      setEmailBody(
        `Kính gửi anh/chị ${emailItem.guest_name},\n\n` +
        `Yuki House xin trân trọng xác nhận lịch hẹn xem phòng của anh/chị:\n` +
        `- Căn hộ: ${aptLabel}\n` +
        `- Thời gian: ${timeStr}\n\n` +
        `Nhân viên hỗ trợ sẽ đón anh/chị tại sảnh tòa nhà trước giờ hẹn 5 phút. Nếu cần hỗ trợ thêm hoặc muốn thay đổi lịch hẹn, vui lòng liên hệ hotline: 0901000001.\n\n` +
        `Trân trọng,\nBan quản lý Yuki House`
      );
    } else if (emailTemplate === "cancel") {
      setEmailSubject(`[Yuki House] Thông báo hủy lịch xem phòng ${aptLabel}`);
      setEmailBody(
        `Kính gửi anh/chị ${emailItem.guest_name},\n\n` +
        `Rất tiếc Yuki House phải thông báo hủy lịch hẹn xem phòng của anh/chị:\n` +
        `- Căn hộ: ${aptLabel}\n` +
        `- Thời gian dự kiến: ${timeStr}\n\n` +
        `Lý do: Căn hộ này hiện đã được khách hàng khác đặt cọc thuê hoặc có thay đổi đột xuất từ chủ nhà. Chúng tôi rất xin lỗi vì sự bất tiện này.\n` +
        `Vui lòng truy cập website hoặc liên hệ hotline để lựa chọn căn hộ khác phù hợp.\n\n` +
        `Trân trọng,\nBan quản lý Yuki House`
      );
    } else {
      setEmailSubject(`[Yuki House] Nhắc nhở lịch xem phòng ${aptLabel}`);
      setEmailBody(
        `Kính gửi anh/chị ${emailItem.guest_name},\n\n` +
        `Yuki House xin nhắc nhở lịch hẹn xem phòng của anh/chị sắp tới:\n` +
        `- Căn hộ: ${aptLabel}\n` +
        `- Thời gian: ${timeStr}\n\n` +
        `Hẹn gặp anh/chị tại địa điểm xem phòng. Nếu có thay đổi, xin vui lòng báo trước cho chúng tôi ít nhất 2 tiếng.\n\n` +
        `Trân trọng,\nBan quản lý Yuki House`
      );
    }
  }, [emailItem, emailTemplate]);

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
    if (role === "MANAGER" && managedBuildingId) {
      return schedules.filter(
        (s) => s.apartment?.building_id === managedBuildingId
      );
    }
    return schedules;
  })();

  const filtered = displaySchedules.filter((s) => {
    const term = removeVietnameseTones(search);
    const nameNorm = removeVietnameseTones(s.guest_name);
    const phoneNorm = removeVietnameseTones(s.guest_phone);
    const roomNorm = removeVietnameseTones(s.apartment?.room_number || "");
    return (
      nameNorm.includes(term) ||
      phoneNorm.includes(term) ||
      roomNorm.includes(term)
    );
  });

  const { items: sortedSchedules, requestSort, getSortIcon } = useSort(filtered, null, {
    apartment_id: (s) => s.apartment?.room_number || String(s.apartment_id),
    schedule_time: (s) => new Date(s.schedule_time).getTime(),
  });

  const paginatedSchedules = sortedSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  async function handleConfirm(id: number) {
    try {
      await scheduleService.confirmSchedule(id);
      toast.success("Đã xác nhận lịch xem phòng");

      const item = schedules.find((s) => s.id === id);
      if (item && item.guest_email) {
        setEmailItem({ ...item, status: "CONFIRMED" });
        setEmailTemplate("confirm");
      }

      fetchSchedules();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xác nhận thất bại");
    }
  }

  async function handleCancel(id: number) {
    try {
      await scheduleService.cancelSchedule(id);
      toast.success("Đã hủy lịch");

      const item = schedules.find((s) => s.id === id);
      if (item && item.guest_email) {
        setEmailItem({ ...item, status: "CANCELLED" });
        setEmailTemplate("cancel");
      }

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
                <th onClick={() => requestSort("apartment_id")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Căn hộ {getSortIcon("apartment_id")}
                </th>
                <th onClick={() => requestSort("guest_email" as any)} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Email {getSortIcon("guest_email" as any)}
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
              {paginatedSchedules.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-gray-800">{s.guest_name}</td>
                  <td className="text-gray-650">{maskPhone(s.guest_phone)}</td>
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
                  <td className="text-gray-650 font-medium">
                    {s.guest_email || "-"}
                  </td>
                  <td className="text-gray-600">
                    {new Date(s.schedule_time).toLocaleString("vi-VN")}
                  </td>
                  <td>{getStatusBadge(s.status)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewItem(s)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      {s.guest_email && (
                        <button
                          onClick={() => {
                            setEmailItem(s);
                            if (s.status === "PENDING") {
                              setEmailTemplate("confirm");
                            } else if (s.status === "CANCELLED") {
                              setEmailTemplate("cancel");
                            } else {
                              setEmailTemplate("reminder");
                            }
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-650 hover:bg-blue-50 cursor-pointer"
                          title="Gửi Email"
                        >
                          <Mail size={16} />
                        </button>
                      )}
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
                        className="p-2 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-55/60 cursor-pointer"
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filtered.length / itemsPerPage)}
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
      />

      {/* Send Email Modal */}
      <Modal
        isOpen={!!emailItem}
        onClose={() => setEmailItem(null)}
        title="Gửi email thông báo cho khách"
        size="md"
        footer={
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => {
                if (!emailItem) return;
                const mailtoUrl = `mailto:${emailItem.guest_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                window.open(mailtoUrl, "_blank");
                setEmailItem(null);
              }}
            >
              Gửi qua Mail App
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEmailItem(null)}>
                Đóng
              </Button>
              <Button
                isLoading={sendingEmail}
                onClick={async () => {
                  setSendingEmail(true);
                  // Simulate system sending email
                  await new Promise((resolve) => setTimeout(resolve, 1200));
                  setSendingEmail(false);
                  toast.success(`Hệ thống đã gửi email thành công tới ${emailItem?.guest_email}!`);
                  setEmailItem(null);
                }}
              >
                Gửi qua Hệ thống
              </Button>
            </div>
          </div>
        }
      >
        {emailItem && (
          <div className="space-y-4 font-sans text-xs sm:text-sm">
            <div className="flex flex-col gap-1">
              <label className="text-gray-500 font-semibold">Khách hàng:</label>
              <input
                type="text"
                disabled
                value={`${emailItem.guest_name} (${emailItem.guest_email})`}
                className="premium-input rounded-xl bg-gray-50 text-gray-500 disabled:opacity-80"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-500 font-semibold">Chọn mẫu email:</label>
              <div className="flex gap-4 py-1.5">
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="emailTemplate"
                    checked={emailTemplate === "confirm"}
                    onChange={() => setEmailTemplate("confirm")}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  Xác nhận đặt lịch
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="emailTemplate"
                    checked={emailTemplate === "cancel"}
                    onChange={() => setEmailTemplate("cancel")}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  Hủy đặt lịch
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="emailTemplate"
                    checked={emailTemplate === "reminder"}
                    onChange={() => setEmailTemplate("reminder")}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  Gửi lời nhắc nhở
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-500 font-semibold">Tiêu đề email:</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="premium-input rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-500 font-semibold">Nội dung email:</label>
              <textarea
                rows={8}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="premium-input rounded-xl resize-none leading-relaxed text-xs"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
