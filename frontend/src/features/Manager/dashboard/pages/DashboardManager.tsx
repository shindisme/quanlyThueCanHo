import {
  Home, Users, DollarSign, Wrench, TrendingUp, TrendingDown,
  CalendarDays, Clock, AlertCircle
} from "lucide-react";
import { useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { useDashboardManager } from "../hooks/useDashboardManager";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useAuthStore } from "../../../../stores/auth.store";
import DashboardStaff from "./DashboardStaff";

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
          <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isGreen ? "text-emerald-100" : "text-gray-500"
            }`}>{label}</p>
          <p className={`text-2xl font-bold ${isGreen ? "text-white" : "text-gray-800"
            }`}>{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isGreen ? "text-emerald-200" : trend === "up" ? "text-success-600" : "text-danger-600"
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

export default function DashboardManager() {
  const { role } = useAuthStore();
  if (role === "STAFF") {
    return <DashboardStaff />;
  }

  const {
    displayName,
    managedBuildingId,
    apartments,
    tenants,
    contracts,
    schedules,
    invoices,
    maintenanceRequests,
    isLoading
  } = useDashboardManager();


  const [timeFrame, setTimeFrame] = useState<"month" | "year">("month");

  function formatCurrency(amount: number) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(0) + " tr";
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Filter apartments in manager's building
  const buildingApartments = managedBuildingId
    ? apartments.filter((a: any) => a.building_id === managedBuildingId)
    : apartments;

  const totalApartmentsCount = buildingApartments.length;

  const rentedApts = buildingApartments.filter((a: any) => a.status === "RENTED");
  const availableApts = buildingApartments.filter((a: any) => a.status === "AVAILABLE");
  const maintenanceApts = buildingApartments.filter((a: any) => a.status === "MAINTENANCE");

  const rentedCount = rentedApts.length;
  const availableCount = availableApts.length;
  const maintenanceCount = maintenanceApts.length;



  // Filter active contracts
  const buildingContracts = contracts.filter((c: any) => {
    const isRoomInBuilding = buildingApartments.some((a: any) => a.id === c.apartment_id);
    return c.status === "ACTIVE" && isRoomInBuilding;
  });

  // Unique tenants in building
  const buildingTenantIds = new Set(buildingContracts.map((c: any) => c.tenant_id));
  const activeTenantsCount = managedBuildingId ? buildingTenantIds.size : tenants.length;

  // Filter invoices for building
  const filteredInvoices = managedBuildingId
    ? invoices.filter((inv: any) => inv.contract?.apartment?.building_id === managedBuildingId)
    : invoices;

  // Monthly actual revenue: sum of total_amount of paid invoices in the current month
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentMonthPaidInvoices = filteredInvoices.filter((inv: any) => {
    if (inv.status !== "PAID") return false;
    const date = new Date(inv.paid_at || inv.created_at);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyRevenue = currentMonthPaidInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0);

  // Expiring contracts within next 30 days
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const expiringContractsCount = buildingContracts.filter((c: any) => {
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= thirtyDaysLater;
  }).length;

  // Pending schedules in manager's building
  const pendingSchedulesCount = schedules.filter((s: any) => {
    const matchesBuilding = !managedBuildingId || s.apartment?.building_id === managedBuildingId;
    return s.status === "PENDING" && matchesBuilding;
  }).length;

  // Pending maintenance requests
  const pendingMaintenanceRequests = maintenanceRequests.filter(
    (r) => r.status === "PENDING" || r.status === "PROCESSING" || r.status === "NEEDS_RESCHEDULE"
  ).length;

  // Processing maintenance requests
  const processingMaintenanceRequests = maintenanceRequests.filter(
    (r) => r.status === "PROCESSING"
  ).length;

  // Revenue chart data: Switch between Monthly and Yearly based on timeFrame
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const monthlyRevenueData = months.map((m, index) => {
    const monthVal = index + 1;
    const revenue = filteredInvoices.filter((inv: any) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getMonth() + 1 === monthVal && date.getFullYear() === currentYear;
    }).reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0);

    return { name: m, "Doanh thu": revenue };
  });

  const years = [currentYear - 2, currentYear - 1, currentYear];
  const yearlyRevenueData = years.map(yr => {
    const revenue = filteredInvoices.filter((inv: any) => {
      if (inv.status !== "PAID") return false;
      const date = new Date(inv.paid_at || inv.created_at);
      return date.getFullYear() === yr;
    }).reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0);

    return { name: String(yr), "Doanh thu": revenue };
  });

  const chartData = timeFrame === "month" ? monthlyRevenueData : yearlyRevenueData;

  const apartmentStatus = [
    { name: "Đang thuê", value: rentedCount, color: "#7C3AED" },
    { name: "Còn trống", value: availableCount, color: "#10B981" },
    { name: "Bảo trì", value: maintenanceCount, color: "#F59E0B" },
  ];

  const upcomingTasks = [
    { text: `Kiểm tra căn hộ sắp hết hạn (${expiringContractsCount} HĐ)`, time: "Tuần này", urgent: expiringContractsCount > 0 },
    { text: `Xử lý lịch hẹn xem phòng (${pendingSchedulesCount} lịch chờ)`, time: "Hôm nay", urgent: pendingSchedulesCount > 0 },
    { text: "Bảo trì định kỳ hệ thống điện nước hành lang", time: "Thứ 5", urgent: false },
    { text: "Ghi nhận chỉ số điện nước định kỳ cuối tháng", time: "Hàng tháng", urgent: false },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-800">
          Xin chào, <span className="text-primary-600">{displayName}</span>
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Tổng căn hộ" value={totalApartmentsCount}
            iconColor="text-primary-600" iconBg="bg-primary-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Wrench} label="Yêu cầu sửa chữa" value={pendingMaintenanceRequests}
            iconColor="text-warning-600" iconBg="bg-warning-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Users} label="Người thuê" value={activeTenantsCount}
            iconColor="text-info-600" iconBg="bg-info-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Còn trống" value={availableCount}
            iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={CalendarDays} label="Lịch hẹn chờ duyệt" value={pendingSchedulesCount}
            iconColor="text-danger-600" iconBg="bg-danger-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={DollarSign} label="Doanh thu tháng này" value={formatCurrency(monthlyRevenue)}
            iconColor="text-white" iconBg="bg-white/20" variant="green" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* Left panel: Revenue Chart or Maintenance Table */}
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
            <ResponsiveContainer width="100%" height={280} debounce={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradientRevenueManager" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Area type="monotone" dataKey="Doanh thu" stroke="#10B981" strokeWidth={2.5}
                  fill="url(#gradientRevenueManager)" name="Doanh thu" dot={{ fill: "#10B981", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Apartment status pie chart */}
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Tình trạng căn hộ" subtitle="Cơ cấu căn hộ hiện tại">
            <div className="flex flex-col items-center justify-between h-full">
              <ResponsiveContainer width="100%" height={280} debounce={150}>
                <PieChart>
                  <Pie data={apartmentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={60} outerRadius={85} paddingAngle={4}>
                    {apartmentStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2 w-full">
                {apartmentStatus.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{item.value} căn</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Operational Tasks Row */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-gray-200 p-5 shadow-lg rounded-none">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-600" />
            Nhiệm vụ vận hành chi nhánh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingTasks.map((task, i) => (
              <div key={i} className={`p-4 border rounded-none flex items-start gap-3 transition-colors ${task.urgent
                ? "border-orange-200 bg-orange-50/30 hover:bg-orange-50/55"
                : "border-gray-200 bg-gray-50/20 hover:bg-gray-50/50"
                }`}>
                {task.urgent ? (
                  <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={16} />
                ) : (
                  <Clock className="text-gray-400 mt-0.5 shrink-0" size={16} />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">{task.text}</p>
                  <span className={`text-[10px] font-bold uppercase mt-1 inline-block ${task.urgent ? "text-orange-600" : "text-gray-400"
                    }`}>
                    {task.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
