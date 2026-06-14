import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Home, BedDouble, Bath } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Pagination from "../../components/ui/Pagination";
import { toast } from "sonner";

import * as apartmentService from "../../services/apartments.service";
import * as buildingService from "../../services/buildings.service";
import type { ApartmentData } from "../../services/apartments.service";
import type { BuildingData } from "../../services/buildings.service";
import { useAuthStore } from "../../stores/auth.store";
import { mockUsers } from "../../data/users";

export default function ApartmentList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>(
    role === "MANAGER" ? managerBuildingId : undefined
  );
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ApartmentData | null>(null);
  const [deleteItem, setDeleteItem] = useState<ApartmentData | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const [formData, setFormData] = useState({
    room_number: "", building_id: role === "MANAGER" && managerBuildingId ? managerBuildingId : 0, floor: 1,
    area: 0, bedrooms: 1, bathrooms: 1,
    rental_price: 0, description: "", status: "AVAILABLE",
  });

  // Lấy danh sách tòa nhà (cho filter & form)
  useEffect(() => {
    buildingService.getAllBuildings().then((result) => {
      setBuildings(result.data);
    }).catch(() => { });
  }, []);

  // Lấy danh sách căn hộ (server-side pagination)
  useEffect(() => {
    fetchApartments();
  }, [currentPage, filterBuilding, search]);

  async function fetchApartments() {
    try {
      setLoading(true);
      const result = await apartmentService.getAllApartments({
        page: currentPage,
        limit: pageSize,
        building_id: filterBuilding,
        search: search || undefined,
      });
      setApartments(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.total);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  // Client-side status filter (vì backend chưa hỗ trợ filter status)
  const filtered = filterStatus
    ? apartments.filter((a) => a.status === filterStatus)
    : apartments;



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
      room_number: "", building_id: role === "MANAGER" && managerBuildingId ? managerBuildingId : (buildings[0]?.id || 0), floor: 1,
      area: 0, bedrooms: 1, bathrooms: 1,
      rental_price: 0, description: "", status: "AVAILABLE",
    });
    setShowForm(true);
  }

  function openEditForm(apt: ApartmentData) {
    setEditItem(apt);
    setFormData({
      room_number: apt.room_number, building_id: apt.building_id,
      floor: apt.floor, area: apt.area,
      bedrooms: apt.bedrooms, bathrooms: apt.bathrooms,
      rental_price: apt.rental_price, description: apt.description || "",
      status: apt.status,
    });
    setShowForm(true);
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
      if (editItem) {
        await apartmentService.updateApartment(editItem.id, formData);
        toast.success("Đã cập nhật căn hộ");
      } else {
        await apartmentService.createApartment(formData);
        toast.success("Đã thêm căn hộ mới");
      }
      setShowForm(false);
      fetchApartments();
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
      fetchApartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xóa thất bại");
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  }

  if (loading && apartments.length === 0) {
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
        count={totalCount}
        iconColor="linear-gradient(135deg, #3B82F6, #60A5FA)"
        actions={
          <Button onClick={openAddForm}><Plus size={18} /> Thêm căn hộ</Button>
        }
      />

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Tìm theo số phòng..." className="max-w-xs" />
        {role !== "MANAGER" ? (
          <select
            value={filterBuilding || ""}
            onChange={(e) => { setFilterBuilding(e.target.value ? Number(e.target.value) : undefined); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả chi nhánh</option>
            {buildings.map((b) => {
              const cleanedName = b.name.replace(/yuki\s*house\s*|yuki\s*/gi, "");
              return (
                <option key={b.id} value={b.id}>{b.branch_name}{cleanedName ? ` - ${cleanedName}` : ""}</option>
              );
            })}
          </select>
        ) : (
          <div className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-gray-50 text-gray-500 font-medium">
            Chi nhánh: {(() => {
              const b = buildings.find(b => b.id === filterBuilding);
              if (!b) return "Đang tải...";
              const cleanedName = b.name.replace(/yuki\s*house\s*|yuki\s*/gi, "");
              return `${b.branch_name}${cleanedName ? ` - ${cleanedName}` : ""}`;
            })()}
          </div>
        )}
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
                <th>Phòng</th>
                <th>Tầng</th>
                <th>Diện tích</th>
                <th>
                  <div className="flex items-center gap-1">
                    <BedDouble size={14} /> PN
                  </div>
                </th>
                <th>
                  <div className="flex items-center gap-1">
                    <Bath size={14} /> PT
                  </div>
                </th>
                <th>Giá thuê</th>
                <th>Trạng thái</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => (
                <tr key={apt.id}>
                  <td className="font-semibold text-primary-600">{apt.room_number}</td>
                  <td className="text-gray-600">{apt.floor}</td>
                  <td className="text-gray-600">{apt.area} m²</td>
                  <td className="text-gray-600">{apt.bedrooms}</td>
                  <td className="text-gray-600">{apt.bathrooms}</td>
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
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <Home size={48} className="mx-auto mb-3 text-gray-300" />
                    Không tìm thấy căn hộ nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Server-side Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số phòng *</label>
              <input type="text" value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="VD: 01, 02, 10..."
                className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh *</label>
              <select value={formData.building_id}
                onChange={(e) => setFormData({ ...formData, building_id: Number(e.target.value) })}
                disabled={role === "MANAGER"}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500">
                <option value={0}>Chọn chi nhánh</option>
                {buildings.map((b) => {
                  const cleanedName = b.name.replace(/yuki\s*house\s*|yuki\s*/gi, "");
                  return (
                    <option key={b.id} value={b.id}>{b.branch_name}{cleanedName ? ` - ${cleanedName}` : ""}</option>
                  );
                })}
              </select>
            </div>

            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tầng *</label>
              <input type="number" value={formData.floor || ""}
                onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                min={1}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng ngủ</label>
              <input type="number" value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                min={0}
                className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phòng tắm</label>
              <input type="number" value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                min={0}
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
        message={`Xóa căn hộ phòng "${deleteItem?.room_number}" tầng ${deleteItem?.floor}?`} confirmText="Xóa" />
    </div>
  );
}
