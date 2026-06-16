import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Home, Star, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Pagination from "../../../components/ui/Pagination";
import { toast } from "sonner";

import * as apartmentService from "../../../services/apartmentService";
import * as buildingService from "../../../services/buildingService";
import type { ApartmentData } from "../../../services/apartmentService";
import type { BuildingData } from "../../../services/buildingService";
import { useAuthStore } from "../../../stores/auth.store";
import { mockUsers } from "../../../data/users";

import { useSort } from "../../../hooks/useSort";
import { formatApartmentDisplay, removeVietnameseTones } from "../../../utils/format";

export default function ApartmentList() {
  const navigate = useNavigate();
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFeatured, setFilterFeatured] = useState("");
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>(
    role === "MANAGER" ? managerBuildingId : undefined
  );
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ApartmentData | null>(null);
  const [deleteItem, setDeleteItem] = useState<ApartmentData | null>(null);
  const [saving, setSaving] = useState(false);
  const [featuredIds, setFeaturedIds] = useState<number[]>([]);
  const [localThumbnail, setLocalThumbnail] = useState<string>("");
  const [localImages, setLocalImages] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [formData, setFormData] = useState({
    room_number: "", building_id: role === "MANAGER" && managerBuildingId ? managerBuildingId : 0, floor: 1,
    area: 0, bedrooms: 1, bathrooms: 1,
    rental_price: 0, description: "", status: "AVAILABLE",
  });

  // Lấy danh sách tòa nhà 
  useEffect(() => {
    buildingService.getAllBuildings().then((result) => {
      setBuildings(result.data);
    }).catch(() => { });

    const stored = localStorage.getItem("featured-apartment-ids");
    if (stored) {
      try {
        setFeaturedIds(JSON.parse(stored));
      } catch { /* empty */ }
    }
  }, []);

  function toggleFeatured(id: number) {
    let updated: number[];
    if (featuredIds.includes(id)) {
      updated = featuredIds.filter((fid) => fid !== id);
      toast.success("Đã bỏ nổi bật căn hộ");
    } else {
      if (featuredIds.length >= 6) {
        toast.warning("Chỉ được phép đặt tối đa 6 căn hộ nổi bật");
        return;
      }
      updated = [...featuredIds, id];
      toast.success("Đã đặt làm nổi bật trên trang chủ");
    }
    setFeaturedIds(updated);
    localStorage.setItem("featured-apartment-ids", JSON.stringify(updated));
  }

  // Lấy danh sách căn hộ 
  useEffect(() => {
    fetchApartments();
    setCurrentPage(1);
  }, [filterBuilding, filterStatus]);

  async function fetchApartments() {
    try {
      setLoading(true);
      const result = await apartmentService.getAllApartments({
        building_id: filterBuilding,
        status: filterStatus || undefined,
        limit: 1000,
      });
      setApartments(result.data);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  // Lọc dữ liệu trên 
  const filtered = apartments.filter((apt) => {
    if (search) {
      const term = removeVietnameseTones(search);
      const roomNorm = removeVietnameseTones(apt.room_number);
      const descNorm = removeVietnameseTones(apt.description || "");
      const buildingName = buildings.find((b) => b.id === apt.building_id)?.branch_name || "";
      const bNameNorm = removeVietnameseTones(buildingName);

      if (!roomNorm.includes(term) && !descNorm.includes(term) && !bNameNorm.includes(term)) {
        return false;
      }
    }

    if (filterFeatured === "featured") {
      return featuredIds.includes(apt.id);
    }
    if (filterFeatured === "non-featured") {
      return !featuredIds.includes(apt.id);
    }

    return true;
  });

  const { items: sortedApartments, requestSort, getSortIcon } = useSort(filtered);

  // Phân trang 
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedApartments = sortedApartments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalCount = filtered.length;

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
    setLocalThumbnail("");
    setLocalImages([]);
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
    const thumbnail = apt.images?.find((img) => img.is_thumbnail)?.image_url || "";
    const details = apt.images?.filter((img) => !img.is_thumbnail).map((img) => img.image_url) || [];
    setLocalThumbnail(thumbnail);
    setLocalImages(details);
    setShowForm(true);
  }

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLocalThumbnail(URL.createObjectURL(file));
    }
  }

  function handleDetailImageChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalImages(prev => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
    }
  }

  function removeThumbnail() {
    setLocalThumbnail("");
  }

  function removeDetailImage(index: number) {
    setLocalImages(prev => {
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
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Tìm kiếm..." className="max-w-md" />
        {role !== "MANAGER" && (
          <select
            value={filterBuilding || ""}
            onChange={(e) => { setFilterBuilding(e.target.value ? Number(e.target.value) : undefined); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả chi nhánh</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>
        )}
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn trống</option>
          <option value="RENTED">Đang thuê</option>
          <option value="MAINTENANCE">Bảo trì</option>
        </select>
        {role === "ADMIN" && (
          <select
            value={filterFeatured}
            onChange={(e) => { setFilterFeatured(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500"
          >
            <option value="">Tất cả nổi bật</option>
            <option value="featured">Nổi bật</option>
            <option value="non-featured">Không nổi bật</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => requestSort("room_number")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Phòng {getSortIcon("room_number")}
                </th>
                <th onClick={() => requestSort("area")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Diện tích {getSortIcon("area")}
                </th>
                <th onClick={() => requestSort("bedrooms")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  PN {getSortIcon("bedrooms")}
                </th>
                <th onClick={() => requestSort("bathrooms")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  PT {getSortIcon("bathrooms")}
                </th>
                <th onClick={() => requestSort("rental_price")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Giá thuê {getSortIcon("rental_price")}
                </th>
                <th onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Trạng thái {getSortIcon("status")}
                </th>
                {role === "ADMIN" && (
                  <th className="text-center w-24">Nổi bật</th>
                )}
                <th className="text-right">Chức năng</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApartments.map((apt) => (
                <tr key={apt.id}>
                  <td className="font-semibold text-primary-600">
                    {formatApartmentDisplay(
                      apt.room_number,
                      apt.floor,
                      role || undefined,
                      buildings.find((b) => b.id === apt.building_id)?.branch_name
                    )}
                  </td>
                  <td className="text-gray-600">{apt.area} m²</td>
                  <td className="text-gray-600">{apt.bedrooms}</td>
                  <td className="text-gray-600">{apt.bathrooms}</td>
                  <td className="font-semibold text-gray-850">{formatPrice(apt.rental_price)}</td>
                  <td>{getStatusBadge(apt.status)}</td>
                  {role === "ADMIN" && (
                    <td className="text-center">
                      <button
                        onClick={() => toggleFeatured(apt.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${featuredIds.includes(apt.id)
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-gray-300 hover:text-gray-400"
                          }`}
                        title={featuredIds.includes(apt.id) ? "Bỏ nổi bật" : "Bật nổi bật"}
                      >
                        <Star size={18} fill={featuredIds.includes(apt.id) ? "currentColor" : "none"} />
                      </button>
                    </td>
                  )}
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/${role?.toLowerCase()}/apartments/${apt.id}`)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Xem chi tiết">
                        <Eye size={16} />
                      </button>
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
              {paginatedApartments.length === 0 && (
                <tr>
                  <td colSpan={role === "ADMIN" ? 8 : 7} className="text-center py-12 text-gray-500">
                    <Home size={48} className="mx-auto mb-3 text-gray-300" />
                    Không tìm thấy căn hộ nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
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

      <ConfirmDialog isOpen={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete} title="Xóa căn hộ"
        message={`Xóa căn hộ phòng "${deleteItem?.room_number}" tầng ${deleteItem?.floor}?`} confirmText="Xóa" />
    </div>
  );
}
