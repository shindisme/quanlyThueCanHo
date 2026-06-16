import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Layers, Building2, Home, Pencil, Loader2, BedDouble, Bath, Plus, User } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import { toast } from "sonner";

import * as buildingService from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import type { BuildingData } from "../../../services/buildingService";
import type { ApartmentData } from "../../../services/apartmentService";
import * as authService from "../../../services/authService";
import type { UserData } from "../../../services/authService";

export default function BuildingDetail() {
  const { id } = useParams();
  const [building, setBuilding] = useState<BuildingData | null>(null);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Edit building modal
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    name: "",
    address_old: "",
    address_new: "",
    total_floors: 0,
    description: "",
    branch_name: "",
    thumbnail_url: "",
    manager_id: null,
  });
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
    if (building && m.managed_buildings.some(b => b.id === building.id)) return true;
    return false;
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

  function openEditForm() {
    if (!building) return;
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
  }

  async function handleSave() {
    if (!formData.name || !formData.address_old || !formData.address_new || !formData.branch_name) {
      toast.error("Vui lòng nhập tên chi nhánh/tòa nhà, địa chỉ cũ và địa chỉ mới");
      return;
    }
    setSaving(true);
    try {
      await buildingService.updateBuilding(Number(id), formData);
      toast.success("Đã cập nhật tòa nhà");
      setShowForm(false);
      fetchData();
      fetchManagers(); // Refresh manager details
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      const [bData, aResult] = await Promise.all([
        buildingService.getBuildingById(Number(id)),
        apartmentService.getAllApartments({ building_id: Number(id), limit: 200 }),
      ]);
      setBuilding(bData);
      setApartments(aResult.data);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Không tìm thấy tòa nhà</p>
        <Link to="/admin/buildings" className="text-primary-600 hover:underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const rentedCount = apartments.filter((a) => a.status === "RENTED").length;
  const availableCount = apartments.filter((a) => a.status === "AVAILABLE").length;
  const occupancyRate = apartments.length > 0 ? Math.round((rentedCount / apartments.length) * 100) : 0;

  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      AVAILABLE: { label: "Còn trống", variant: "success" },
      RENTED: { label: "Đang thuê", variant: "info" },
      MAINTENANCE: { label: "Bảo trì", variant: "warning" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/buildings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Quay lại danh sách tòa nhà
      </Link>

      {/* Thông tin chính */}
      <div className="flex flex-col lg:flex-row gap-6">
        {building.thumbnail_url ? (
          <img src={building.thumbnail_url} className="w-full lg:w-80 h-56 rounded-2xl object-cover shrink-0" alt="" />
        ) : (
          <div className="w-full lg:w-80 h-56 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 size={48} className="text-gray-300" />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {building.branch_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={building.status === "ACTIVE" ? "success" : "gray"}>
                  {building.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openEditForm}>
              <Pencil size={14} /> Chỉnh sửa
            </Button>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <span>{building.address_new || building.address_old}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-gray-400 shrink-0" />
              <span>{building.total_floors} tầng</span>
            </div>
            {building.manager && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400 shrink-0" />
                <span>Quản lý bởi: <strong className="text-primary-600">{building.manager.username}</strong></span>
              </div>
            )}
          </div>

          {building.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{building.description}</p>
          )}

          {/* Thống kê */}
          <div className="grid grid-cols-12 gap-4 mt-6">
            <div className="col-span-6 md:col-span-3 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{apartments.length}</p>
              <p className="text-xs text-gray-400">Tổng căn hộ</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-success-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-success-600">{rentedCount}</p>
              <p className="text-xs text-gray-400">Đang thuê</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-warning-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-warning-600">{availableCount}</p>
              <p className="text-xs text-gray-400">Còn trống</p>
            </div>
            <div className="col-span-6 md:col-span-3 bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-600">{occupancyRate}%</p>
              <p className="text-xs text-gray-400">Lấp đầy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách căn hộ */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Danh sách căn hộ ({apartments.length})
        </h3>
        <div className="grid grid-cols-12 gap-6">
          {apartments.map((apt) => (
            <Link
              key={apt.id}
              to={`/admin/apartments/${apt.id}`}
              className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3 block"
            >
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                <div className="w-full h-28 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                  <Home size={24} className="text-gray-300" />
                </div>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-800 text-sm">
                    P.{apt.room_number} - T{apt.floor}
                  </p>
                  {getStatusBadge(apt.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>{apt.area} m²</span>
                  <span className="flex items-center gap-0.5"><BedDouble size={12} /> {apt.bedrooms}</span>
                  <span className="flex items-center gap-0.5"><Bath size={12} /> {apt.bathrooms}</span>
                </div>
                <p className="font-semibold text-primary-600 text-sm">{formatPrice(apt.rental_price)}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Modal chỉnh sửa */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Chỉnh sửa tòa nhà"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              Cập nhật
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
    </div>
  );
}
