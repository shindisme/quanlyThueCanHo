import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Grid3X3, List, Filter } from "lucide-react";
import Card from "../../components/common/ui/Card";
import Button from "../../components/common/ui/Button";
import SearchInput from "../../components/common/ui/SearchInput";
import Badge from "../../components/common/ui/Badge";
import DataTable, { type Column } from "../../components/common/ui/DataTable";
import Pagination from "../../components/common/ui/Pagination";
import Modal from "../../components/common/ui/Modal";
import ConfirmDialog from "../../components/common/ui/ConfirmDialog";
import { mockApartments } from "../../data/apartments";
import { mockBuildings } from "../../data/buildings";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency } from "../../utils/format";
import type { Apartment } from "../../types";
import type { ApartmentStatus } from "../../constants/enums";
import { toast } from "sonner";

// Trang danh sach can ho - ho tro xem dang bang va dang luoi
export default function ApartmentList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Apartment | null>(null);
  const pageSize = 8;

  // Loc du lieu
  const filtered = mockApartments.filter((a) => {
    const matchSearch =
      a.apartment_code.toLowerCase().includes(search.toLowerCase()) ||
      a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchBuilding = !buildingFilter || a.building_id === Number(buildingFilter);
    return matchSearch && matchStatus && matchBuilding;
  });

  // Phan trang
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Lay ten toa nha theo building_id
  function getBuildingName(buildingId: number): string {
    return mockBuildings.find((b) => b.id === buildingId)?.name || "";
  }

  // Cot cho bang (xem dang list)
  const columns: Column<Apartment>[] = [
    { key: "code", label: "Ma can ho", render: (a) => <span className="font-medium">{a.apartment_code}</span> },
    { key: "title", label: "Ten", render: (a) => a.title },
    { key: "building", label: "Toa nha", render: (a) => getBuildingName(a.building_id) },
    { key: "area", label: "Dien tich", render: (a) => `${a.area} m2` },
    { key: "price", label: "Gia thue", render: (a) => formatCurrency(a.rental_price) },
    {
      key: "status",
      label: "Trang thai",
      render: (a) => (
        <Badge variant={APARTMENT_STATUS_COLORS[a.status] as "success" | "info" | "warning"}>
          {APARTMENT_STATUS_LABELS[a.status]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tieu de */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Can ho</h1>
          <p className="text-sm text-gray-500">Quan ly danh sach can ho</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Them can ho
        </Button>
      </div>

      {/* Bo loc va tim kiem */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tim theo ma hoac ten..."
          className="flex-1 max-w-sm"
        />

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <option value="">Tat ca trang thai</option>
          <option value="AVAILABLE">Con trong</option>
          <option value="RENTED">Dang thue</option>
          <option value="MAINTENANCE">Bao tri</option>
        </select>

        <select
          value={buildingFilter}
          onChange={(e) => { setBuildingFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <option value="">Tat ca toa nha</option>
          {mockBuildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Chuyen doi grid/list */}
        <div className="flex border border-gray-300 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 cursor-pointer ${viewMode === "grid" ? "bg-primary-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 cursor-pointer ${viewMode === "list" ? "bg-primary-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Hien thi dang Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((apt) => (
            <Card
              key={apt.id}
              className="hover:shadow-card-hover transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/apartments/${apt.id}`)}
            >
              {/* Anh can ho */}
              <div className="w-full h-36 bg-gray-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                <div className="text-gray-300 text-xs">Hinh anh</div>
              </div>

              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{apt.apartment_code}</p>
                  <p className="text-xs text-gray-400">{getBuildingName(apt.building_id)}</p>
                </div>
                <Badge variant={APARTMENT_STATUS_COLORS[apt.status] as "success" | "info" | "warning"}>
                  {APARTMENT_STATUS_LABELS[apt.status]}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-1">{apt.title}</p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{apt.area} m2</span>
                <span className="font-semibold text-primary-600">{formatCurrency(apt.rental_price)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Hien thi dang Table */
        <Card padding={false}>
          <DataTable
            columns={columns}
            data={paginated}
            onRowClick={(apt) => navigate(`/admin/apartments/${apt.id}`)}
          />
        </Card>
      )}

      {/* Phan trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal them can ho */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Them can ho moi"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Huy</Button>
            <Button onClick={() => { toast.success("Da them can ho moi"); setShowForm(false); }}>
              Them moi
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ma can ho *</label>
              <input type="text" placeholder="Vi du: A-101" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Toa nha *</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500">
                <option value="">Chon toa nha</option>
                {mockBuildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ten can ho *</label>
            <input type="text" placeholder="Vi du: Can ho 2 phong ngu" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Dien tich (m2) *</label>
              <input type="number" placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gia thue (VND/thang) *</label>
              <input type="number" placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mo ta</label>
            <textarea placeholder="Mo ta can ho..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none" />
          </div>
        </div>
      </Modal>

      {/* Dialog xac nhan xoa */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => { toast.success("Da xoa can ho"); setDeleteItem(null); }}
        title="Xoa can ho"
        message={`Ban co chac muon xoa can ho "${deleteItem?.apartment_code}"?`}
      />
    </div>
  );
}
