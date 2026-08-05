import { Link } from "react-router-dom";
import {
  Users, DollarSign, AlertTriangle, ArrowUpRight, Percent, Wrench, ShieldAlert
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { useDashboardAdmin } from "../hooks/useDashboardAdmin";
import Combobox from "../../../../components/ui/Combobox";
import { toast } from "sonner";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";

export default function DashboardAdmin() {
  const {
    displayName,
    buildings,
    isLoading,
    selectedBranch,
    setSelectedBranch,
    timeFrame,
    setTimeFrame,
    today,
    totalApartmentsCount,
    activeTenantsCount,
    monthlyRevenue,
    unpaidRevenue,
    unpaidInvoicesCount,
    occupancyRate,
    revenueTrend,
    revenueTrendValue,
    rentedCount,
    maintenanceCount,
    chartData,
    roomStatusData,
    expiredContractsCount,
    expiring30DaysCount,
    expiring60DaysCount,
    expiring90DaysCount,
    branchOptions,
    currentYear,
  } = useDashboardAdmin();

  function formatCurrency(amount: number) {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(2) + " tỷ";
    }
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(0) + " tr";
    }
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <LoadingSpinner size={32} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải dữ liệu tổng quan...</span>
      </div>
    );
  }

  const hasAlerts = expiring30DaysCount > 0 || unpaidInvoicesCount > 0 || maintenanceCount > 0;

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tổng quan hệ thống</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-60">
            <Combobox
              value={selectedBranch}
              onChange={(val) => {
                setSelectedBranch(val);
                const selectedB = buildings.find((b) => String(b.id) === String(val));
                const branchName = selectedB ? selectedB.branch_name : "Tất cả chi nhánh";
                toast.success(`Chuyển đổi thành công sang: ${branchName}`);
              }}
              options={branchOptions}
              placeholder="Tất cả chi nhánh"
              clearable={false}
            />
          </div>
        </div>
      </div>

      {/* DASHBOARD ALERTS BAR */}
      {hasAlerts && (
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert size={16} className="text-amber-600" />
            <span>Chú ý</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-amber-900 pt-1">
            {expiring30DaysCount > 0 && (
              <Link to="/admin/contracts" className="flex items-center gap-1.5 hover:underline text-orange-700 bg-orange-100/60 px-2.5 py-1 border border-orange-200/60">
                <span><strong>{expiring30DaysCount}</strong> hợp đồng sắp hết hạn (30 ngày)</span>
              </Link>
            )}
            {unpaidInvoicesCount > 0 && (
              <Link to="/admin/invoices" className="flex items-center gap-1.5 hover:underline text-rose-700 bg-rose-100/60 px-2.5 py-1 border border-rose-200/60">
                <span><strong>{unpaidInvoicesCount}</strong> hóa đơn chưa thu ({formatCurrency(unpaidRevenue)})</span>
              </Link>
            )}
            {maintenanceCount > 0 && (
              <Link to="/admin/apartments" className="flex items-center gap-1.5 hover:underline text-amber-700 bg-amber-100/60 px-2.5 py-1 border border-amber-200/60">
                <Wrench size={14} />
                <span><strong>{maintenanceCount}</strong> căn hộ đang bảo trì</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-gray-200 shadow-sm">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          Thao tác nhanh
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/contracts"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Tạo hợp đồng
          </Link>
          <Link
            to="/admin/invoices"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Tạo hóa đơn
          </Link>
          <Link
            to="/admin/tenants"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Thêm cư dân
          </Link>
          <Link
            to="/admin/apartments"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Thêm căn hộ
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        {/* Tỷ lệ lấp đầy */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Tỷ lệ lấp đầy</p>
                <p className="text-2xl font-bold text-gray-900">{occupancyRate}%</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{rentedCount} / {totalApartmentsCount} căn đang ở</p>
              </div>
            </div>
            {/* Progress bar lấp đầy */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-3">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, occupancyRate)}%` }} />
            </div>
          </div>
        </div>

        {/* Doanh thu thực nhận */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            icon={DollarSign}
            label="Doanh thu tháng"
            value={formatCurrency(monthlyRevenue)}
            trend={revenueTrend}
            trendValue={revenueTrendValue}
            iconColor="text-white"
            iconBg="bg-white/20"
            variant="green"
          />
        </div>

        {/* Tiền chưa thu */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            icon={AlertTriangle}
            label={`Tiền chưa thu (${unpaidInvoicesCount} HĐ)`}
            value={formatCurrency(unpaidRevenue)}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
        </div>

        {/* Người thuê đang ở */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            icon={Users}
            label="Người thuê đang ở"
            value={activeTenantsCount}
            iconColor="text-info-600"
            iconBg="bg-info-50"
          />
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        {/* Biểu đồ Doanh thu */}
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
            <ResponsiveContainer width="100%" height={250} debounce={150}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value) || 0), "Doanh thu"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                />
                {timeFrame === "month" && (
                  <Area type="monotone" dataKey="Năm trước" stroke="#D1D5DB" strokeWidth={1.5} fill="transparent" name="Năm trước" />
                )}
                <Area type="monotone" dataKey="Doanh thu" stroke="#10B981" strokeWidth={2.5}
                  fill="url(#gradientRevenue)" name="Doanh thu" dot={{ fill: "#10B981", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Biểu đồ Trạng thái Căn hộ */}
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Trạng thái căn hộ" subtitle="Cấu trúc trạng thái phòng thực tế">
            <div className="flex flex-col items-center justify-between h-full">
              <ResponsiveContainer width="100%" height={180} debounce={150}>
                <PieChart>
                  <Pie data={roomStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={75} paddingAngle={4}>
                    {roomStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} căn`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 w-full mt-2 border-t border-gray-100 pt-3">
                {roomStatusData.map((item) => (
                  <div key={item.name} className="flex flex-col items-center text-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-gray-500 font-medium">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 mt-0.5">{item.value} căn</span>
                    <span className="text-[10px] text-gray-400 font-medium">({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* THEO DÕI THỜI HẠN HỢP ĐỒNG */}
      <div className="bg-white border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Theo dõi thời hạn hợp đồng đến hạn
            </h3>
          </div>
          <Link to="/admin/contracts" className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
            Quản lý hợp đồng <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-4 items-stretch">
          {/* Đã hết hạn */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-rose-100 bg-rose-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <span className="text-xs text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1">
              Đã hết hạn
            </span>
            <p className="text-2xl font-black text-rose-700 mt-1">{expiredContractsCount}</p>
          </div>

          {/* Trong 30 ngày */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-orange-100 bg-orange-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <span className="text-xs text-orange-600 font-bold uppercase tracking-wider flex items-center gap-1">
              Trong 30 ngày
            </span>
            <p className="text-2xl font-black text-orange-700 mt-1">{expiring30DaysCount}</p>
          </div>

          {/* Từ 31 - 60 ngày */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-amber-100 bg-amber-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Từ 31 - 60 ngày</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{expiring60DaysCount}</p>
          </div>

          {/* Từ 61 - 90 ngày */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-blue-100 bg-blue-50/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-center">
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Từ 61 - 90 ngày</span>
            <p className="text-2xl font-black text-blue-700 mt-1">{expiring90DaysCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}