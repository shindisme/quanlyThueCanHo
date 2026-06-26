import { Plus } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import type { BuildingData } from "../../../../services/buildingService";
import { useBuildingModify } from "../../../../hooks/useBuildingModify";

interface BuildingModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: BuildingData | null;
}

export default function BuildingModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: BuildingModifyModalProps) {
  const {
    saving,
    formData,
    setFormData,
    previewUrl,
    handleImageUpload,
    handleRemoveImage,
    handleSave,
    availableManagers,
  } = useBuildingModify({ isOpen, onClose, onSuccess, editItem });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa tòa nhà"
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
          <div className="col-span-12">
            <Input
              label="Tên chi nhánh/tòa nhà *"
              value={formData.branch_name}
              onChange={(e) => setFormData({ ...formData, branch_name: e.target.value, name: e.target.value })}
              placeholder="VD: Chi nhánh Quận 1"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Địa chỉ cũ *"
              value={formData.address_old}
              onChange={(e) => setFormData({ ...formData, address_old: e.target.value })}
              placeholder="VD: 123 Nguyễn Huệ, Quận 1"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Địa chỉ mới *"
              value={formData.address_new}
              onChange={(e) => setFormData({ ...formData, address_new: e.target.value })}
              placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1"
            />
          </div>
          <div className="col-span-12">
            <Input
              label="Số tầng *"
              type="number"
              value={formData.total_floors || ""}
              onChange={(e) => setFormData({ ...formData, total_floors: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-12">
            <Combobox
              label="Quản lý bởi"
              value={formData.staff_id ? String(formData.staff_id) : ""}
              onChange={(val) => setFormData({ ...formData, staff_id: val ? Number(val) : null })}
              placeholder="-- Chưa phân công --"
              searchPlaceholder="Tìm người quản lý..."
              options={availableManagers.map((s) => ({
                value: String(s.id),
                label: `${s.full_name} (${s.user?.username || s.position})`,
              }))}
              triggerClassName="rounded-md"
            />
          </div>
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Ảnh bìa tòa nhà</label>
            <div className="flex flex-col items-center justify-center gap-3">
              {previewUrl ? (
                <div className="relative w-40 h-28 rounded-md overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-full text-xs shadow-md transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-40 h-28 border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/10 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors shadow-sm">
                  <Plus className="text-gray-400" size={24} />
                  <span className="text-xs text-gray-400 mt-1.5 font-medium">Chọn hình ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
              <div className="text-xs text-gray-400 text-center">
                <p>Hỗ trợ định dạng JPG, PNG, WEBP.</p>
              </div>
            </div>
          </div>
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Mô tả ngắn gọn về tòa nhà..."
              className="premium-input rounded-md resize-none"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
