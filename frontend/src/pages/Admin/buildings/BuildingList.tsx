import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, Layers, Home, MoreVertical, Pencil, Trash2, Loader2, Building2, User, Eye, Image } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { toast } from "sonner";

import { removeVietnameseTones } from "../../../utils/format";

import * as buildingService from "../../../services/buildingService";
import type { BuildingData } from "../../../services/buildingService";
import * as authService from "../../../services/authService";
import type { UserData } from "../../../services/authService";

export default function BuildingList() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BuildingData | null>(null);
  const [deleteItem, setDeleteItem] = useState<BuildingData | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // State cho form inputs - khớp DB schema
  const [formData, setFormData] = useState<{
    name: string;
    address_old: string;
    address_new: string;
    total_floors: number;
    description: string;
    branch_name: string;
    thumbnail_url: string;
    manager_id: number | null;
  }>({
    name: "", address_old: "", address_new: "", total_floors: 0,
    description: "", branch_name: "", thumbnail_url: "", manager_id: null
  });
  const [uploading, setUploading] = useState(false);
  const [managers, setManagers] = useState<UserData[]>([]);

  useEffect(() => {
    fetchManagers();
  }, []);

  async function fetchManagers() {
    try {
      const users = await authService.getAllUsers();
      setManagers(users.filter(u => u.role === "MANAGER"));
    } catch {
      toast.error("Không thể tải danh sách người quản lý");
    }
  }

  const availableManagers = managers.filter(m => {
    if (!m.managed_buildings || m.managed_buildings.length === 0) return true;
    if (editItem && m.managed_buildings.some(b => b.id === editItem.id)) return true;
    return false;
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  async function fetchBuildings() {
    try {
      setLoading(true);
      const result = await buildingService.getAllBuildings();
      setBuildings(result.data);
    } catch {
      toast.error("Không thể tải danh sách tòa nhà");
    } finally {
      setLoading(false);
    }
  }

  // Lọc theo từ khóa tìm kiếm (client-side)
  const filtered = buildings.filter((b) => {
    const term = removeVietnameseTones(search);
    return (
      removeVietnameseTones(b.name).includes(term) ||
      removeVietnameseTones(b.address_old || "").includes(term) ||
      removeVietnameseTones(b.address_new || "").includes(term) ||
      removeVietnameseTones(b.branch_name || "").includes(term)
    );
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { uploadImage } = await import("../../../utils/upload");
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, thumbnail_url: url }));
      toast.success("Tải ảnh lên thành công");
    } catch {
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  }

  function openAddForm() {
    setEditItem(null);
    setFormData({ name: "", address_old: "", address_new: "", total_floors: 0, description: "", branch_name: "", thumbnail_url: "", manager_id: null });
    setShowForm(true);
  }

  function openEditForm(building: BuildingData) {
    setEditItem(building);
    setFormData({
      name: building.name,
      address_old: building.address_old || "",
      address_new: building.address_new || "",
      total_floors: building.total_floors,
      description: building.description || "",
      branch_name: building.branch_name || "",
      thumbnail_url: building.thumbnail_url || "",
      manager_id: building.manager_id || null,
    });
    setShowForm(true);
    setMenuOpen(null);
  }

  async function handleSave() {
    if (!formData.name || !formData.address_old || !formData.address_new || !formData.branch_name) {
      toast.error("Vui lòng nhập tên chi nhánh/tòa nhà, địa chỉ cũ và địa chỉ mới");
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await buildingService.updateBuilding(editItem.id, formData);
        toast.success("Đã cập nhật tòa nhà");
      } else {
        await buildingService.createBuilding(formData);
        toast.success("Đã thêm tòa nhà mới");
      }
      setShowForm(false);
      setEditItem(null);
      fetchBuildings();
      fetchManagers(); // Refresh managers managed buildings status
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await buildingService.deleteBuilding(deleteItem.id);
      toast.success(`Đã xóa tòa nhà "${deleteItem.name}"`);
      setDeleteItem(null);
      fetchBuildings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xóa thất bại");
    }
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
      {/* Page Header */}
      <PageHeader
        icon={Building2}
        title="Tòa nhà"
        subtitle="Quản lý danh sách tòa nhà"
        count={buildings.length}
        actions={
          <Button onClick={openAddForm}>
            <Plus size={18} /> Thêm tòa nhà
          </Button>
        }
      />

      {/* Tìm kiếm */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Tìm kiếm..."
        className="max-w-md"
      />

      {/* Danh sách list view  */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
          <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy tòa nhà nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="premium-table-container">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Tên chi nhánh</th>
                  <th>Địa chỉ</th>
                  <th>Số tầng</th>
                  <th>Số căn hộ</th>
                  <th>Quản lý bởi</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Chức năng</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((building) => (
                  <tr key={building.id} className="hover:bg-gray-50 transition-colors">
                    <td className="font-semibold text-primary-600">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/buildings/${building.id}`)}>
                        <span>{building.branch_name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">
                      <span className="block max-w-xs truncate" title={building.address_new || building.address_old}>
                        {building.address_new || building.address_old}
                      </span>
                    </td>
                    <td className="text-gray-600 font-medium">{building.total_floors}</td>
                    <td className="text-gray-600 font-medium">{building._count?.apartments ?? building.total_apartments} </td>
                    <td className="text-gray-700">
                      {building.manager ? (
                        <div className="flex items-center gap-1.5 font-medium text-primary-600">
                          <User size={13} />
                          <span>{building.manager.username}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Không</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={building.status === "ACTIVE" ? "success" : "gray"}>
                        {building.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/admin/buildings/${building.id}`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Xem chi tiết">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => openEditForm(building)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Sửa">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteItem(building)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? "Chỉnh sửa tòa nhà" : "Thêm tòa nhà mới"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>
              Hủy
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editItem ? "Cập nhật" : "Thêm mới"}
            </Button>
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

      {/* Dialog xác nhận xóa */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xóa tòa nhà"
        message={`Bạn chắc chắn muốn xóa tòa nhà "${deleteItem?.name}"?`}
        confirmText="Xóa"
      />
    </div>
  );
}
