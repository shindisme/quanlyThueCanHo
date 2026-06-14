import { useState } from "react";
import { FileText } from "lucide-react";
import Badge from "../../components/ui/Badge";
import SearchInput from "../../components/ui/SearchInput";
import PageHeader from "../../components/ui/PageHeader";

// ============================================================
// HỢP ĐỒNG CỦA TÔI - Tenant xem hợp đồng
// ============================================================
// Mock data nội tuyến - chờ backend API

const mockContracts = [
  {
    id: 1, contract_code: "HD-2026-001", apartment_code: "A-101",
    building: "YuKi Tower A", start_date: "2026-01-15", end_date: "2027-01-15",
    monthly_rent: 6500000, deposit: 13000000, status: "ACTIVE",
  },
  {
    id: 2, contract_code: "HD-2025-012", apartment_code: "A-101",
    building: "YuKi Tower A", start_date: "2025-01-15", end_date: "2026-01-14",
    monthly_rent: 6000000, deposit: 12000000, status: "ENDED",
  },
];

export default function MyContracts() {
  const [search, setSearch] = useState("");

  const filtered = mockContracts.filter(
    (c) => c.contract_code.toLowerCase().includes(search.toLowerCase())
  );

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  function getStatusBadge(status: string) {
    if (status === "ACTIVE") return <Badge variant="success">Hiệu lực</Badge>;
    if (status === "ENDED") return <Badge variant="gray">Đã kết thúc</Badge>;
    return <Badge variant="danger">Thanh lý</Badge>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        title="Hợp đồng của tôi"
        subtitle="Xem lại các hợp đồng thuê căn hộ của bạn"
        count={mockContracts.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã hợp đồng..." className="max-w-md" />

      <div className="space-y-4">
        {filtered.map((contract) => (
          <div key={contract.id} className="premium-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{contract.contract_code}</h3>
                  <p className="text-xs text-gray-400">{contract.apartment_code} - {contract.building}</p>
                </div>
              </div>
              {getStatusBadge(contract.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Bắt đầu</p>
                <p className="font-medium text-gray-800">{new Date(contract.start_date).toLocaleDateString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-gray-400">Kết thúc</p>
                <p className="font-medium text-gray-800">{new Date(contract.end_date).toLocaleDateString("vi-VN")}</p>
              </div>
              <div>
                <p className="text-gray-400">Tiền thuê/tháng</p>
                <p className="font-medium text-gray-800">{formatCurrency(contract.monthly_rent)}</p>
              </div>
              <div>
                <p className="text-gray-400">Tiền cọc</p>
                <p className="font-medium text-gray-800">{formatCurrency(contract.deposit)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
