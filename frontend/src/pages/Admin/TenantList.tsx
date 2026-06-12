import { useState } from "react";
import { Plus } from "lucide-react";
import Card from "../../components/common/ui/Card";
import Button from "../../components/common/ui/Button";
import SearchInput from "../../components/common/ui/SearchInput";
import Badge from "../../components/common/ui/Badge";
import DataTable, { type Column } from "../../components/common/ui/DataTable";
import Pagination from "../../components/common/ui/Pagination";
import Modal from "../../components/common/ui/Modal";
import ConfirmDialog from "../../components/common/ui/ConfirmDialog";
import { mockTenants } from "../../data/tenants";
import { mockUsers } from "../../data/users";
import type { Tenant } from "../../types";
import { toast } from "sonner";

// Trang danh sach nguoi thue
export default function TenantList() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Tenant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Tenant | null>(null);
  const pageSize = 10;

  // Loc theo tu khoa
  const filtered = mockTenants.filter(
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nguoi thue</h1>
          <p className="text-sm text-gray-500">Quan ly thong tin nguoi thue</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
          <Plus size={18} />
          Them nguoi thue
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setCurrentPage(1); }}
        placeholder="Tim theo ho ten hoac CCCD..."
        className="max-w-md"
      />

      <Card padding={false}>
        <DataTable columns={columns} data={paginated} />
      </Card>

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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ho ten *</label>
            <input type="text" defaultValue={editItem?.full_name || ""} placeholder="Nguyen Van A" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CCCD *</label>
              <input type="text" defaultValue={editItem?.citizen_id || ""} placeholder="079200001234" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngay sinh</label>
              <input type="date" defaultValue={editItem?.date_of_birth || ""} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dia chi</label>
            <input type="text" defaultValue={editItem?.address || ""} placeholder="Dia chi thuong tru" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
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
