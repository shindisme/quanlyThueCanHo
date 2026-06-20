import {
  Building2, Home, Users, DollarSign, FileText, Wrench,
  TrendingUp, TrendingDown, ChevronDown, ArrowUpRight,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
} from "recharts";
import { useState } from "react";
import { useAuthStore } from "../../../stores/auth.store";

const mockKPI = {
  totalBuildings: 5,
  totalApartments: 1000,
  rentedApartments: 687,
  availableApartments: 313,
  totalTenants: 524,
  monthlyRevenue: 1395000000,
  expiringContracts: 12,
  pendingMaintenance: 23,
};

const revenueData = [
  { month: "T1", revenue: 975000000, lastYear: 820000000 },
  { month: "T2", revenue: 1095000000, lastYear: 890000000 },
  { month: "T3", revenue: 1185000000, lastYear: 950000000 },
  { month: "T4", revenue: 1200000000, lastYear: 1020000000 },
  { month: "T5", revenue: 1310000000, lastYear: 1100000000 },
  { month: "T6", revenue: 1395000000, lastYear: 1180000000 },
];

const occupancyData = [
  { name: "Tower A", occupied: 85, vacant: 15 },
  { name: "Tower B", occupied: 72, vacant: 28 },
  { name: "Residence", occupied: 91, vacant: 9 },
  { name: "Garden", occupied: 65, vacant: 35 },
  { name: "Plaza", occupied: 78, vacant: 22 },
];

const invoiceData = [
  { name: "Đã thanh toán", value: 156, color: "#10B981" },
  { name: "Chưa thanh toán", value: 42, color: "#F59E0B" },
  { name: "Quá hạn", value: 8, color: "#EF4444" },
];

const recentActivities = [
  { type: "contract", text: "Hợp đồng #HD-2026-089 đã ký", time: "5 phút trước", color: "bg-primary-500" },
  { type: "payment", text: "Thanh toán 6.5tr từ căn A-1205", time: "12 phút trước", color: "bg-success-500" },
  { type: "maintenance", text: "Yêu cầu sửa chữa mới từ B-807", time: "30 phút trước", color: "bg-warning-500" },
  { type: "tenant", text: "Người thuê mới: Nguyễn Văn A", time: "1 giờ trước", color: "bg-info-500" },
  { type: "invoice", text: "Hóa đơn tháng 6 đã phát hành", time: "2 giờ trước", color: "bg-gray-400" },
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
    <div className="h-30 bg-white rounded-xl drop-shadow-lg p-4 md:p-8 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === "up" ? "text-success-600" : "text-danger-600"
              }`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon size={26} className={iconColor} />
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
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { email } = useAuthStore();
  const displayName = email?.split("@")[0] || "Admin";
  const [selectedBranch, setSelectedBranch] = useState("");

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

  // Tỷ lệ đã cho thuê
  const occupancyRate = Math.round((mockKPI.rentedApartments / mockKPI.totalApartments) * 100);

  return (
    <div className="space-y-6">
      {/* WELCOME SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hệ thống</p>
        </div>

        <div className="relative">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="">Tất cả chi nhánh</option>
            <option value="q1">Chi nhánh Quận 1</option>
            <option value="q7">Chi nhánh Quận 7</option>
          </select>
          <ChevronDown size={16} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* KPI CARDS - 12 cột (DashboardPack style) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Building2} label="Tổng tòa nhà" value={mockKPI.totalBuildings}
            iconColor="text-primary-600" iconBg="bg-primary-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Home} label="Tổng căn hộ" value={mockKPI.totalApartments.toLocaleString()}
            trend="up" trendValue="+2.5%"
            iconColor="text-info-600" iconBg="bg-info-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Users} label="Người thuê" value={mockKPI.totalTenants}
            trend="up" trendValue="+8.2%"
            iconColor="text-success-600" iconBg="bg-success-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={DollarSign} label="Doanh thu tháng" value={formatCurrency(mockKPI.monthlyRevenue)}
            trend="up" trendValue="+6.5%"
            iconColor="text-warning-600" iconBg="bg-warning-50" />
        </div>
      </div>

      {/* ROW 2: Occupancy rate + KPI nhỏ - 12 cột */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Home} label="Tỷ lệ đã cho thuê" value={`${occupancyRate}%`}
            iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Home} label="Còn trống" value={mockKPI.availableApartments}
            iconColor="text-gray-500" iconBg="bg-gray-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={FileText} label="HĐ sắp hết hạn" value={mockKPI.expiringContracts}
            iconColor="text-orange-600" iconBg="bg-orange-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Wrench} label="Yêu cầu sửa chữa" value={mockKPI.pendingMaintenance}
            trend="down" trendValue="-12%"
            iconColor="text-danger-600" iconBg="bg-danger-50" />
        </div>
      </div>

      {/* CHARTS ROW - 12 cột */}
      <div className="grid grid-cols-12 gap-6">
        {/* Revenue chart - chiếm 8 cột */}
        <div className="col-span-12 lg:col-span-8">
          <ChartCard title="Doanh thu theo tháng" subtitle="So sánh với cùng kỳ năm ngoái"
            action={<TrendingUp size={18} className="text-success-500" />}>
            <ResponsiveContainer width="100%" height={280} debounce={150}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000000).toFixed(1)}tỷ`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
                <Area type="monotone" dataKey="lastYear" stroke="#E5E7EB" strokeWidth={1.5} fill="transparent" name="Năm trước" />
                <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5}
                  fill="url(#gradientRevenue)" name="Năm nay" dot={{ fill: "#7C3AED", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Invoice pie - 4 cột */}
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Trạng thái hóa đơn" subtitle="Tháng hiện tại">
            <ResponsiveContainer width="100%" height={200} debounce={150}>
              <PieChart>
                <Pie data={invoiceData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80} paddingAngle={4}>
                  {invoiceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="space-y-2 mt-2">
              {invoiceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ROW: Bar chart + Activities - 12 cột */}
      <div className="grid grid-cols-12 gap-6">
        {/* Occupancy bar chart */}
        <div className="col-span-12 lg:col-span-6">
          <ChartCard title="Tỷ lệ đã cho thuê theo tòa nhà" subtitle="Phần trăm (%)">
            <ResponsiveContainer width="100%" height={250} debounce={150}>
              <BarChart data={occupancyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9CA3AF"
                  tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={80} />
                <Tooltip formatter={(value: any) => [`${value}%`, ""]} />
                <Bar dataKey="occupied" fill="#7C3AED" name="Đã thuê" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent activities */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Hoạt động gần đây</h3>
                <p className="text-xs text-gray-400 mt-0.5">Cập nhật realtime</p>
              </div>
              <button className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 cursor-pointer">
                Xem tất cả <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  {/* Timeline dot */}
                  <div className="relative mt-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${activity.color}`} />
                    {i < recentActivities.length - 1 && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8 bg-gray-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}