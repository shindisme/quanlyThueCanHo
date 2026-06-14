import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Home } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { toast } from "sonner";

import * as apartmentService from "../../services/apartments.service";
import * as buildingService from "../../services/buildings.service";
import type { ApartmentData } from "../../services/apartments.service";
import type { BuildingData } from "../../services/buildings.service";

// ============================================================
// TRANG DANH SÁCH CĂN HỘ - Kết nối API thật
// ============================================================

export default function ApartmentList() {
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ApartmentData | null>(null);
  const [deleteItem, setDeleteItem] = useState<ApartmentData | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    apartment_code: "", building_id: 0, title: "",
    description: "", area: 0, rental_price: 0, status: "AVAILABLE",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      // Gọi 2 API song song bằng Promise.all
      const [aptData, bldData] = await Promise.all([
        apartmentService.getAllApartments(),
        buildingService.getAllBuildings(),
      ]);
      setApartments(aptData);
      setBuildings(bldData);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  // Lọc
  const filtered = apartments.filter((a) => {
    if (!a) return false;
    const searchString = (search || "").toLowerCase();
    const matchSearch =
      String(a.apartment_code || "").toLowerCase().includes(searchString) ||
      String(a.title || "").toLowerCase().includes(searchString);
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Tìm tên tòa nhà
  function getBuildingName(buildingId: number) {
    return buildings.find((b) => b.id === buildingId)?.name || "-";
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

  function openAddForm() {
    setEditItem(null);
    setFormData({
      apartment_code: "", building_id: buildings[0]?.id || 0, title: "",
      description: "", area: 0, rental_price: 0, status: "AVAILABLE",
    });
    setShowForm(true);
  }

  function openEditForm(apt: ApartmentData) {
    setEditItem(apt);
    setFormData({
      apartment_code: apt.apartment_code, building_id: apt.building_id,
      title: apt.title, description: apt.description || "",
      area: apt.area, rental_price: apt.rental_price, status: apt.status,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.apartment_code || !formData.title) {
      toast.error("Vui lòng nhập mã căn hộ và tiêu đề");
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await apartmentService.updateApartment(editItem.id, formData);
        toast.success("Đã cập nhật căn hộ");
      } else {
        await apartmentService.createApartment(formData);
        toast.success("Đã thêm căn hộ mới");
      }
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await apartmentService.deleteApartment(deleteItem.id);
      toast.success("Đã xóa căn hộ");
      setDeleteItem(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xóa thất bại");
    }
  }

  // Format tiền
  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
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
        icon={Home}
        title="Căn hộ"
        subtitle="Quản lý danh sách căn hộ"
        count={apartments.length}
        iconColor="linear-gradient(135deg, #3B82F6, #60A5FA)"
        actions={
          <Button onClick={openAddForm}><Plus size={18} /> Thêm căn hộ</Button>
        }
      />

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã, tiêu đề..." className="max-w-md" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn trống</option>
          <option value="RENTED">Đang thuê</option>
          <option value="MAINTENANCE">Bảo trì</option>
        </select>
      </div>

      {/* Table */}
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tiêu đề</th>
                <th>Tòa nhà</th>
                <th>Diện tích</th>
                <th>Giá thuê</th>
                <th>Trạng thái</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt.id}>
                  <td className="font-semibold text-primary-600">{apt.apartment_code}</td>
                  <td className="text-gray-800">{apt.title}</td>
                  <td className="text-gray-600">{getBuildingName(apt.building_id)}</td>
                  <td className="text-gray-600">{apt.area} m²</td>
                  <td className="font-semibold text-gray-850">{formatPrice(apt.rental_price)}</td>
                  <td>{getStatusBadge(apt.status)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditForm(apt)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Sửa">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => { setDeleteItem(apt); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <Home size={48} className="mx-auto mb-3 text-gray-300" />
                    Không tìm thấy căn hộ nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm/sửa */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? "Chỉnh sửa căn hộ" : "Thêm căn hộ mới"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Hủy</Button>
            <Button onClick={handleSave} isLoading={saving}>{editItem ? "Cập nhật" : "Thêm mới"}</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã căn hộ *</label>
              <input type="text" value={formData.apartment_code}
                onChange={(e) => setFormData({ ...formData, apartment_code: e.target.value })}
                placeholder="VD: A-101"
                className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tòa nhà *</label>
              <select value={formData.building_id}
                onChange={(e) => setFormData({ ...formData, building_id: Number(e.target.value) })}
                className="premium-select w-full rounded-xl">
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề *</label>
              <input type="text" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="premium-input rounded-xl" />
            </div>

            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Diện tích (m²)</label>
              <input type="number" value={formData.area || ""}
                onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá thuê (VNĐ)</label>
              <input type="number" value={formData.rental_price || ""}
                onChange={(e) => setFormData({ ...formData, rental_price: Number(e.target.value) })}
                className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
              <select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="premium-select w-full rounded-xl">
                <option value="AVAILABLE">Còn trống</option>
                <option value="RENTED">Đang thuê</option>
                <option value="MAINTENANCE">Bảo trì</option>
              </select>
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
              <textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="premium-input rounded-xl resize-none" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete} title="Xóa căn hộ"
        message={`Xóa căn hộ "${deleteItem?.apartment_code}"?`} confirmText="Xóa" />
    </div>
  );
}
