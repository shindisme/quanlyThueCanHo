import {
  Building2, Home, Users, DollarSign
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { useDashboardAdmin } from "./hooks/useDashboardAdmin";
import Combobox from "../../../components/ui/Combobox";
import { toast } from "sonner";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";

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
    totalBuildingsCount,
    totalApartmentsCount,
    activeTenantsCount,
    monthlyRevenue,
    chartData,
    roomStatusData,
    expiredContractsCount,
    expiring30DaysCount,
    expiring60DaysCount,
    expiring90DaysCount,
    branchOptions,
    currentYear
  } = useDashboardAdmin();

  function formatCurrency(amount: number) {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + " tỷ";
    }
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(0) + " tr";
    }
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  if (isLoading) {
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
          <StatCard icon={DollarSign} label="Doanh thu trong tháng" value={formatCurrency(monthlyRevenue)}
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
              <div className="flex bg-gray-100 rounded-none p-0.5 border border-gray-200">
                <button
                  onClick={() => setTimeFrame("month")}
                  className={`px-3 py-1 text-xs font-semibold rounded-none transition-all ${timeFrame === "month"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  Theo tháng
                </button>
                <button
                  onClick={() => setTimeFrame("year")}
                  className={`px-3 py-1 text-xs font-semibold rounded-none transition-all ${timeFrame === "year"
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
                <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), ""]}
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

      {/* CONTRACT SECTION */}
      <div className="bg-white border border-gray-200 p-5 shadow-md rounded-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Theo dõi thời hạn hợp đồng
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Thống kê số lượng hợp đồng thuê đến hạn bàn giao</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 items-stretch">
          {/* Expired */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-red-100 bg-red-50/20 rounded-none shadow-md hover:shadow-lg transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Đã hết hạn</span>
            <p className="text-2xl font-black text-red-700 mt-1">{expiredContractsCount}</p>
          </div>

          {/* 30 days */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-orange-100 bg-orange-50/20 rounded-none shadow-md hover:shadow-lg transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Trong 30 ngày</span>
            <p className="text-2xl font-black text-orange-700 mt-1">{expiring30DaysCount}</p>
          </div>

          {/* 60 days */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-amber-100 bg-amber-50/20 rounded-none shadow-md hover:shadow-lg transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Từ 31 - 60 ngày</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{expiring60DaysCount}</p>
          </div>

          {/* 90 days */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-4 border border-blue-100 bg-blue-50/20 rounded-none shadow-md hover:shadow-lg transition-all flex flex-col justify-center h-full">
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Từ 61 - 90 ngày</span>
            <p className="text-2xl font-black text-blue-700 mt-1">{expiring90DaysCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
