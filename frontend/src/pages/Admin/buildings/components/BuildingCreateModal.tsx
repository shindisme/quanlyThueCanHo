import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import * as buildingService from "../../../../services/buildingService";
import { toast } from "sonner";

interface BuildingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuildingCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: BuildingCreateModalProps) {
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    address_old: "",
    address_new: "",
    total_floors: 0,
    description: "",
    branch_name: "",
    thumbnail_url: "",
    staff_id: null as number | null,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        address_old: "",
        address_new: "",
        total_floors: 0,
        description: "",
        branch_name: "",
        thumbnail_url: "",
        staff_id: null,
      });
      setThumbnailFile(null);
      setPreviewUrl("");
      fetchManagers();
    }
  }, [isOpen]);

  async function fetchManagers() {
    try {
      const { getAllStaff } = await import("../../../../services/staffService");
      const staffRes = await getAllStaff();
      setStaffList(staffRes.data);
    } catch {
      toast.error("Không thể tải danh sách người quản lý");
    }
  }

  const availableManagers = staffList.filter((m) => {
    const isManager = m.position === "Quản lý" || m.user?.role === "MANAGER";
    if (!isManager) return false;
    if (m.user?.role === "ADMIN") return false;
    if (!m.building_id) return true;
    return false;
  });

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success("Đã chọn ảnh");
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.address_old || !formData.address_new || !formData.branch_name) {
      toast.error("Vui lòng nhập tên chi nhánh/tòa nhà, địa chỉ cũ và địa chỉ mới");
      return;
    }
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("branch_name", formData.branch_name);
      formDataToSend.append("address_old", formData.address_old);
      formDataToSend.append("address_new", formData.address_new);
      formDataToSend.append("total_floors", String(formData.total_floors));
      formDataToSend.append("description", formData.description || "");
      if (formData.staff_id) {
        formDataToSend.append("staff_id", String(formData.staff_id));
      }
      if (thumbnailFile) {
        formDataToSend.append("image", thumbnailFile);
      }

      await buildingService.createBuilding(formDataToSend);
      toast.success("Đã thêm tòa nhà mới");
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
      title="Thêm tòa nhà mới"
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
              value={formData.staff_id || ""}
              onChange={(e) => setFormData({ ...formData, staff_id: e.target.value ? Number(e.target.value) : null })}
              className="premium-select w-full rounded-xl"
            >
              <option value="">-- Chưa phân công --</option>
              {availableManagers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.user?.username || s.position})
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh bìa tòa nhà</label>
            <div className="flex items-center gap-4">
              {previewUrl ? (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => { setThumbnailFile(null); setPreviewUrl(""); }}
                    className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full text-[10px] shadow w-4 h-4 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/10 transition-colors shrink-0">
                  <Plus className="text-gray-400" size={20} />
                  <span className="text-[10px] text-gray-400 mt-1">Chọn ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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
