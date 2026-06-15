import { TrendingUp } from "lucide-react";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  getMonthlyRevenueData,
  getOccupancyData,
  getContractStatusData,
} from "../../../data/dashboard";
import { formatCurrency } from "../../../utils/format";

// Du lieu tang truong nguoi thue
const tenantGrowthData = [
  { month: "01/2026", count: 6 },
  { month: "02/2026", count: 7 },
  { month: "03/2026", count: 8 },
  { month: "04/2026", count: 8 },
  { month: "05/2026", count: 9 },
  { month: "06/2026", count: 10 },
];

import { useAuthStore } from "../../../stores/auth.store";
import { mockUsers } from "../../../data/users";
import { mockBuildings } from "../../../data/buildings";

// Trang bao cao thong ke
export default function ReportDashboard() {
  const { role, email } = useAuthStore();
  const currentUser = mockUsers.find((u) => u.email === email);
  const managerBuildingId = currentUser?.managedBuildingId;

  const revenueData = getMonthlyRevenueData();
  const rawOccupancyData = getOccupancyData();
  const contractData = getContractStatusData();

  const occupancyData = (() => {
    if (role === "MANAGER" && managerBuildingId) {
      const bldName = mockBuildings.find(b => b.id === managerBuildingId)?.name;
      return rawOccupancyData.filter(d => d.name === bldName);
    }
    return rawOccupancyData;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Báo cáo thống kê"
        subtitle={role === "MANAGER" ? "Phân tích và theo dõi số liệu tòa nhà của bạn" : "Phân tích và theo dõi số liệu toàn hệ thống"}
        iconColor="linear-gradient(135deg, #3B82F6, #8B5CF6)"
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Doanh thu theo thang */}
        <Card className="col-span-12 lg:col-span-6">
          <h3 className="font-semibold text-gray-800 mb-4">Doanh thu theo thang</h3>
          <ResponsiveContainer width="100%" height={280} debounce={150}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), "Doanh thu"]} />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="#EDE9FE" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Ty le lap day */}
        <Card className="col-span-12 lg:col-span-6">
          <h3 className="font-semibold text-gray-800 mb-4">Ty le lap day theo toa nha</h3>
          <ResponsiveContainer width="100%" height={280} debounce={150}>
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Bar dataKey="occupied" fill="#7C3AED" name="Da thue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vacant" fill="#E5E7EB" name="Con trong" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tang truong nguoi thue */}
        <Card className="col-span-12 lg:col-span-6">
          <h3 className="font-semibold text-gray-800 mb-4">Tang truong nguoi thue</h3>
          <ResponsiveContainer width="100%" height={280} debounce={150}>
            <LineChart data={tenantGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 4 }} name="Nguoi thue" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Tinh trang hop dong */}
        <Card className="col-span-12 lg:col-span-6">
          <h3 className="font-semibold text-gray-800 mb-4">Trang thai hop dong</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220} debounce={150}>
              <PieChart>
                <Pie data={contractData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                  {contractData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {contractData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
