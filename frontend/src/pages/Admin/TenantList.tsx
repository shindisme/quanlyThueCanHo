import { useState } from "react";
import { Plus, Users } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import SearchInput from "../../components/ui/SearchInput";
import Badge from "../../components/ui/Badge";
import DataTable, { type Column } from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { mockTenants } from "../../data/tenants";
import { mockUsers } from "../../data/users";
import { mockApartments } from "../../data/apartments";
import { mockContracts } from "../../data/contracts";
import { useAuthStore } from "../../stores/auth.store";
import type { Tenant } from "../../types";
import { toast } from "sonner";

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

  // Loc theo tu khoa
  const filtered = displayTenants.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      t.citizen_id.includes(search)
  );

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
    { key: "name", label: "Ho ten", render: (t) => <span className="font-medium">{t.full_name}</span> },
    { key: "email", label: "Email", render: (t) => getUserEmail(t.user_id) },
    { key: "phone", label: "So dien thoai", render: (t) => getUserPhone(t.user_id) },
    { key: "citizen_id", label: "CCCD", render: (t) => t.citizen_id },
    {
      key: "verified",
      label: "Xac thuc",
      render: (t) => (
        <Badge variant={t.is_verified ? "success" : "warning"}>
          {t.is_verified ? "Da xac thuc" : "Chua xac thuc"}
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
        placeholder="Tim theo ho ten hoac CCCD..."
        className="max-w-md"
      />

      <DataTable columns={columns} data={paginated} />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Modal them/sua nguoi thue */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? "Chinh sua nguoi thue" : "Them nguoi thue moi"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditItem(null); }}>Huy</Button>
            <Button onClick={() => { toast.success(editItem ? "Da cap nhat" : "Da them nguoi thue moi"); setShowForm(false); setEditItem(null); }}>
              {editItem ? "Cap nhat" : "Them moi"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <Input label="Ho ten *" defaultValue={editItem?.full_name || ""} placeholder="Nguyen Van A" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Input label="CCCD *" defaultValue={editItem?.citizen_id || ""} placeholder="079200001234" />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Input label="Ngay sinh" type="date" defaultValue={editItem?.date_of_birth || ""} />
            </div>
            <div className="col-span-12">
              <Input label="Dia chi" defaultValue={editItem?.address || ""} placeholder="Dia chi thuong tru" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={() => { toast.success("Da xoa nguoi thue"); setDeleteItem(null); }}
        title="Xoa nguoi thue"
        message={`Ban co chac muon xoa nguoi thue "${deleteItem?.full_name}"?`}
      />
    </div>
  );
}
