import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import * as buildingService from "../../../../services/buildingService";
import * as authService from "../../../../services/authService";
import type { UserData } from "../../../../services/authService";
import type { BuildingData } from "../../../../services/buildingService";
import { toast } from "sonner";

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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [managers, setManagers] = useState<UserData[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    address_old: "",
    address_new: "",
    total_floors: 0,
    description: "",
    branch_name: "",
    thumbnail_url: "",
    manager_id: null as number | null,
  });

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editItem && isOpen) {
      setFormData({
        name: editItem.name,
        address_old: editItem.address_old || "",
        address_new: editItem.address_new || "",
        total_floors: editItem.total_floors,
        description: editItem.description || "",
        branch_name: editItem.branch_name || "",
        thumbnail_url: editItem.thumbnail_url || "",
        manager_id: editItem.manager_id || null,
      });
    }
  }, [editItem, isOpen]);

  async function fetchManagers() {
    try {
      const users = await authService.getAllUsers();
      setManagers(users.filter((u) => u.role === "MANAGER"));
    } catch {
      toast.error("Không thể tải danh sách người quản lý");
    }
  }

  const availableManagers = managers.filter((m) => {
    if (!m.managed_buildings || m.managed_buildings.length === 0) return true;
    if (editItem && m.managed_buildings.some((b) => b.id === editItem.id)) return true;
    return false;
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { uploadImage } = await import("../../../../utils/upload");
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, thumbnail_url: url }));
      toast.success("Tải ảnh lên thành công");
    } catch {
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!editItem) return;
    if (!formData.name || !formData.address_old || !formData.address_new || !formData.branch_name) {
      toast.error("Vui lòng nhập tên chi nhánh/tòa nhà, địa chỉ cũ và địa chỉ mới");
      return;
    }
    setSaving(true);
    try {
      await buildingService.updateBuilding(editItem.id, formData);
      toast.success("Đã cập nhật tòa nhà");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên chi nhánh/tòa nhà *</label>
            <input
              type="text"
              value={formData.branch_name}
              onChange={(e) => setFormData({ ...formData, branch_name: e.target.value, name: e.target.value })}
              placeholder="VD: Chi nhánh Quận 1"
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ cũ *</label>
            <input
              type="text"
              value={formData.address_old}
              onChange={(e) => setFormData({ ...formData, address_old: e.target.value })}
              placeholder="VD: 123 Nguyễn Huệ, Quận 1"
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ mới *</label>
            <input
              type="text"
              value={formData.address_new}
              onChange={(e) => setFormData({ ...formData, address_new: e.target.value })}
              placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1"
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số tầng *</label>
            <input
              type="number"
              value={formData.total_floors || ""}
              onChange={(e) => setFormData({ ...formData, total_floors: Number(e.target.value) })}
              className="premium-input rounded-xl"
            />
          </div>
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quản lý bởi</label>
            <select
              value={formData.manager_id || ""}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value ? Number(e.target.value) : null })}
              className="premium-select w-full rounded-xl"
            >
              <option value="">-- Chưa phân công --</option>
              {availableManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh bìa tòa nhà</label>
            <div className="flex items-center gap-4">
              {formData.thumbnail_url ? (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={formData.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thumbnail_url: "" })}
                    className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full text-[10px] shadow w-4 h-4 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/10 transition-colors shrink-0">
                  {uploading ? (
                    <Loader2 className="animate-spin text-primary-600" size={20} />
                  ) : (
                    <>
                      <Plus className="text-gray-400" size={20} />
                      <span className="text-[10px] text-gray-400 mt-1">Chọn ảnh</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              <div className="text-xs text-gray-400">
                <p>Hỗ trợ JPG, PNG, WEBP.</p>
                <p>Tải ảnh lên ImageKit để lấy URL lưu trữ.</p>
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
              className="premium-input rounded-xl resize-none"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
