import React from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { toast } from "sonner";
import { broadcastNotificationSchema } from "../../../../schemas/notification.schema";
import type { Building, Apartment } from "../../../../types";

interface NotificationBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  buildings: Building[];
  apartments: Apartment[];
  loadingApartments: boolean;
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  type: string;
  setType: (val: string) => void;
  buildingId?: number;
  setBuildingId: (val?: number) => void;
  targetType: "BUILDING" | "APARTMENTS";
  setTargetType: (val: "BUILDING" | "APARTMENTS") => void;
  selectedApartmentIds: number[];
  handleToggleApartment: (id: number) => void;
  handleSendNotificationSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
}

export default function NotificationBroadcastModal({
  isOpen,
  onClose,
  role,
  buildings,
  apartments,
  loadingApartments,
  title,
  setTitle,
  content,
  setContent,
  type,
  setType,
  buildingId,
  setBuildingId,
  targetType,
  setTargetType,
  selectedApartmentIds,
  handleToggleApartment,
  handleSendNotificationSubmit,
  isSending,
}: NotificationBroadcastModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      content,
      type: type as "GENERAL" | "INVOICE" | "MAINTENANCE" | "SYSTEM",
      target_type: targetType,
      building_id: Number(buildingId || 0),
      apartment_ids: targetType === "APARTMENTS" ? selectedApartmentIds : undefined,
    };

    const validation = broadcastNotificationSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Dữ liệu thông báo không hợp lệ");
      return;
    }

    handleSendNotificationSubmit(e);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Phát Thông Báo Mới">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1">Tòa nhà / Chi nhánh</label>
            {role === "ADMIN" ? (
              <Combobox
                options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
                value={buildingId ? String(buildingId) : ""}
                onChange={(val) => setBuildingId(val ? Number(val) : undefined)}
                placeholder="Chọn tòa nhà"
                clearable={false}
                triggerClassName="h-[42px] rounded-xl border-gray-200"
              />
            ) : (
              <div className="h-10.5 flex items-center px-4 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold">
                {buildings.find((b) => b.id === buildingId)?.branch_name || "Tòa nhà quản lý"}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-650 block mb-1">Phân loại thông báo</label>
            <Combobox
              options={[
                { value: "GENERAL", label: "Thông tin chung" },
                { value: "INVOICE", label: "Tiền điện nước / Hóa đơn" },
                { value: "MAINTENANCE", label: "Sửa chữa / Bảo trì tòa nhà" },
                { value: "SYSTEM", label: "Cảnh báo hệ thống" },
              ]}
              value={type}
              onChange={setType}
              searchable={false}
              clearable={false}
              triggerClassName="h-[42px] rounded-xl border-gray-200"
            />
          </div>
        </div>

        {/* Radio Option Cards */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-650 block">Đối tượng nhận thông báo</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${targetType === "BUILDING" ? "border-primary-500 bg-primary-50/20" : "border-gray-200 hover:bg-gray-50"
                }`}
            >
              <input
                type="radio"
                name="targetType"
                value="BUILDING"
                checked={targetType === "BUILDING"}
                onChange={() => setTargetType("BUILDING")}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-800">Tất cả cư dân tòa nhà</span>
            </label>

            <label
              className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${targetType === "APARTMENTS" ? "border-primary-500 bg-primary-50/20" : "border-gray-200 hover:bg-gray-50"
                }`}
            >
              <input
                type="radio"
                name="targetType"
                value="APARTMENTS"
                checked={targetType === "APARTMENTS"}
                onChange={() => setTargetType("APARTMENTS")}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-800">Chọn căn hộ cụ thể</span>
            </label>
          </div>
        </div>

        {/* Apartment Selection Grid */}
        {targetType === "APARTMENTS" && buildingId && (
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <label className="text-xs font-semibold text-gray-600 block">
              Chọn căn hộ nhận thông báo ({selectedApartmentIds.length} đã chọn):
            </label>
            {loadingApartments ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size={20} />
              </div>
            ) : apartments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Không có căn hộ nào trong tòa nhà.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto border border-gray-200 p-2.5 bg-gray-50/50 rounded-xl">
                {apartments.map((apt) => {
                  const isSelected = selectedApartmentIds.includes(apt.id);
                  return (
                    <button
                      type="button"
                      key={apt.id}
                      onClick={() => handleToggleApartment(apt.id)}
                      className={`py-1.5 text-center font-bold text-xs select-none border transition-all cursor-pointer rounded-lg ${isSelected
                        ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      P.{apt.floor}{apt.room_number}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Input
            label="Tiêu đề thông báo *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề thông báo (từ 5 - 100 ký tự)"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-650 block">Nội dung thông báo *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung thông báo chi tiết..."
            rows={4}
            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 p-3 text-sm transition-all"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSending} className="rounded-xl">
            Hủy
          </Button>
          <Button type="submit" disabled={isSending} className="rounded-xl font-semibold">
            {isSending ? "Đang phát..." : "Phát thông báo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
