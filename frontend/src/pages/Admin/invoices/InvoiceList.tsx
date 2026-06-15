import { useState } from "react";
import { Receipt } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import Badge from "../../../components/ui/Badge";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Pagination from "../../../components/ui/Pagination";
import { mockInvoices } from "../../../data/invoices";
import { mockTenants } from "../../../data/tenants";
import { mockApartments } from "../../../data/apartments";
import { mockContracts } from "../../../data/contracts";
import { mockUsers } from "../../../data/users";
import { useAuthStore } from "../../../stores/auth.store";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "../../../constants/enums";
import { formatCurrency, formatDate, removeVietnameseTones } from "../../../utils/format";
import type { Invoice } from "../../../types";
import type { InvoiceStatus } from "../../../constants/enums";

// Trang danh sach hoa don
export default function InvoiceList() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const displayInvoices = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      const managerApartmentIds = mockApartments
        .filter((a) => a.building_id === managerBuildingId)
        .map((a) => a.id);
      const managerContractIds = mockContracts
        .filter((c) => managerApartmentIds.includes(c.apartment_id))
        .map((c) => c.id);
      return mockInvoices.filter((inv) => managerContractIds.includes(inv.contract_id));
    }
    return mockInvoices;
  })();

  const filtered = displayInvoices.filter((inv) => {
    const tenant = mockTenants.find((t) => t.id === inv.tenant_id);
    const term = removeVietnameseTones(search);
    const codeNorm = removeVietnameseTones(inv.invoice_code);
    const tenantNorm = removeVietnameseTones(tenant?.full_name || "");
    const matchSearch = codeNorm.includes(term) || tenantNorm.includes(term);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<Invoice>[] = [
    { key: "code", label: "Mã hoá đơn", sortValue: (inv) => inv.invoice_code, render: (inv) => <span className="font-medium">{inv.invoice_code}</span> },
    { key: "tenant", label: "Người thuê", sortValue: (inv) => mockTenants.find((t) => t.id === inv.tenant_id)?.full_name || "", render: (inv) => mockTenants.find((t) => t.id === inv.tenant_id)?.full_name || "-" },
    { key: "total", label: "Tổng tiền", sortValue: (inv) => Number(inv.total_amount), render: (inv) => <span className="font-semibold">{formatCurrency(inv.total_amount)}</span> },
    { key: "due", label: "Hạn thanh toán", sortValue: (inv) => new Date(inv.due_date).getTime(), render: (inv) => formatDate(inv.due_date) },
    {
      key: "status", label: "Trạng thái",
      sortValue: (inv) => inv.status,
      render: (inv) => (
        <Badge variant={INVOICE_STATUS_COLORS[inv.status as InvoiceStatus] as "success" | "warning" | "danger"}>
          {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        title="Hóa đơn"
        subtitle="Quản lý hóa đơn tiền thuê và dịch vụ"
        count={filtered.length}
        iconColor="linear-gradient(135deg, #F59E0B, #FBBF24)"
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
          <option value="PAID">Đã thanh toán</option>
          <option value="UNPAID">Chưa thanh toán</option>
          <option value="OVERDUE">Quá hạn</option>
        </select>
      </div>

      <DataTable columns={columns} data={paginated} />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
