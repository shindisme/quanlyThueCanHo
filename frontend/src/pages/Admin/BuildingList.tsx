import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, Layers, Home, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/common/ui/Card";
import Button from "../../components/common/ui/Button";
import SearchInput from "../../components/common/ui/SearchInput";
import Badge from "../../components/common/ui/Badge";
import Modal from "../../components/common/ui/Modal";
import ConfirmDialog from "../../components/common/ui/ConfirmDialog";
import { mockBuildings } from "../../data/buildings";
import { mockApartments } from "../../data/apartments";
import type { Building } from "../../types";
import { toast } from "sonner";

// Trang danh sach toa nha - hien thi dang card
export default function BuildingList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Building | null>(null);
  const [deleteItem, setDeleteItem] = useState<Building | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  // Loc theo tu khoa tim kiem
  const filtered = mockBuildings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase()) ||
      b.branchName.toLowerCase().includes(search.toLowerCase())
  );

  // Dem so can ho theo toa nha
  function getApartmentCount(buildingId: number) {
    return mockApartments.filter((a) => a.building_id === buildingId).length;
  }

  // Dem can ho dang thue
  function getRentedCount(buildingId: number) {
    return mockApartments.filter(
      (a) => a.building_id === buildingId && a.status === "RENTED"
    ).length;
  }

  function handleDelete() {
    toast.success(`Da xoa toa nha "${deleteItem?.name}"`);
    setDeleteItem(null);
  }

  function handleSave() {
    toast.success(editItem ? "Da cap nhat toa nha" : "Da them toa nha moi");
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <div className="space-y-6">
      {/* Tieu de + Hanh dong */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Toa nha</h1>
          <p className="text-sm text-gray-500">Quan ly danh sach toa nha trong he thong</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
          <Plus size={18} />
          Them toa nha
        </Button>
      </div>

      {/* Tim kiem */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Tim theo ten, dia chi, chi nhanh..."
        className="max-w-md"
      />

      {/* Danh sach card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((building) => {
          const aptCount = getApartmentCount(building.id);
          const rentedCount = getRentedCount(building.id);
          const occupancyRate = aptCount > 0 ? Math.round((rentedCount / aptCount) * 100) : 0;

          return (
            <Card
              key={building.id}
              className="hover:shadow-card-hover transition-shadow cursor-pointer relative"
            >
              {/* Nut menu 3 cham */}
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
                  <div className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-dropdown border border-gray-200 z-10 animate-slide-in-up">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditItem(building);
                        setShowForm(true);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Pencil size={14} /> Chinh sua
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItem(building);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 cursor-pointer"
                    >
                      <Trash2 size={14} /> Xoa
                    </button>
                  </div>
                )}
              </div>

              {/* Noi dung card */}
              <div onClick={() => navigate(`/admin/buildings/${building.id}`)}>
                {/* Icon va ten */}
                <div className="flex items-start gap-3 mb-4 pr-8">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Home size={22} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{building.name}</h3>
                    <Badge variant="info">{building.branchName}</Badge>
                  </div>
                </div>

                {/* Thong tin */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="truncate">{building.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-gray-400" />
                    <span>{building.totalFloors} tang</span>
                  </div>
                </div>

                {/* Thong ke */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{aptCount}</p>
                    <p className="text-[11px] text-gray-400">Can ho</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-success-600">{rentedCount}</p>
                    <p className="text-[11px] text-gray-400">Dang thue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary-600">{occupancyRate}%</p>
                    <p className="text-[11px] text-gray-400">Lap day</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal them/sua toa nha */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? "Chinh sua toa nha" : "Them toa nha moi"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>
              Huy
            </Button>
            <Button onClick={handleSave}>
              {editItem ? "Cap nhat" : "Them moi"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ten toa nha *</label>
            <input
              type="text"
              defaultValue={editItem?.name || ""}
              placeholder="Vi du: DuKi Tower A"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dia chi *</label>
            <input
              type="text"
              defaultValue={editItem?.address || ""}
              placeholder="Vi du: 123 Nguyen Hue, Quan 1"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">So tang *</label>
              <input
                type="number"
                defaultValue={editItem?.totalFloors || ""}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhanh *</label>
              <input
                type="text"
                defaultValue={editItem?.branchName || ""}
                placeholder="Vi du: Chi nhanh Quan 1"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mo ta</label>
            <textarea
              defaultValue={editItem?.description || ""}
              placeholder="Mo ta ve toa nha..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Dialog xac nhan xoa */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xoa toa nha"
        message={`Ban co chac chan muon xoa toa nha "${deleteItem?.name}"? Hanh dong nay khong the hoan tac.`}
        confirmText="Xoa"
      />
    </div>
  );
}
