import { useState } from "react";
import { Receipt } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/ui/PageHeader";

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

import { useSort } from "../../../hooks/useSort";
import { removeVietnameseTones } from "../../../utils/format";

export default function MyInvoices() {
  const [search, setSearch] = useState("");

  const filtered = mockInvoices.filter((inv) => {
    const term = removeVietnameseTones(search);
    const codeNorm = removeVietnameseTones(inv.invoice_code);
    const monthNorm = removeVietnameseTones(inv.billing_month);
    return codeNorm.includes(term) || monthNorm.includes(term);
  });

  const { items: sortedInvoices, requestSort, getSortIcon } = useSort(filtered, null, {
    billing_month: (inv) => {
      const [m, y] = inv.billing_month.split("/");
      return Number(y) * 12 + Number(m);
    }
  });

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

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
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th onClick={() => requestSort("invoice_code")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Mã HĐ {getSortIcon("invoice_code")}
                </th>
                <th onClick={() => requestSort("billing_month")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Tháng {getSortIcon("billing_month")}
                </th>
                <th onClick={() => requestSort("rent")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Tiền thuê {getSortIcon("rent")}
                </th>
                <th onClick={() => requestSort("electricity")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Điện {getSortIcon("electricity")}
                </th>
                <th onClick={() => requestSort("water")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Nước {getSortIcon("water")}
                </th>
                <th onClick={() => requestSort("service_fee")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Dịch vụ {getSortIcon("service_fee")}
                </th>
                <th onClick={() => requestSort("total")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Tổng {getSortIcon("total")}
                </th>
                <th onClick={() => requestSort("status")} className="text-center cursor-pointer select-none hover:bg-gray-100 transition-colors">
                  Trạng thái {getSortIcon("status")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-semibold text-primary-600">{inv.invoice_code}</td>
                  <td className="text-gray-650">{inv.billing_month}</td>
                  <td className="text-gray-600 text-right">{formatCurrency(inv.rent)}</td>
                  <td className="text-gray-600 text-right">{formatCurrency(inv.electricity)}</td>
                  <td className="text-gray-600 text-right">{formatCurrency(inv.water)}</td>
                  <td className="text-gray-600 text-right">{formatCurrency(inv.service_fee)}</td>
                  <td className="font-bold text-gray-800 text-right">{formatCurrency(inv.total)}</td>
                  <td className="text-center">{getStatusBadge(inv.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
