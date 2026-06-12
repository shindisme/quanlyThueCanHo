import { useState } from "react";
import {
  Building2,
  Home,
  Users,
  DollarSign,
  FileText,
  Wrench,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import Card from "../../components/common/ui/Card";
import Badge from "../../components/common/ui/Badge";
import {
  getDashboardKPI,
  getMonthlyRevenueData,
  getOccupancyData,
  getInvoiceStatusData,
  getContractStatusData,
} from "../../data/dashboard";
import { getBranchNames, mockBuildings } from "../../data/buildings";
import { mockContracts } from "../../data/contracts";
import { mockInvoices } from "../../data/invoices";
import { mockMaintenanceRequests } from "../../data/maintenance";
import { mockTenants } from "../../data/tenants";
import { mockApartments } from "../../data/apartments";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS,
  PRIORITY_LABELS,
} from "../../constants/enums";
import type { ContractStatus, InvoiceStatus, RequestStatus, Priority } from "../../constants/enums";

// Admin Dashboard - hien thi KPI, bieu do, va bang du lieu
export default function Dashboard() {
  // Loc theo chi nhanh toa nha
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const branches = getBranchNames();

  // Loc building theo branch
  const filteredBuildingIds = selectedBranch
    ? mockBuildings.filter((b) => b.branchName === selectedBranch).map((b) => b.id)
    : undefined;

  // Neu chon 1 chi nhanh, tinh KPI cho cac building trong chi nhanh do
  // Neu chon "Tat ca", tinh KPI toan he thong
  const kpi = selectedBranch
    ? filteredBuildingIds?.reduce(
        (acc, buildingId) => {
          const buildingKpi = getDashboardKPI(buildingId);
          return {
            totalBuildings: acc.totalBuildings + buildingKpi.totalBuildings,
            totalApartments: acc.totalApartments + buildingKpi.totalApartments,
            rentedApartments: acc.rentedApartments + buildingKpi.rentedApartments,
            availableApartments: acc.availableApartments + buildingKpi.availableApartments,
            totalTenants: acc.totalTenants + buildingKpi.totalTenants,
            monthlyRevenue: acc.monthlyRevenue + buildingKpi.monthlyRevenue,
            expiringContracts: acc.expiringContracts + buildingKpi.expiringContracts,
            pendingMaintenance: acc.pendingMaintenance + buildingKpi.pendingMaintenance,
          };
        },
        {
          totalBuildings: 0, totalApartments: 0, rentedApartments: 0,
          availableApartments: 0, totalTenants: 0, monthlyRevenue: 0,
          expiringContracts: 0, pendingMaintenance: 0,
        }
      ) || getDashboardKPI()
    : getDashboardKPI();

  const revenueData = getMonthlyRevenueData();
  const occupancyData = getOccupancyData();
  const invoiceStatusData = getInvoiceStatusData();
  const contractStatusData = getContractStatusData();

  // 8 the KPI
  const kpiCards = [
    { label: "Tong toa nha", value: kpi.totalBuildings, icon: Building2, color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Tong can ho", value: kpi.totalApartments, icon: Home, color: "text-info-600", bg: "bg-info-50" },
    { label: "Dang cho thue", value: kpi.rentedApartments, icon: Home, color: "text-success-600", bg: "bg-success-50" },
    { label: "Con trong", value: kpi.availableApartments, icon: Home, color: "text-warning-600", bg: "bg-warning-50" },
    { label: "Nguoi thue", value: kpi.totalTenants, icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Doanh thu thang", value: formatCurrency(kpi.monthlyRevenue), icon: DollarSign, color: "text-success-600", bg: "bg-success-50", isLarge: true },
    { label: "HD sap het han", value: kpi.expiringContracts, icon: FileText, color: "text-warning-600", bg: "bg-warning-50" },
    { label: "Yeu cau sua chua", value: kpi.pendingMaintenance, icon: Wrench, color: "text-danger-500", bg: "bg-danger-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Tieu de + Dropdown loc chi nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">Tong quan he thong quan ly can ho</p>
        </div>

        <div className="relative">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm bg-white text-gray-700 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="">Tat ca chi nhanh</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="flex items-center gap-4">
              <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className={item.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-gray-800">
                  {item.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bieu do */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Doanh thu theo thang - Line chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Doanh thu theo thang</h3>
            <TrendingUp size={18} className="text-success-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), "Doanh thu"]} />
              <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} dot={{ fill: "#7C3AED", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Ty le lap day - Bar chart */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Ty le lap day theo toa nha</h3>
          <ResponsiveContainer width="100%" height={250}>
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

        {/* Trang thai hoa don - Pie chart */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Trang thai hoa don</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {invoiceStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Trang thai hop dong - Pie chart */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Trang thai hop dong</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={contractStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {contractStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {contractStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bang du lieu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Hop dong moi nhat */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Hop dong moi nhat</h3>
          <div className="space-y-3">
            {mockContracts.slice(-5).reverse().map((contract) => {
              const tenant = mockTenants.find((t) => t.id === contract.tenant_id);
              const apt = mockApartments.find((a) => a.id === contract.apartment_id);
              return (
                <div key={contract.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tenant?.full_name}</p>
                    <p className="text-xs text-gray-400">{apt?.apartment_code} - {formatDate(contract.created_at)}</p>
                  </div>
                  <Badge variant={CONTRACT_STATUS_COLORS[contract.status as ContractStatus] as "success" | "gray" | "danger"}>
                    {CONTRACT_STATUS_LABELS[contract.status as ContractStatus]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Hoa don moi nhat */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Hoa don moi nhat</h3>
          <div className="space-y-3">
            {mockInvoices.slice(0, 5).map((invoice) => {
              const tenant = mockTenants.find((t) => t.id === invoice.tenant_id);
              return (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{invoice.invoice_code}</p>
                    <p className="text-xs text-gray-400">{tenant?.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(invoice.total_amount)}</p>
                    <Badge variant={INVOICE_STATUS_COLORS[invoice.status as InvoiceStatus] as "success" | "warning" | "danger"}>
                      {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Yeu cau sua chua gan day */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Yeu cau sua chua gan day</h3>
          <div className="space-y-3">
            {mockMaintenanceRequests.slice(0, 5).map((req) => {
              const tenant = mockTenants.find((t) => t.id === req.tenant_id);
              return (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{req.title}</p>
                    <p className="text-xs text-gray-400">
                      {tenant?.full_name} - {PRIORITY_LABELS[req.priority as Priority]}
                    </p>
                  </div>
                  <Badge variant={REQUEST_STATUS_COLORS[req.status as RequestStatus] as "warning" | "info" | "success" | "gray"}>
                    {REQUEST_STATUS_LABELS[req.status as RequestStatus]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}