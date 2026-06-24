import { useState } from "react";
import { Receipt } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/ui/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

const mockInvoices = [
  {
    id: 1, invoice_code: "INV-2026-06-001", billing_month: "06/2026",
    rent: 6500000, electricity: 450000, water: 120000, service_fee: 350000,
    total: 7420000, status: "UNPAID", due_date: "2026-06-30",
  },
  {
    id: 2, invoice_code: "INV-2026-05-001", billing_month: "05/2026",
    rent: 6500000, electricity: 380000, water: 100000, service_fee: 350000,
    total: 7330000, status: "PAID", due_date: "2026-05-31",
  },
  {
    id: 3, invoice_code: "INV-2026-04-001", billing_month: "04/2026",
    rent: 6500000, electricity: 520000, water: 130000, service_fee: 350000,
    total: 7500000, status: "PAID", due_date: "2026-04-30",
  },
];

type SortKey = "invoice_code" | "billing_month" | "rent" | "electricity" | "water" | "service_fee" | "total" | "status";

export default function MyInvoices() {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const requestSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredInvoices = mockInvoices.filter(
    (inv) =>
      inv.invoice_code.toLowerCase().includes(search.toLowerCase()) ||
      inv.billing_month.includes(search)
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
    if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
    return 0;
  });

  function getStatusBadge(status: string) {
    if (status === "PAID") return <Badge variant="success">Đã thanh toán</Badge>;
    if (status === "UNPAID") return <Badge variant="warning">Chưa thanh toán</Badge>;
    return <Badge variant="danger">Quá hạn</Badge>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        title="Hóa đơn của tôi"
        subtitle="Theo dõi và kiểm tra hóa đơn tiền thuê hàng tháng của bạn"
        count={mockInvoices.length}
        iconColor="linear-gradient(135deg, #F59E0B, #FBBF24)"
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." className="max-w-md" />

      {/* Bảng hóa đơn */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("invoice_code")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Mã HĐ {getSortIcon("invoice_code")}
              </TableHead>
              <TableHead onClick={() => requestSort("billing_month")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Tháng {getSortIcon("billing_month")}
              </TableHead>
              <TableHead onClick={() => requestSort("rent")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Tiền thuê {getSortIcon("rent")}
              </TableHead>
              <TableHead onClick={() => requestSort("electricity")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Điện {getSortIcon("electricity")}
              </TableHead>
              <TableHead onClick={() => requestSort("water")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Nước {getSortIcon("water")}
              </TableHead>
              <TableHead onClick={() => requestSort("service_fee")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Dịch vụ {getSortIcon("service_fee")}
              </TableHead>
              <TableHead onClick={() => requestSort("total")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Tổng {getSortIcon("total")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="text-center cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Trạng thái {getSortIcon("status")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-semibold text-primary-600">{inv.invoice_code}</TableCell>
                <TableCell className="text-gray-650">{inv.billing_month}</TableCell>
                <TableCell className="text-gray-600 text-right">{formatCurrency(inv.rent)}</TableCell>
                <TableCell className="text-gray-600 text-right">{formatCurrency(inv.electricity)}</TableCell>
                <TableCell className="text-gray-600 text-right">{formatCurrency(inv.water)}</TableCell>
                <TableCell className="text-gray-600 text-right">{formatCurrency(inv.service_fee)}</TableCell>
                <TableCell className="font-bold text-gray-800 text-right">{formatCurrency(inv.total)}</TableCell>
                <TableCell className="text-center">{getStatusBadge(inv.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
