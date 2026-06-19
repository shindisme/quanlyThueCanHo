import { useState, useEffect } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import * as apartmentService from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";
import { toast } from "sonner";

interface ApartmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingData[];
  role: string | null;
  managerBuildingId?: number;
}

export default function ApartmentCreateModal({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  role,
  managerBuildingId,
}: ApartmentCreateModalProps) {
  const [saving, setSaving] = useState(false);
  const [localThumbnail, setLocalThumbnail] = useState<string>("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [detailFiles, setDetailFiles] = useState<(File | null)[]>([null, null, null, null]);

  const defaultBuildingId = role === "MANAGER" && managerBuildingId ? managerBuildingId : (buildings[0]?.id || 0);

  const [formData, setFormData] = useState({
    room_number: "",
    building_id: defaultBuildingId,
    floor: 1,
    area: 0,
    bedrooms: 1,
    bathrooms: 1,
    rental_price: 0,
    description: "",
    status: "AVAILABLE",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        room_number: "",
        building_id: defaultBuildingId,
        floor: 1,
        area: 0,
        bedrooms: 1,
        bathrooms: 1,
        rental_price: 0,
        description: "",
        status: "AVAILABLE",
      });
      setLocalThumbnail("");
      setLocalImages([]);
      setThumbnailFile(null);
      setDetailFiles([null, null, null, null]);
    }
  }, [isOpen, defaultBuildingId]);

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLocalThumbnail(URL.createObjectURL(file));
      setThumbnailFile(file);
    }
  }

  function handleDetailImageChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalImages((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      setDetailFiles((prev) => {
        const next = [...prev];
        next[index] = file;
        return next;
      });
    }
  }

  function removeThumbnail() {
    setLocalThumbnail("");
    setThumbnailFile(null);
  }

  function removeDetailImage(index: number) {
    setLocalImages((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setDetailFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }

  async function handleSave() {
    if (!formData.room_number || !formData.building_id) {
      toast.error("Vui lòng nhập số phòng và chọn chi nhánh");
      return;
    }
    const selectedBuilding = buildings.find((b) => b.id === formData.building_id);
    if (selectedBuilding) {
      if (formData.floor <= 0 || formData.floor > selectedBuilding.total_floors) {
        toast.error(`Tầng không tồn tại. Chi nhánh này chỉ có tối đa ${selectedBuilding.total_floors} tầng.`);
        return;
      }
    }
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("room_number", formData.room_number);
      formDataToSend.append("building_id", String(formData.building_id));
      formDataToSend.append("floor", String(formData.floor));
      formDataToSend.append("area", String(formData.area));
      formDataToSend.append("bedrooms", String(formData.bedrooms));
      formDataToSend.append("bathrooms", String(formData.bathrooms));
      formDataToSend.append("rental_price", String(formData.rental_price));
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("status", formData.status);

      if (thumbnailFile) {
        formDataToSend.append("images", thumbnailFile);
      }

      detailFiles.forEach((file) => {
        if (file) {
          formDataToSend.append("images", file);
        }
      });

      await apartmentService.createApartment(formDataToSend);
      toast.success("Đã thêm căn hộ mới");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm căn hộ mới"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} isLoading={saving}>Thêm mới</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số phòng *</label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="VD: 01, 02, 10..."
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh *</label>
            <select
              value={formData.building_id}
              onChange={(e) => setFormData({ ...formData, building_id: Number(e.target.value) })}
              disabled={role === "MANAGER"}
              className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value={0}>Chọn chi nhánh</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tầng *</label>
            <input
              type="number"
              value={formData.floor || ""}
              onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
              min={1}
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Diện tích (m²)</label>
            <input
              type="number"
              value={formData.area || ""}
              onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá thuê (VNĐ)</label>
            <input
              type="number"
              value={formData.rental_price || ""}
              onChange={(e) => setFormData({ ...formData, rental_price: Number(e.target.value) })}
              className="premium-input rounded-xl"
            />
          </div>

          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng ngủ</label>
            <input
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
              min={0}
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng tắm</label>
            <input
              type="number"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
              min={0}
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="premium-select w-full rounded-xl"
            >
              <option value="AVAILABLE">Còn trống</option>
              <option value="RENTED">Đang thuê</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="premium-input rounded-xl resize-none"
            />
          </div>

          {/* Hình ảnh căn hộ */}
          <div className="col-span-12 space-y-4 pt-2 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-800">Hình ảnh căn hộ</label>

            {/* Ảnh bìa */}
            <div className="space-y-1.5">
              <span className="text-xs text-gray-500 font-medium">Ảnh bìa (Thumbnail)</span>
              {localThumbnail ? (
                <div className="relative border border-gray-200 rounded-xl overflow-hidden h-40 w-full max-w-md bg-gray-50 flex items-center justify-center">
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
                <label className="border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/10 rounded-xl h-40 w-full max-w-md flex flex-col items-center justify-center cursor-pointer transition-colors">
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
                        <div className="relative border border-gray-200 rounded-xl overflow-hidden h-20 w-full bg-gray-50 flex items-center justify-center">
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
                        <label className="border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/10 rounded-xl h-20 w-full flex items-center justify-center cursor-pointer transition-colors text-center px-1">
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
