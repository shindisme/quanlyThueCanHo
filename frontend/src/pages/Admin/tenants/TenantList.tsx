import { useState, useEffect } from "react";
import { Plus, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import { mockApartments } from "../../../data/apartments";
import { mockContracts } from "../../../data/contracts";
import { useAuthStore } from "../../../stores/auth.store";
import type { Tenant } from "../../../types";
import { toast } from "sonner";
import { removeVietnameseTones, maskPhone, maskCCCD } from "../../../utils/format";
import * as tenantService from "../../../services/tenantService";
import * as contractService from "../../../services/contractService";
import * as apartmentService from "../../../services/apartmentService";
import * as buildingService from "../../../services/buildingService";

import TenantCreateModal from "./components/TenantCreateModal";
import TenantModifyModal from "./components/TenantModifyModal";
import TenantDeleteModal from "./components/TenantDeleteModal";
import TenantDetailModal from "./components/TenantDetailModal";

// Danh sách người thuê
export default function TenantList() {
  const { role, managedBuildingId } = useAuthStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null);
  const [viewItem, setViewItem] = useState<Tenant | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  async function loadData() {
    try {
      const res = await tenantService.getAllTenants({ page: currentPage });
      setTenants(res.data);
      if (res.data.length === 10) {
        setTotalPages(currentPage + 1);
      } else {
        setTotalPages(currentPage);
      }

      // Load contracts, apartments and buildings to associate them client-side
      const [cRes, aptRes, bRes] = await Promise.all([
        contractService.getAllContracts().catch(() => mockContracts as any),
        apartmentService.getAllApartments({ limit: 100 }).catch(() => ({ data: mockApartments })),
        buildingService.getAllBuildings({ limit: 100 }).catch(() => ({ data: [] }))
      ]);
      setContracts(cRes);
      setApartments(aptRes.data);
      setBuildings(bRes.data);
    } catch {
      toast.error("Không thể tải danh sách người thuê");
    }
  }

  // Lọc theo tòa nhà của quản lý
  const displayTenants = (() => {
    if (role === "MANAGER" && managedBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managedBuildingId)
        .map((a) => a.id);
      const managerTenantIds = contracts
        .filter((c: any) => managerApartmentIds.includes(c.apartment_id))
        .map((c: any) => c.tenant_id);
      return tenants.filter((t) => managerTenantIds.includes(t.id));
    }
    return tenants;
  })();

  // Gắn thông tin hợp đồng và căn hộ vào người thuê để hiển thị cột căn hộ
  const displayTenantsWithContracts = displayTenants.map((t) => {
    const tenantContracts = contracts.filter((c) => c.tenant_id === t.id);
    const activeContract = tenantContracts.find((c) => c.status === "ACTIVE") || tenantContracts[0];

    if (activeContract) {
      const apt = apartments.find((a) => a.id === activeContract.apartment_id);
      const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
      return {
        ...t,
        contracts: [
          {
            ...activeContract,
            apartment: apt ? {
              ...apt,
              building: bld,
            } : undefined,
          },
        ],
      };
    }
    return { ...t, contracts: [] };
  });

  // Lọc tìm kiếm
  const filtered = displayTenantsWithContracts.filter((t) => {
    const term = removeVietnameseTones(search);
    const nameNorm = removeVietnameseTones(t.full_name);
    const citizenNorm = removeVietnameseTones(t.citizen_id);
    return nameNorm.includes(term) || citizenNorm.includes(term);
  });

  const paginated = filtered;

  // Xóa
  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await tenantService.deleteTenant(deleteItem.id);
      setDeleteItem(null);
      toast.success("Đã xóa người thuê");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xóa người thuê thất bại");
    }
  }

  const columns: Column<Tenant>[] = [
    { key: "name", label: "Họ tên", sortValue: (t) => t.full_name, render: (t) => <span className="font-medium">{t.full_name}</span> },
    { key: "phone", label: "Số điện thoại", sortValue: (t) => t.phone || "", render: (t) => t.phone ? maskPhone(t.phone) : "-" },
    {
      key: "apartment",
      label: "Căn hộ",
      sortValue: (t) => {
        const activeContract = t.contracts?.[0];
        if (!activeContract || !activeContract.apartment) return "Chưa thuê";
        return `${activeContract.apartment.building?.branch_name || ""} - P.${activeContract.apartment.room_number}`;
      },
      render: (t) => {
        const activeContract = t.contracts?.[0];
        if (!activeContract || !activeContract.apartment) {
          return <span className="text-gray-400 italic text-xs">Chưa thuê</span>;
        }
        const apt = activeContract.apartment;
        const bld = apt.building;
        return (
          <div className="text-xs">
            <span className="font-semibold text-primary-600 block">{bld?.branch_name || "YuKi House"}</span>
            <span className="text-gray-500">P.{apt.floor}{apt.room_number}</span>
          </div>
        );
      }
    },
    { key: "citizen_id", label: "CCCD", sortValue: (t) => t.citizen_id, render: (t) => maskCCCD(t.citizen_id) },
    {
      key: "verified",
      label: "Xác thực",
      sortValue: (t) => t.is_verified,
      render: (t) => (
        <Badge variant={t.is_verified ? "success" : "warning"}>
          {t.is_verified ? "Đã xác thực" : "Chưa xác thực"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Chức năng",
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewItem(t)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditItem(t);
              setShowModifyModal(true);
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Chỉnh sửa"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteItem(t)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Người thuê"
        subtitle="Quản lý thông tin người thuê"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #8B5CF6, #A78BFA)"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Thêm người thuê
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setCurrentPage(1); }}
        placeholder="Tìm kiếm..."
        className="max-w-md"
      />

      <DataTable columns={columns} data={paginated} />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Modals */}
      <TenantCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newTenantId) => {
          loadData();
          if (newTenantId) {
            navigate("/admin/contracts", { state: { openCreateModal: true, tenantId: newTenantId } });
          }
        }}
      />

      <TenantModifyModal
        isOpen={showModifyModal}
        onClose={() => { setShowModifyModal(false); setEditItem(null); }}
        onSuccess={loadData}
        editItem={editItem}
      />

      <TenantDeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        tenant={deleteItem}
      />

      <TenantDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        tenant={viewItem}
      />
    </div>
  );
}
