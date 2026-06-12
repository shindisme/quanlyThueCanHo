import { useState } from "react";
import { Plus } from "lucide-react";
import Card from "../../components/common/ui/Card";
import Button from "../../components/common/ui/Button";
import SearchInput from "../../components/common/ui/SearchInput";
import Badge from "../../components/common/ui/Badge";
import DataTable, { type Column } from "../../components/common/ui/DataTable";
import Pagination from "../../components/common/ui/Pagination";
import Modal from "../../components/common/ui/Modal";
import { mockUsers } from "../../data/users";
import { USER_STATUS_LABELS } from "../../constants/enums";
import { formatDate } from "../../utils/format";
import type { User } from "../../types";
import type { UserStatus } from "../../constants/enums";
import { toast } from "sonner";

// Map role sang tieng Viet
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quan tri vien",
  MANAGER: "Quan ly",
  STAFF: "Nhan vien",
  TENANT: "Nguoi thue",
};

// Trang quan ly tai khoan nguoi dung
export default function UserList() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusColorMap: Record<string, string> = {
    ACTIVE: "success",
    INACTIVE: "gray",
    BANNED: "danger",
  };

  const columns: Column<User>[] = [
    { key: "email", label: "Email", render: (u) => <span className="font-medium">{u.email}</span> },
    { key: "phone", label: "So dien thoai", render: (u) => u.phone || "-" },
    {
      key: "role", label: "Vai tro",
      render: (u) => (
        <Badge variant="info">{ROLE_LABELS[u.role] || u.role}</Badge>
      ),
    },
    {
      key: "status", label: "Trang thai",
      render: (u) => (
        <Badge variant={statusColorMap[u.status] as "success" | "gray" | "danger"}>
          {USER_STATUS_LABELS[u.status as UserStatus]}
        </Badge>
      ),
    },
    { key: "created", label: "Ngay tao", render: (u) => formatDate(u.created_at) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tai khoan nguoi dung</h1>
          <p className="text-sm text-gray-500">Quan ly tai khoan trong he thong</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Them tai khoan
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tim theo email hoac so dien thoai..."
          className="flex-1 max-w-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <option value="">Tat ca vai tro</option>
          <option value="ADMIN">Quan tri vien</option>
          <option value="MANAGER">Quan ly</option>
          <option value="TENANT">Nguoi thue</option>
        </select>
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={paginated} />
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Them tai khoan moi"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowForm(false)}>Huy</Button>
            <Button onClick={() => { toast.success("Da them tai khoan moi"); setShowForm(false); }}>Them moi</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input type="email" placeholder="email@example.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">So dien thoai</label>
            <input type="tel" placeholder="0901234567" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mat khau *</label>
            <input type="password" placeholder="Toi thieu 6 ky tu" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai tro *</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500">
              <option value="">Chon vai tro</option>
              <option value="ADMIN">Quan tri vien</option>
              <option value="MANAGER">Quan ly</option>
              <option value="TENANT">Nguoi thue</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
