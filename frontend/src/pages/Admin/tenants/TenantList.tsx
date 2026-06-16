import { useState, useEffect } from "react";
import { Plus, Users, Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import { mockTenants } from "../../../data/tenants";
import { mockUsers } from "../../../data/users";
import { mockApartments } from "../../../data/apartments";
import { mockContracts } from "../../../data/contracts";
import { useAuthStore } from "../../../stores/auth.store";
import type { Tenant } from "../../../types";
import { toast } from "sonner";
import { removeVietnameseTones, maskPhone, maskCCCD } from "../../../utils/format";
import * as tenantService from "../../../services/tenantService";

import TenantCreateModal from "./components/TenantCreateModal";
import TenantModifyModal from "./components/TenantModifyModal";
import TenantDeleteModal from "./components/TenantDeleteModal";
import TenantDetailModal from "./components/TenantDetailModal";

// Trang danh sach nguoi thue
export default function TenantList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null);
  const [viewItem, setViewItem] = useState<Tenant | null>(null);
  const pageSize = 10;

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await tenantService.getAllTenants();
      setTenants(res.data);
    } catch {
      toast.error("Không thể tải danh sách người thuê");
    }

    // Load custom users
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

  // Lọc tenants theo building của manager trước khi tìm kiếm
  const displayTenants = (() => {
    // Load custom contracts to check apartments manager link
    const storedContracts = localStorage.getItem("custom-contracts");
    const currentContracts = storedContracts ? JSON.parse(storedContracts) : mockContracts;

    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      const managerTenantIds = currentContracts
        .filter((c: any) => managerApartmentIds.includes(c.apartment_id))
        .map((c: any) => c.tenant_id);
      return tenants.filter((t) => managerTenantIds.includes(t.id));
    }
    return tenants;
  })();

  // Loc 
  const filtered = displayTenants.filter((t) => {
    const term = removeVietnameseTones(search);
    const nameNorm = removeVietnameseTones(t.full_name);
    const citizenNorm = removeVietnameseTones(t.citizen_id);
    return nameNorm.includes(term) || citizenNorm.includes(term);
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Xóa người thuê
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

  // Lay email cua user lien ket voi tenant
  function getUserEmail(userId: number | null): string {
    if (!userId) return "-";
    return users.find((u) => u.id === userId)?.email || "-";
  }

  function getUserPhone(userId: number | null): string {
    if (!userId) return "-";
    return users.find((u) => u.id === userId)?.phone || "-";
  }

  const columns: Column<Tenant>[] = [
    { key: "name", label: "Họ tên", sortValue: (t) => t.full_name, render: (t) => <span className="font-medium">{t.full_name}</span> },
    { key: "email", label: "Email", sortValue: (t) => getUserEmail(t.user_id), render: (t) => getUserEmail(t.user_id) },
    { key: "phone", label: "Số điện thoại", sortValue: (t) => getUserPhone(t.user_id), render: (t) => maskPhone(getUserPhone(t.user_id)) },
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
        onSuccess={loadData}
        role={role}
        managerBuildingId={managerBuildingId}
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
        phone={viewItem ? getUserPhone(viewItem.user_id) : ""}
        email={viewItem ? getUserEmail(viewItem.user_id) : ""}
      />
    </div>
  );
}
