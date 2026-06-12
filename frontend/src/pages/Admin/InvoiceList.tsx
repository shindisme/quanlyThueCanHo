import { useState } from "react";
import Card from "../../components/common/ui/Card";
import SearchInput from "../../components/common/ui/SearchInput";
import Badge from "../../components/common/ui/Badge";
import DataTable, { type Column } from "../../components/common/ui/DataTable";
import Pagination from "../../components/common/ui/Pagination";
import { mockInvoices } from "../../data/invoices";
import { mockTenants } from "../../data/tenants";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from "../../constants/enums";
import { formatCurrency, formatDate } from "../../utils/format";
import type { Invoice } from "../../types";
import type { InvoiceStatus } from "../../constants/enums";

// Trang danh sach hoa don
export default function InvoiceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = mockInvoices.filter((inv) => {
    const tenant = mockTenants.find((t) => t.id === inv.tenant_id);
    const matchSearch =
      inv.invoice_code.toLowerCase().includes(search.toLowerCase()) ||
      tenant?.full_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<Invoice>[] = [
    { key: "code", label: "Ma hoa don", render: (inv) => <span className="font-medium">{inv.invoice_code}</span> },
    { key: "tenant", label: "Nguoi thue", render: (inv) => mockTenants.find((t) => t.id === inv.tenant_id)?.full_name || "-" },
    { key: "total", label: "Tong tien", render: (inv) => <span className="font-semibold">{formatCurrency(inv.total_amount)}</span> },
    { key: "due", label: "Han thanh toan", render: (inv) => formatDate(inv.due_date) },
    {
      key: "status", label: "Trang thai",
      render: (inv) => (
        <Badge variant={INVOICE_STATUS_COLORS[inv.status as InvoiceStatus] as "success" | "warning" | "danger"}>
          {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hoa don</h1>
        <p className="text-sm text-gray-500">Quan ly hoa don tien thue va dich vu</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Tim theo ma hoa don hoac ten nguoi thue..."
          className="flex-1 max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white cursor-pointer focus:outline-none focus:border-primary-500"
        >
          <option value="">Tat ca trang thai</option>
          <option value="PAID">Da thanh toan</option>
          <option value="UNPAID">Chua thanh toan</option>
          <option value="OVERDUE">Qua han</option>
        </select>
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={paginated} />
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
