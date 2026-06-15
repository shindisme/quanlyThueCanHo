import { useState } from "react";
import { Plus, Users } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { mockTenants } from "../../../data/tenants";
import { mockUsers } from "../../../data/users";
import { mockApartments } from "../../../data/apartments";
import { mockContracts } from "../../../data/contracts";
import { useAuthStore } from "../../../stores/auth.store";
import type { Tenant } from "../../../types";
import { toast } from "sonner";
import { removeVietnameseTones } from "../../../utils/format";

// Trang danh sach nguoi thue
export default function TenantList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null);
  const pageSize = 10;

  // Lọc tenants theo building của manager trước khi tìm kiếm
  const displayTenants = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      const managerTenantIds = mockContracts
        .filter((c) => managerApartmentIds.includes(c.apartment_id))
        .map((c) => c.tenant_id);
      return mockTenants.filter((t) => managerTenantIds.includes(t.id));
    }
    return mockTenants;
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

  // Lay email cua user lien ket voi tenant
  function getUserEmail(userId: number | null): string {
    if (!userId) return "-";
    return mockUsers.find((u) => u.id === userId)?.email || "-";
  }

  function getUserPhone(userId: number | null): string {
    if (!userId) return "-";
    return mockUsers.find((u) => u.id === userId)?.phone || "-";
  }

  const columns: Column<Tenant>[] = [
    { key: "name", label: "Họ tên", sortValue: (t) => t.full_name, render: (t) => <span className="font-medium">{t.full_name}</span> },
    { key: "email", label: "Email", sortValue: (t) => getUserEmail(t.user_id), render: (t) => getUserEmail(t.user_id) },
    { key: "phone", label: "Số điện thoại", sortValue: (t) => getUserPhone(t.user_id), render: (t) => getUserPhone(t.user_id) },
    { key: "citizen_id", label: "CCCD", sortValue: (t) => t.citizen_id, render: (t) => t.citizen_id },
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
          <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
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

      {/* Modal thêm/sửa người thuê */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? "Chỉnh sửa người thuê" : "Thêm người thuê mới"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Hủy</Button>
            <Button onClick={() => { toast.success(editItem ? "Đã cập nhật" : "Đã thêm người thuê mới"); setShowForm(false); setEditItem(null); }}>
              {editItem ? "Cập nhật" : "Thêm mới"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <Input label="Họ tên *" defaultValue={editItem?.full_name || ""} placeholder="Nguyễn Văn A" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Input label="CCCD *" defaultValue={editItem?.citizen_id || ""} placeholder="079200001234" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Input label="Ngày sinh" type="date" defaultValue={editItem?.date_of_birth || ""} />
            </div>
            <div className="col-span-12">
              <Input label="Địa chỉ" defaultValue={editItem?.address || ""} placeholder="Địa chỉ thường trú" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => { toast.success("Đã xóa người thuê"); setDeleteItem(null); }}
        title="Xóa người thuê"
        message={`Bạn có chắc chắn muốn xóa người thuê "${deleteItem?.full_name}" không?`}
      />
    </div>
  );
}
