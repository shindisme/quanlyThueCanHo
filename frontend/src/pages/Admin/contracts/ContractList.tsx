import { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";

import { mockContracts } from "../../../data/contracts";
import { mockTenants } from "../../../data/tenants";
import { mockApartments } from "../../../data/apartments";
import { mockUsers } from "../../../data/users";
import { mockBuildings } from "../../../data/buildings";
import * as buildingService from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import type { ApartmentData } from "../../../services/apartmentService";
import type { BuildingData } from "../../../services/buildingService";
import { useAuthStore } from "../../../stores/auth.store";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "../../../constants/enums";
import { formatCurrency, formatDate, formatApartmentDisplay, removeVietnameseTones } from "../../../utils/format";
import type { RentalContract, Tenant } from "../../../types";
import type { ContractStatus } from "../../../constants/enums";

import ContractCreateModal from "./components/ContractCreateModal";
import ContractDetailModal from "./components/ContractDetailModal";

// Trang danh sach hop dong thue
export default function ContractList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageSize = 10;

  // Real data loaded from API
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [apartments, setApartments] = useState<ApartmentData[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Modal PDF preview state
  const [viewContractDoc, setViewContractDoc] = useState<RentalContract | null>(null);

  // States to pass down as initial query redirects
  const [initialTenantId, setInitialTenantId] = useState<number | undefined>();
  const [initialBuildingId, setInitialBuildingId] = useState<number | undefined>();

  // Load backend API data and localStorage data
  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    // 1. Fetch buildings from backend API
    buildingService.getAllBuildings({ limit: 100 }).then((res) => {
      setBuildings(res.data);
    }).catch(() => {
      setBuildings(mockBuildings);
    });

    // 2. Fetch apartments from backend API
    apartmentService.getAllApartments({ limit: 1000 }).then((res) => {
      setApartments(res.data);
    }).catch(() => {
      setApartments(mockApartments as any);
    });

    // 3. Load tenants from localStorage
    const storedTenants = localStorage.getItem("custom-tenants");
    if (storedTenants) {
      try {
        setTenants(JSON.parse(storedTenants));
      } catch {
        setTenants(mockTenants);
      }
    } else {
      setTenants(mockTenants);
    }

    // 4. Load contracts from localStorage
    const storedContracts = localStorage.getItem("custom-contracts");
    if (storedContracts) {
      try {
        setContracts(JSON.parse(storedContracts));
      } catch {
        setContracts(mockContracts);
      }
    } else {
      setContracts(mockContracts);
    }

    // 5. Load users from localStorage
    const storedUsers = localStorage.getItem("custom-users");
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        setUsers(mockUsers);
      }
    } else {
      setUsers(mockUsers);
    }
  }

  // Handle URL redirect query parameters (Add Tenant -> Create Contract Wizard)
  useEffect(() => {
    const autoOpen = searchParams.get("auto_open") === "true";
    const tenantId = searchParams.get("new_tenant_id");
    const buildingId = searchParams.get("new_tenant_building_id");
    if (autoOpen && tenantId) {
      setInitialTenantId(Number(tenantId));
      if (buildingId) {
        setInitialBuildingId(Number(buildingId));
      }
      setShowCreateModal(true);
      // Clean query parameters to avoid double-triggers
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const displayContracts = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = apartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      return contracts.filter((c) => managerApartmentIds.includes(c.apartment_id));
    }
    return contracts;
  })();

  const filtered = displayContracts.filter((c) => {
    const tenant = tenants.find((t) => t.id === c.tenant_id);
    const apt = apartments.find((a) => a.id === c.apartment_id);
    const term = removeVietnameseTones(search);
    const tenantNameNorm = removeVietnameseTones(tenant?.full_name || "");
    const roomNorm = removeVietnameseTones(apt?.room_number || "");
    const matchSearch = tenantNameNorm.includes(term) || roomNorm.includes(term);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<RentalContract>[] = [
    { key: "id", label: "Mã HĐ", sortValue: (c) => c.id, render: (c) => <span className="font-medium">HD-{String(c.id).padStart(3, "0")}</span> },
    { key: "tenant", label: "Người thuê", sortValue: (c) => tenants.find((t) => t.id === c.tenant_id)?.full_name || "", render: (c) => tenants.find((t) => t.id === c.tenant_id)?.full_name || "-" },
    {
      key: "apartment",
      label: "Căn hộ",
      sortValue: (c) => apartments.find((a) => a.id === c.apartment_id)?.room_number || "",
      render: (c) => {
        const apt = apartments.find((a) => a.id === c.apartment_id);
        const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
        return apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : "-";
      }
    },
    { key: "start", label: "Ngày bắt đầu", sortValue: (c) => new Date(c.start_date).getTime(), render: (c) => formatDate(c.start_date) },
    { key: "end", label: "Ngày kết thúc", sortValue: (c) => new Date(c.end_date).getTime(), render: (c) => formatDate(c.end_date) },
    { key: "deposit", label: "Tiền cọc", sortValue: (c) => Number(c.deposit_amount), render: (c) => formatCurrency(c.deposit_amount) },
    { key: "rent", label: "Tiền thuê/tháng", sortValue: (c) => Number(c.monthly_rent), render: (c) => formatCurrency(c.monthly_rent) },
    {
      key: "status", label: "Trạng thái",
      sortValue: (c) => c.status,
      render: (c) => (
        <Badge variant={CONTRACT_STATUS_COLORS[c.status as ContractStatus] as "success" | "gray" | "danger"}>
          {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Chức năng",
      render: (c) => (
        <button
          type="button"
          onClick={() => setViewContractDoc(c)}
          className="p-1 px-2.5 rounded-lg text-primary-600 hover:text-primary-700 hover:bg-primary-50 border border-primary-200 cursor-pointer flex items-center gap-1 text-xs font-semibold transition-colors"
          title="Xem hợp đồng"
        >
          <FileText size={14} /> Xem HĐ
        </button>
      )
    }
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
          <Button onClick={() => {
            setInitialTenantId(undefined);
            setInitialBuildingId(undefined);
            setShowCreateModal(true);
          }}>
            <Plus size={18} /> Tạo hợp đồng
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tìm kiếm..."
          className="max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hiệu lực</option>
          <option value="ENDED">Đã kết thúc</option>
          <option value="LIQUIDATED">Đã thanh lý</option>
        </select>
      </div>

      <DataTable columns={columns} data={paginated} />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Modals */}
      <ContractCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadData}
        buildings={buildings}
        apartments={apartments}
        tenants={tenants}
        currentUser={currentUser}
        role={role}
        managerBuildingId={managerBuildingId}
        initialTenantId={initialTenantId}
        initialBuildingId={initialBuildingId}
      />

      <ContractDetailModal
        isOpen={!!viewContractDoc}
        onClose={() => setViewContractDoc(null)}
        contract={viewContractDoc}
        buildings={buildings}
        apartments={apartments}
        tenants={tenants}
        users={users}
        role={role}
      />
    </div>
  );
}
