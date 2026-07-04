import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useApartmentModify } from "../../../../hooks/admin/useApartmentModify";

interface ApartmentModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: ApartmentData | null;
  buildings: BuildingData[];
  role: string | null;
}

export default function ApartmentModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  buildings,
  role,
}: ApartmentModifyModalProps) {
  const {
    saving,
    localThumbnail,
    localImages,
    formData,
    setFormData,
    handleThumbnailChange,
    handleDetailImageChange,
    removeThumbnail,
    removeDetailImage,
    handleSave,
  } = useApartmentModify({
    isOpen,
    onClose,
    onSuccess,
    editItem,
    buildings,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa căn hộ"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} isLoading={saving}>Cập nhật</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Số phòng *"
              type="text"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="Nhập số phòng"
              className="rounded-md"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-semibold text-gray-855 mb-1.5">Chi nhánh *</label>
            <Combobox
              options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
              value={formData.building_id ? String(formData.building_id) : ""}
              onChange={(val) => setFormData({ ...formData, building_id: Number(val) })}
              disabled={role === "MANAGER"}
              placeholder="Chọn chi nhánh"
              searchPlaceholder="Tìm chi nhánh..."
              triggerClassName="rounded-md"
              clearable={false}
            />
          </div>

          <div className="col-span-12 sm:col-span-4">
            <Input
              label="Tầng *"
              type="number"
              value={formData.floor || ""}
              onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
              min={1}
              className="rounded-md"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Input
              label="Diện tích (m²)"
              type="number"
              value={formData.area || ""}
              onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
              className="rounded-md"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Input
              label="Giá thuê (VNĐ)"
              type="number"
              value={formData.rental_price || ""}
              onChange={(e) => setFormData({ ...formData, rental_price: Number(e.target.value) })}
              className="rounded-md"
            />
          </div>

          <div className="col-span-12 sm:col-span-4">
            <Input
              label="Phòng ngủ"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
              min={0}
              className="rounded-md"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <Input
              label="Phòng tắm"
              type="number"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
              min={0}
              className="rounded-md"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
            <Combobox
              options={[
                { value: "AVAILABLE", label: "Còn trống" },
                { value: "RENTED", label: "Đang thuê" },
                { value: "MAINTENANCE", label: "Bảo trì" }
              ]}
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              placeholder="Chọn trạng thái"
              searchable={false}
              triggerClassName="rounded-md"
              clearable={false}
            />
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="premium-input rounded-md resize-none"
            />
          </div>

          {/* Hình ảnh căn hộ */}
          <div className="col-span-12 space-y-4 pt-2 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-800">Hình ảnh căn hộ</label>

            {/* Ảnh bìa */}
            <div className="space-y-1.5 flex flex-col items-center justify-center">
              <span className="text-xs text-gray-500 font-medium text-center">Ảnh bìa (Thumbnail)</span>
              {localThumbnail ? (
                <div className="relative border border-gray-200 rounded-md overflow-hidden h-40 w-full max-w-md bg-gray-50 flex items-center justify-center shadow-sm">
                  <img src={localThumbnail} className="h-full w-full object-cover" alt="Thumbnail preview" />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-full text-xs shadow-md transition-colors cursor-pointer"
                    title="Xóa"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/10 rounded-md h-40 w-full max-w-md flex flex-col items-center justify-center cursor-pointer transition-colors shadow-sm bg-white">
                  <span className="text-sm text-gray-400 font-mono font-medium">Chọn hình ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                </label>
              )}
            </div>

            {/* Ảnh chi tiết */}
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">Ảnh chi tiết (Tối đa 4 ảnh)</span>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const imageUrl = localImages[idx];
                  return (
                    <div key={idx} className="w-full">
                      {imageUrl ? (
                        <div className="relative border border-gray-200 rounded-md overflow-hidden h-20 w-full bg-gray-50 flex items-center justify-center">
                          <img src={imageUrl} className="h-full w-full object-cover" alt={`Detail preview ${idx + 1}`} />
                          <button
                            type="button"
                            onClick={() => removeDetailImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full text-[10px] shadow transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/10 rounded-md h-20 w-full flex items-center justify-center cursor-pointer transition-colors text-center px-1">
                          <span className="text-[10px] text-gray-400 font-mono font-medium whitespace-nowrap">chọn hình ảnh</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDetailImageChange(e, idx)} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
