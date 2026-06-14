import { useState } from "react";
import { Receipt } from "lucide-react";
import Badge from "../../components/ui/Badge";
import SearchInput from "../../components/ui/SearchInput";
import PageHeader from "../../components/ui/PageHeader";

// ============================================================
// HÓA ĐƠN CỦA TÔI - Tenant xem hóa đơn
// ============================================================

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

export default function MyInvoices() {
  const [search, setSearch] = useState("");

  const filtered = mockInvoices.filter(
    (inv) => inv.invoice_code.toLowerCase().includes(search.toLowerCase()) ||
      inv.billing_month.includes(search)
  );

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

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã hóa đơn, tháng..." className="max-w-md" />

      {/* Bảng hóa đơn */}
      <div className="premium-table-container">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Tháng</th>
                <th className="text-right">Tiền thuê</th>
                <th className="text-right">Điện</th>
                <th className="text-right">Nước</th>
                <th className="text-right">Dịch vụ</th>
                <th className="text-right">Tổng</th>
                <th className="text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
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
