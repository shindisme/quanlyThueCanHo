import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, Layers, Home, MoreVertical, Pencil, Trash2, Loader2, Building2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { toast } from "sonner";

// Import service thay vì mock data
import * as buildingService from "../../services/buildings.service";
import type { BuildingData } from "../../services/buildings.service";

// ============================================================
// TRANG DANH SÁCH TÒA NHÀ - Kết nối API thật
// ============================================================
//
// USEEFFECT + USESTATE PATTERN:
// - useState: lưu dữ liệu (buildings, loading, error)
// - useEffect: gọi API khi component mount (lần đầu hiển thị)
//   → fetchData() → set state → re-render
//
// TẠI SAO CẦN LOADING STATE?
// - Khi gọi API mất thời gian (network) → hiện spinner
// - User biết app đang tải, không phải bị treo
//
// TẠI SAO CẦN TRY-CATCH?
// - API có thể lỗi (mất mạng, server die, sai token)
// - catch bắt lỗi → hiện thông báo cho user biết
// ============================================================

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

  // State cho form inputs
  const [formData, setFormData] = useState({
    name: "", address: "", total_floors: 0, description: "", branch_name: "",
  });

  // ===== GỌI API LẤY DANH SÁCH TÒA NHÀ =====
  // useEffect chạy 1 lần khi component mount ([] = dependency rỗng)
  useEffect(() => {
    fetchBuildings();
  }, []);

  async function fetchBuildings() {
    try {
      setLoading(true);
      const data = await buildingService.getAllBuildings();
      setBuildings(data);
    } catch (error: any) {
      toast.error("Không thể tải danh sách tòa nhà");
    } finally {
      setLoading(false);
    }
  }

  // Lọc theo từ khóa tìm kiếm
  const filtered = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase()) ||
      b.branch_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Mở form thêm mới
  function openAddForm() {
    setEditItem(null);
    setFormData({ name: "", address: "", total_floors: 0, description: "", branch_name: "" });
    setShowForm(true);
  }

  // Mở form chỉnh sửa
  function openEditForm(building: BuildingData) {
    setEditItem(building);
    setFormData({
      name: building.name,
      address: building.address,
      total_floors: building.total_floors,
      description: building.description || "",
      branch_name: building.branch_name || "",
    });
    setShowForm(true);
    setMenuOpen(null);
  }

  // ===== LƯU (THÊM MỚI / CẬP NHẬT) =====
  async function handleSave() {
    if (!formData.name || !formData.address) {
      toast.error("Vui lòng nhập tên và địa chỉ");
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
      fetchBuildings(); // Tải lại danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  // ===== XÓA =====
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

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - ArchitectUI style */}
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
        placeholder="Tìm theo tên, địa chỉ, chi nhánh..."
        className="max-w-md"
      />

      {/* Danh sách card */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
          <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không tìm thấy tòa nhà nào</p>
          <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {filtered.map((building) => (
            <div
              key={building.id}
              className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer relative"
            >
              {/* Menu 3 chấm */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === building.id ? null : building.id);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpen === building.id && (
                  <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditForm(building); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Pencil size={14} /> Chỉnh sửa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItem(building);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                )}
              </div>

              {/* Nội dung */}
              <div onClick={() => navigate(`/admin/buildings/${building.id}`)}>
                <div className="flex items-start gap-3 mb-4 pr-8">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
                    <Home size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{building.name}</h3>
                    {building.branch_name && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        {building.branch_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="truncate">{building.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-gray-400" />
                    <span>{building.total_floors} tầng</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên tòa nhà *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: YuKi Tower A"
                className="premium-input rounded-xl"
              />
            </div>
            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="VD: 123 Nguyễn Huệ, Quận 1"
                className="premium-input rounded-xl"
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số tầng *</label>
              <input
                type="number"
                value={formData.total_floors || ""}
                onChange={(e) => setFormData({ ...formData, total_floors: Number(e.target.value) })}
                className="premium-input rounded-xl"
              />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh</label>
              <input
                type="text"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                placeholder="VD: Chi nhánh Quận 1"
                className="premium-input rounded-xl"
              />
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
