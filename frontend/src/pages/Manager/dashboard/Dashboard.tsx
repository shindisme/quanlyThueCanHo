import {
  Home, Users, DollarSign, Wrench, TrendingUp, TrendingDown,
  ArrowUpRight, CalendarDays,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { useAuthStore } from "../../../stores/auth.store";

// ============================================================
// MANAGER DASHBOARD - DashboardPack Style
// ============================================================
// Scope: 1 tòa nhà (không phải toàn hệ thống như Admin)

const mockKPI = {
  totalApartments: 200,
  rentedApartments: 156,
  availableApartments: 44,
  totalTenants: 142,
  monthlyRevenue: 312000000,
  pendingMaintenance: 8,
};

const revenueData = [
  { month: "T1", revenue: 280000000 },
  { month: "T2", revenue: 295000000 },
  { month: "T3", revenue: 288000000 },
  { month: "T4", revenue: 305000000 },
  { month: "T5", revenue: 310000000 },
  { month: "T6", revenue: 312000000 },
];

const apartmentStatus = [
  { name: "Đang thuê", value: 156, color: "#7C3AED" },
  { name: "Còn trống", value: 32, color: "#E5E7EB" },
  { name: "Bảo trì", value: 12, color: "#F59E0B" },
];

const upcomingTasks = [
  { text: "Kiểm tra phòng A-305 (sắp hết hạn HĐ)", time: "Hôm nay", urgent: true },
  { text: "Thu tiền thuê tháng 6 - 12 phòng chưa thu", time: "Còn 3 ngày", urgent: true },
  { text: "Bảo trì điều hòa tầng 5-8", time: "Thứ 5", urgent: false },
  { text: "Họp đánh giá chất lượng dịch vụ", time: "Thứ 6", urgent: false },
];

function StatCard({ icon: Icon, label, value, trend, trendValue, iconColor, iconBg }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend === "up" ? "text-success-600" : "text-danger-600"
            }`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { email } = useAuthStore();
  const displayName = email?.split("@")[0] || "Manager";

  function formatCurrency(amount: number) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(0) + " tr";
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const occupancyRate = Math.round((mockKPI.rentedApartments / mockKPI.totalApartments) * 100);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-800">
          Xin chào, <span className="text-primary-600">{displayName}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan tòa nhà bạn đang quản lý</p>
      </div>

      {/* KPI Cards - 12 cột */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Tổng căn hộ" value={mockKPI.totalApartments}
            iconColor="text-primary-600" iconBg="bg-primary-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label={`Đang thuê (${occupancyRate}%)`} value={mockKPI.rentedApartments}
            trend="up" trendValue="+3.2%"
            iconColor="text-success-600" iconBg="bg-success-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Users} label="Người thuê" value={mockKPI.totalTenants}
            iconColor="text-info-600" iconBg="bg-info-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={DollarSign} label="Doanh thu tháng" value={formatCurrency(mockKPI.monthlyRevenue)}
            trend="up" trendValue="+5.1%"
            iconColor="text-warning-600" iconBg="bg-warning-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Còn trống" value={mockKPI.availableApartments}
            iconColor="text-gray-500" iconBg="bg-gray-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Wrench} label="Yêu cầu sửa chữa" value={mockKPI.pendingMaintenance}
            trend="down" trendValue="-2"
            iconColor="text-danger-600" iconBg="bg-danger-50" />
        </div>
      </div>

      {/* Charts + Tasks - 12 cột */}
      <div className="grid grid-cols-12 gap-6">
        {/* Revenue area chart - chiếm 8 cột */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Doanh thu theo tháng</h3>
              <p className="text-xs text-gray-400 mt-0.5">6 tháng gần nhất</p>
            </div>
            <TrendingUp size={18} className="text-success-500" />
          </div>
          <ResponsiveContainer width="100%" height={260} debounce={150}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gradientMgr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), "Doanh thu"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5}
                fill="url(#gradientMgr)" dot={{ fill: "#7C3AED", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Apartment status pie - chiếm 4 cột */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Trạng thái căn hộ</h3>
          <p className="text-xs text-gray-400 mb-4">Tổng {mockKPI.totalApartments} căn</p>
          <ResponsiveContainer width="100%" height={180} debounce={150}>
            <PieChart>
              <Pie data={apartmentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={50} outerRadius={75} paddingAngle={3}>
                {apartmentStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {apartmentStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Công việc sắp tới</h3>
            <p className="text-xs text-gray-400 mt-0.5">Lịch làm việc tuần này</p>
          </div>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 cursor-pointer">
            Xem tất cả <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {upcomingTasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <CalendarDays size={18} className={task.urgent ? "text-danger-500" : "text-gray-400"} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{task.text}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                task.urgent ? "bg-danger-50 text-danger-600" : "bg-gray-100 text-gray-500"
              }`}>
                {task.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
