import { useState } from "react";
import { Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Badge from "../../../components/ui/Badge";
import SearchInput from "../../../components/ui/SearchInput";
import PageHeader from "../../../components/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useAuthStore } from "../../../stores/auth.store";
import * as tenantService from "../../../services/tenantService";
import * as invoiceService from "../../../services/invoiceService";
import { formatCurrency } from "../../../utils/currency";
import { formatDate } from "../../../utils/date";
import { removeVietnameseTones } from "../../../utils/string";
import { useDebounce } from "../../../hooks/common/useDebounce";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../components/ui/Table";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

type SortKey = "invoice_code" | "billing_month" | "total" | "status" | "due_date";

export default function MyInvoices() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  const { data: tenantsData, isLoading: loadingTenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantService.getAllTenants({ limit: 100 }),
  });
  const tenants = tenantsData?.data || [];

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getAllInvoices({ limit: 100 }),
  });
  const invoices = invoicesData?.data || [];

  const loading = loadingTenants || loadingInvoices;

  const decoded = token ? parseJwt(token) : null;
  const userId = decoded?.userId;
  const currentTenant = userId ? tenants.find((t) => t.user_id === userId) : null;
  const myInvoices = currentTenant ? invoices.filter((inv) => inv.tenant_id === currentTenant.id) : [];

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

  const filteredInvoices = myInvoices.filter((inv) => {
    const term = removeVietnameseTones(debouncedSearch.toLowerCase());
    const codeNorm = removeVietnameseTones((inv.invoice_code || "").toLowerCase());
    const dateObj = new Date(inv.created_at || inv.due_date);
    const monthStr = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    return (
      codeNorm.includes(term) ||
      monthStr.includes(term)
    );
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let valA: any = "";
    let valB: any = "";

    if (key === "invoice_code") {
      valA = a.invoice_code || "";
      valB = b.invoice_code || "";
    } else if (key === "billing_month") {
      valA = new Date(a.created_at || a.due_date).getTime();
      valB = new Date(b.created_at || b.due_date).getTime();
    } else if (key === "total") {
      valA = a.total_amount || 0;
      valB = b.total_amount || 0;
    } else if (key === "status") {
      valA = a.status || "";
      valB = b.status || "";
    } else if (key === "due_date") {
      valA = new Date(a.due_date).getTime();
      valB = new Date(b.due_date).getTime();
    }

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
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
        count={myInvoices.length}
        iconColor="linear-gradient(135deg, #F59E0B, #FBBF24)"
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Tìm kiếm..." className="max-w-md" />

      {/* Danh sách hóa đơn */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <LoadingSpinner size={36} />
          <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải hóa đơn...</span>
        </div>
      ) : sortedInvoices.length === 0 ? (
        <div className="text-center py-16 text-gray-550 bg-white rounded-xl border border-gray-200">
          <Receipt size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Không có hóa đơn nào phù hợp</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Card */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedInvoices.map((inv) => {
              const dateObj = new Date(inv.created_at || inv.due_date);
              const monthStr = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`;
              return (
                <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-600 text-base">
                      {inv.invoice_code}
                    </span>
                    {getStatusBadge(inv.status)}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">Tháng:</span> {monthStr}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Hạn thanh toán:</span> {formatDate(inv.due_date)}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Tổng tiền:</span> <span className="font-bold text-gray-800 text-base">{formatCurrency(inv.total_amount)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View TList */}
          <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-sm rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("invoice_code")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Mã HĐ {getSortIcon("invoice_code")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("billing_month")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Tháng {getSortIcon("billing_month")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("due_date")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Hạn thanh toán {getSortIcon("due_date")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("total")} className="text-right cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Tổng tiền {getSortIcon("total")}
                  </TableHead>
                  <TableHead onClick={() => requestSort("status")} className="text-center cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    Trạng thái {getSortIcon("status")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.map((inv) => {
                  const dateObj = new Date(inv.created_at || inv.due_date);
                  const monthStr = `${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-semibold text-primary-600">{inv.invoice_code}</TableCell>
                      <TableCell className="text-gray-655">{monthStr}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(inv.due_date)}</TableCell>
                      <TableCell className="font-bold text-gray-800 text-right">{formatCurrency(inv.total_amount)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(inv.status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
