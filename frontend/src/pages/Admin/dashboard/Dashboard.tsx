import {
  Building2, Home, Users, DollarSign, TrendingUp, TrendingDown, Calendar
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../../stores/auth.store";
import * as buildingService from "../../../services/buildingService";
import type { BuildingData } from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import * as contractService from "../../../services/contractService";
import * as invoiceService from "../../../services/invoiceService";
import type { Invoice } from "../../../types";
import Combobox from "../../../components/ui/Combobox";
import { toast } from "sonner";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

function StatCard({ icon: Icon, label, value, trend, trendValue, iconColor, iconBg, variant = "default" }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: string;
  iconColor: string;
  iconBg: string;
  variant?: "default" | "green";
}) {
  const isGreen = variant === "green";
  return (
    <div className={`border transition-all duration-200 p-5 shadow-lg hover:shadow-xl rounded-none h-full flex flex-col justify-between ${isGreen ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-gray-200"
      }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isGreen ? "text-emerald-100" : "text-gray-500"
            }`}>{label}</p>
          <p className={`text-2xl font-bold mb-1 ${isGreen ? "text-white" : "text-gray-900"
            }`}>{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isGreen ? "text-emerald-200" : trend === "up" ? "text-success-600" : "text-danger-600"
              }`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-none flex items-center justify-center shrink-0 ${isGreen ? "bg-white/20" : iconBg
          }`}>
          <Icon size={22} className={isGreen ? "text-white" : iconColor} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, action }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 p-5 shadow-lg rounded-none h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { email } = useAuthStore();
  const displayName = email?.split("@")[0] || "Admin";

  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [timeFrame, setTimeFrame] = useState<"month" | "year">("month");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bRes, aptRes, cRes, invRes] = await Promise.all([
          buildingService.getAllBuildings({ limit: 100 }),
          apartmentService.getAllApartments({ limit: 100 }),
          contractService.getAllContracts(),
          invoiceService.getAllInvoices({ limit: 100 })
        ]);

        setBuildings(bRes.data || []);
        setApartments(aptRes.data || []);
        setContracts(cRes || []);
        setInvoices(invRes.data || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function formatCurrency(amount: number) {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + " tỷ";
    }
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(0) + " tr";
    }
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate statistics based on selected building filter
  const branchId = selectedBranch ? Number(selectedBranch) : null;

  const filteredBuildings = branchId ? buildings.filter(b => b.id === branchId) : buildings;
  const filteredApartments = branchId ? apartments.filter(a => a.building_id === branchId) : apartments;
  const filteredInvoices = branchId
    ? invoices.filter(inv => inv.contract?.apartment?.building_id === branchId)
    : invoices;

  const totalBuildingsCount = filteredBuildings.length;

  const totalApartmentsCount = filteredBuildings.reduce((sum, b) => sum + (b.total_apartments || b._count?.apartments || 0), 0);

  const activeContractsForExpiration = contracts.filter(c => {
    return !branchId || filteredApartments.some(a => a.id === c.apartment_id);
  });

  const activeContracts = activeContractsForExpiration.filter(c => c.status === "ACTIVE");

  const buildingTenantIds = new Set(activeContracts.map(c => c.tenant_id));
  const activeTenantsCount = buildingTenantIds.size;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentMonthPaidInvoices = filteredInvoices.filter(inv => {
    if (inv.status !== "PAID") return false;
    const date = new Date(inv.paid_at || inv.created_at);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyRevenue = currentMonthPaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const monthlyRevenueData = months.map((m, index) => {
    const monthVal = index + 1;
    const revenue = filteredInvoices.filter(inv => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getMonth() + 1 === monthVal && date.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    const lastYear = filteredInvoices.filter(inv => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getMonth() + 1 === monthVal && date.getFullYear() === currentYear - 1;
    }).reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    return {
      name: m,
      "Doanh thu": revenue,
      "Năm trước": lastYear,
    };
  });

  const years = [currentYear - 2, currentYear - 1, currentYear];
  const yearlyRevenueData = years.map(yr => {
    const revenue = filteredInvoices.filter(inv => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getFullYear() === yr;
    }).reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    return {
      name: String(yr),
      "Doanh thu": revenue,
    };
  });

  const chartData = timeFrame === "month" ? monthlyRevenueData : yearlyRevenueData;

  // Room Status Calculations
  const rentedCount = filteredApartments.filter(a => a.status === "RENTED").length;
  const availableCount = filteredApartments.filter(a => a.status === "AVAILABLE").length;
  const maintenanceCount = filteredApartments.filter(a => a.status === "MAINTENANCE").length;

  const roomStatusData = [
    { name: "Đang thuê", value: rentedCount, color: "#10B981" },
    { name: "Trống", value: availableCount, color: "#3B82F6" },
    { name: "Bảo trì", value: maintenanceCount, color: "#F59E0B" },
  ];

  // Contract Expiration Calculations
  const now = new Date();
  const getBoundaryDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };
  const time30Days = getBoundaryDate(30);
  const time60Days = getBoundaryDate(60);
  const time90Days = getBoundaryDate(90);

  const expiredContractsCount = activeContractsForExpiration.filter(c => {
    if (c.status !== "ACTIVE") return false;
    return new Date(c.end_date) < now;
  }).length;

  const expiring30DaysCount = activeContractsForExpiration.filter(c => {
    if (c.status !== "ACTIVE") return false;
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= time30Days;
  }).length;

  const expiring60DaysCount = activeContractsForExpiration.filter(c => {
    if (c.status !== "ACTIVE") return false;
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= time60Days;
  }).length;

  const expiring90DaysCount = activeContractsForExpiration.filter(c => {
    if (c.status !== "ACTIVE") return false;
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= time90Days;
  }).length;

  // Combobox Options mapping
  const branchOptions = [
    { value: "", label: "Tất cả chi nhánh" },
    ...buildings.map(b => ({
      value: String(b.id),
      label: b.branch_name
    }))
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hệ thống</p>
        </div>

        <div className="w-64">
          <Combobox
            value={selectedBranch}
            onChange={(val) => {
              setSelectedBranch(val);
              const selectedB = buildings.find(b => String(b.id) === String(val));
              const branchName = selectedB ? selectedB.branch_name : "Tất cả chi nhánh";
              toast.success(`Chuyển đổi thành công sang: ${branchName}`);
            }}
            options={branchOptions}
            placeholder="Tất cả chi nhánh"
            clearable={false}
          />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Building2} label="Tổng tòa nhà" value={totalBuildingsCount}
            iconColor="text-primary-600" iconBg="bg-primary-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Home} label="Tổng căn hộ" value={totalApartmentsCount.toLocaleString()}
            iconColor="text-info-600" iconBg="bg-info-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Users} label="Người thuê" value={activeTenantsCount}
            iconColor="text-success-600" iconBg="bg-success-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={DollarSign} label="Doanh thu (Tháng này)" value={formatCurrency(monthlyRevenue)}
            iconColor="text-white" iconBg="bg-white/20" variant="green" />
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* Revenue chart */}
        <div className="col-span-12 lg:col-span-8">
          <ChartCard
            title={`Doanh thu (${timeFrame === "month" ? `Năm ${currentYear}` : "Theo năm"})`}
            action={
              <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                <button
                  onClick={() => setTimeFrame("month")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${timeFrame === "month"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  Theo tháng
                </button>
                <button
                  onClick={() => setTimeFrame("year")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${timeFrame === "year"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  Theo năm
                </button>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300} debounce={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                {timeFrame === "month" && (
                  <Area type="monotone" dataKey="Năm trước" stroke="#E5E7EB" strokeWidth={1.5} fill="transparent" name="Năm trước" />
                )}
                <Area type="monotone" dataKey="Doanh thu" stroke="#10B981" strokeWidth={2.5}
                  fill="url(#gradientRevenue)" name="Doanh thu" dot={{ fill: "#10B981", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Room Status Pie Chart */}
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Trạng thái căn hộ" subtitle="Cấu trúc trạng thái phòng thực tế">
            <div className="flex flex-col items-center justify-between h-full">
              <ResponsiveContainer width="100%" height={300} debounce={150}>
                <PieChart>
                  <Pie data={roomStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={65} outerRadius={90} paddingAngle={4}>
                    {roomStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 w-full mt-3 border-t border-gray-100 pt-3">
                {roomStatusData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-gray-500 font-medium">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 mt-0.5">{item.value} căn</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* CONTRACT MONITORING SECTION */}
      <div className="bg-white border border-gray-200 p-5 shadow-lg rounded-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-primary-600" />
              Theo dõi thời hạn hợp đồng
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Thống kê số lượng hợp đồng thuê đến hạn bàn giao</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 items-stretch">
          {/* Expired */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-red-100 bg-red-50/20 rounded-none shadow-lg hover:shadow-xl transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Đã hết hạn</span>
            <p className="text-2xl font-black text-red-700 mt-1">{expiredContractsCount}</p>
          </div>

          {/* 30 days */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-orange-100 bg-orange-50/20 rounded-none shadow-lg hover:shadow-xl transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Trong 30 ngày</span>
            <p className="text-2xl font-black text-orange-700 mt-1">{expiring30DaysCount}</p>
          </div>

          {/* 60 days */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-amber-100 bg-amber-50/20 rounded-none shadow-lg hover:shadow-xl transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Trong 60 ngày</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{expiring60DaysCount}</p>
          </div>

          {/* 90 days */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-blue-100 bg-blue-50/20 rounded-none shadow-lg hover:shadow-xl transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Trong 90 ngày</span>
            <p className="text-2xl font-black text-blue-700 mt-1">{expiring90DaysCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}