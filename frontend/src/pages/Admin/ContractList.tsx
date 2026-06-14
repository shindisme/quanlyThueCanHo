import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Badge from "../../components/ui/Badge";
import DataTable, { type Column } from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import { mockContracts } from "../../data/contracts";
import { mockTenants } from "../../data/tenants";
import { mockApartments } from "../../data/apartments";
import { mockUsers } from "../../data/users";
import { mockBuildings } from "../../data/buildings";
import { useAuthStore } from "../../stores/auth.store";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatDate } from "../../utils/format";
import type { RentalContract } from "../../types";
import type { ContractStatus } from "../../constants/enums";
import { toast } from "sonner";

// Trang danh sach hop dong thue
export default function ContractList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;

  // Form selection states
  const [selectedFormBuilding, setSelectedFormBuilding] = useState<number | undefined>(
    role === "MANAGER" ? managerBuildingId : undefined
  );
  const [selectedFormFloor, setSelectedFormFloor] = useState<number | undefined>();
  const [selectedFormApartment, setSelectedFormApartment] = useState<number | undefined>();

  const formFloors = (() => {
    if (!selectedFormBuilding) return [];
    const buildingApts = mockApartments.filter(
      (a) => a.building_id === selectedFormBuilding && a.status === "AVAILABLE"
    );
    const floors = buildingApts.map((a) => a.floor);
    return [...new Set(floors)].sort((a, b) => a - b);
  })();

  const formApartments = (() => {
    if (!selectedFormBuilding || !selectedFormFloor) return [];
    return mockApartments.filter(
      (a) => a.building_id === selectedFormBuilding && a.floor === selectedFormFloor && a.status === "AVAILABLE"
    );
  })();

  const displayContracts = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      return mockContracts.filter((c) => managerApartmentIds.includes(c.apartment_id));
    }
    return mockContracts;
  })();

  const filtered = displayContracts.filter((c) => {
    const tenant = mockTenants.find((t) => t.id === c.tenant_id);
    const apt = mockApartments.find((a) => a.id === c.apartment_id);
    const matchSearch =
      tenant?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      apt?.room_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<RentalContract>[] = [
    { key: "id", label: "Ma HD", render: (c) => <span className="font-medium">HD-{String(c.id).padStart(3, "0")}</span> },
    { key: "tenant", label: "Nguoi thue", render: (c) => mockTenants.find((t) => t.id === c.tenant_id)?.full_name || "-" },
    {
      key: "apartment",
      label: "Can ho",
      render: (c) => {
        const apt = mockApartments.find((a) => a.id === c.apartment_id);
        const bld = apt ? mockBuildings.find((b) => b.id === apt.building_id) : null;
        return apt ? `P.${apt.room_number} T${apt.floor} - ${bld?.branch_name || ""}` : "-";
      }
    },
    { key: "start", label: "Ngay bat dau", render: (c) => formatDate(c.start_date) },
    { key: "end", label: "Ngay ket thuc", render: (c) => formatDate(c.end_date) },
    { key: "deposit", label: "Tien coc", render: (c) => formatCurrency(c.deposit_amount) },
    { key: "rent", label: "Tien thue/thang", render: (c) => formatCurrency(c.monthly_rent) },
    {
      key: "status", label: "Trang thai",
      render: (c) => (
        <Badge variant={CONTRACT_STATUS_COLORS[c.status as ContractStatus] as "success" | "gray" | "danger"}>
          {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Hợp đồng"
        subtitle="Quản lý hợp đồng thuê căn hộ"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> Tạo hợp đồng
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tim theo nguoi thue hoac can ho..."
          className="flex-1 max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <option value="">Tat ca trang thai</option>
          <option value="ACTIVE">Hieu luc</option>
          <option value="ENDED">Da ket thuc</option>
          <option value="LIQUIDATED">Da thanh ly</option>
        </select>
      </div>

      <DataTable columns={columns} data={paginated} />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Modal tao hop dong */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tao hop dong moi"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Huy</Button>
            <Button onClick={() => { toast.success("Da tao hop dong moi"); setShowForm(false); }}>Tao hop dong</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nguoi thue *</label>
              <select className="premium-select w-full rounded-xl">
                <option value="">Chon nguoi thue</option>
                {mockTenants.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            
            {/* Chọn Chi nhánh */}
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi nhánh *</label>
              <select
                value={selectedFormBuilding || ""}
                onChange={(e) => {
                  setSelectedFormBuilding(e.target.value ? Number(e.target.value) : undefined);
                  setSelectedFormFloor(undefined);
                  setSelectedFormApartment(undefined);
                }}
                disabled={role === "MANAGER"}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn chi nhánh</option>
                {mockBuildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name} - {b.name.replace(/yuki\s*house\s*|yuki\s*/gi, "")}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Tầng */}
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tầng *</label>
              <select
                value={selectedFormFloor || ""}
                onChange={(e) => {
                  setSelectedFormFloor(e.target.value ? Number(e.target.value) : undefined);
                  setSelectedFormApartment(undefined);
                }}
                disabled={!selectedFormBuilding}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn tầng</option>
                {formFloors.map((floor) => (
                  <option key={floor} value={floor}>Tầng {floor}</option>
                ))}
              </select>
            </div>

            {/* Chọn Căn hộ */}
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Can ho *</label>
              <select
                value={selectedFormApartment || ""}
                onChange={(e) => setSelectedFormApartment(e.target.value ? Number(e.target.value) : undefined)}
                disabled={!selectedFormFloor}
                className="premium-select w-full rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn căn hộ</option>
                {formApartments.map((a) => (
                  <option key={a.id} value={a.id}>P.{a.room_number} ({a.area}m²)</option>
                ))}
              </select>
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngay bat dau *</label>
              <input type="date" className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngay ket thuc *</label>
              <input type="date" className="premium-input rounded-xl" />
            </div>

            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tien thue/thang (VND) *</label>
              <input type="number" placeholder="0" className="premium-input rounded-xl" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tien coc (VND) *</label>
              <input type="number" placeholder="0" className="premium-input rounded-xl" />
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">File hop dong (PDF)</label>
              <input type="file" accept=".pdf" className="premium-input rounded-xl border-dashed" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
