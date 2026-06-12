import {
  Home, Users, DollarSign, FileText, Wrench,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import { useAuthStore } from "../../stores/auth.store";
import { mockBuildings } from "../../data/buildings";
import { getDashboardKPI, getInvoiceStatusData } from "../../data/dashboard";
import { mockContracts } from "../../data/contracts";
import { mockMaintenanceRequests } from "../../data/maintenance";
import { mockTenants } from "../../data/tenants";
import { mockApartments } from "../../data/apartments";
import { formatCurrency, formatDate, formatRelativeTime } from "../../utils/format";
import {
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
  REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS,
  PRIORITY_LABELS,
} from "../../constants/enums";
import type { ContractStatus, RequestStatus, Priority } from "../../constants/enums";

// Du lieu doanh thu gia cho toa nha cua Manager
const managerRevenueData = [
  { month: "01/2026", revenue: 40000000 },
  { month: "02/2026", revenue: 42000000 },
  { month: "03/2026", revenue: 45000000 },
  { month: "04/2026", revenue: 43000000 },
  { month: "05/2026", revenue: 48000000 },
  { month: "06/2026", revenue: 50000000 },
];

// Dashboard cho Manager - chi hien thi du lieu cua toa nha dang quan ly
export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const buildingId = user?.managedBuildingId || 1;
  const building = mockBuildings.find((b) => b.id === buildingId);
  const kpi = getDashboardKPI(buildingId);
  const invoiceData = getInvoiceStatusData();

  // Loc du lieu theo toa nha
  const buildingApts = mockApartments.filter((a) => a.building_id === buildingId);
  const buildingContracts = mockContracts.filter((c) =>
    buildingApts.some((a) => a.id === c.apartment_id)
  );
  const buildingMaintenance = mockMaintenanceRequests.filter((r) =>
    buildingApts.some((a) => a.id === r.apartment_id)
  );

  const kpiCards = [
    { label: "Tong can ho", value: kpi.totalApartments, icon: Home, color: "text-info-600", bg: "bg-info-50" },
    { label: "Dang cho thue", value: kpi.rentedApartments, icon: Home, color: "text-success-600", bg: "bg-success-50" },
    { label: "Con trong", value: kpi.availableApartments, icon: Home, color: "text-warning-600", bg: "bg-warning-50" },
    { label: "Nguoi thue", value: kpi.totalTenants, icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Doanh thu thang", value: formatCurrency(kpi.monthlyRevenue), icon: DollarSign, color: "text-success-600", bg: "bg-success-50" },
    { label: "Yeu cau sua chua", value: kpi.pendingMaintenance, icon: Wrench, color: "text-danger-500", bg: "bg-danger-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Tieu de - hien thi ten toa nha dang quan ly */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Quan ly toa nha: <span className="text-primary-600 font-semibold">{building?.name || "Khong xac dinh"}</span>
          {building && <span className="text-gray-400"> - {building.address}</span>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="flex items-center gap-4">
              <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className={item.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-gray-800">{item.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bieu do */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Doanh thu theo thang</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={managerRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), "Doanh thu"]} />
              <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: "#7C3AED", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Trang thai hoa don</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={invoiceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {invoiceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {invoiceData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bang du lieu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Hop dong moi nhat</h3>
          <div className="space-y-3">
            {buildingContracts.slice(-5).reverse().map((c) => {
              const tenant = mockTenants.find((t) => t.id === c.tenant_id);
              const apt = mockApartments.find((a) => a.id === c.apartment_id);
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tenant?.full_name}</p>
                    <p className="text-xs text-gray-400">{apt?.apartment_code} - {formatDate(c.created_at)}</p>
                  </div>
                  <Badge variant={CONTRACT_STATUS_COLORS[c.status as ContractStatus] as "success" | "gray" | "danger"}>
                    {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
                  </Badge>
                </div>
              );
            })}
            {buildingContracts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Chua co hop dong</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Yeu cau sua chua</h3>
          <div className="space-y-3">
            {buildingMaintenance.slice(0, 5).map((req) => {
              const tenant = mockTenants.find((t) => t.id === req.tenant_id);
              return (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{req.title}</p>
                    <p className="text-xs text-gray-400">{tenant?.full_name} - {PRIORITY_LABELS[req.priority as Priority]}</p>
                  </div>
                  <Badge variant={REQUEST_STATUS_COLORS[req.status as RequestStatus] as "warning" | "info" | "success" | "gray"}>
                    {REQUEST_STATUS_LABELS[req.status as RequestStatus]}
                  </Badge>
                </div>
              );
            })}
            {buildingMaintenance.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Khong co yeu cau</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
