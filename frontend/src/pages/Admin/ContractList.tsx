import { useState } from "react";
import { Plus } from "lucide-react";
import Card from "../../components/common/ui/Card";
import Button from "../../components/common/ui/Button";
import SearchInput from "../../components/common/ui/SearchInput";
import Badge from "../../components/common/ui/Badge";
import DataTable, { type Column } from "../../components/common/ui/DataTable";
import Pagination from "../../components/common/ui/Pagination";
import Modal from "../../components/common/ui/Modal";
import { mockContracts } from "../../data/contracts";
import { mockTenants } from "../../data/tenants";
import { mockApartments } from "../../data/apartments";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatDate } from "../../utils/format";
import type { RentalContract } from "../../types";
import type { ContractStatus } from "../../constants/enums";
import { toast } from "sonner";

// Trang danh sach hop dong thue
export default function ContractList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;

  const filtered = mockContracts.filter((c) => {
    const tenant = mockTenants.find((t) => t.id === c.tenant_id);
    const apt = mockApartments.find((a) => a.id === c.apartment_id);
    const matchSearch =
      tenant?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      apt?.apartment_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<RentalContract>[] = [
    { key: "id", label: "Ma HD", render: (c) => <span className="font-medium">HD-{String(c.id).padStart(3, "0")}</span> },
    { key: "tenant", label: "Nguoi thue", render: (c) => mockTenants.find((t) => t.id === c.tenant_id)?.full_name || "-" },
    { key: "apartment", label: "Can ho", render: (c) => mockApartments.find((a) => a.id === c.apartment_id)?.apartment_code || "-" },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hop dong</h1>
          <p className="text-sm text-gray-500">Quan ly hop dong thue can ho</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Tao hop dong
        </Button>
      </div>

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

      <Card padding={false}>
        <DataTable columns={columns} data={paginated} />
      </Card>

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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nguoi thue *</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500">
                <option value="">Chon nguoi thue</option>
                {mockTenants.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Can ho *</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500">
                <option value="">Chon can ho</option>
                {mockApartments.filter((a) => a.status === "AVAILABLE").map((a) => <option key={a.id} value={a.id}>{a.apartment_code} - {a.title}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngay bat dau *</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngay ket thuc *</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tien thue/thang (VND) *</label>
              <input type="number" placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tien coc (VND) *</label>
              <input type="number" placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File hop dong (PDF)</label>
            <input type="file" accept=".pdf" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
