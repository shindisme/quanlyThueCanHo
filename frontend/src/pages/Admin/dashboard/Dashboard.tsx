import {
  Building2, Home, Users, DollarSign, FileText, Wrench,
  TrendingUp, TrendingDown, ChevronDown, ArrowUpRight, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../../stores/auth.store";
import Combobox from "../../../components/ui/Combobox";
import * as buildingService from "../../../services/buildingService";
import type { BuildingData } from "../../../services/buildingService";
import * as apartmentService from "../../../services/apartmentService";
import * as tenantService from "../../../services/tenantService";
import * as contractService from "../../../services/contractService";
import * as scheduleService from "../../../services/scheduleService";

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
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend === "up" ? "text-success-600" : "text-danger-600"
              }`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={22} className={iconColor} />
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
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

  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bRes, aptRes, tRes, cRes, sRes] = await Promise.all([
          buildingService.getAllBuildings({ limit: 1000 }),
          apartmentService.getAllApartments({ limit: 1000 }),
          tenantService.getAllTenants({ limit: 1000 }),
          contractService.getAllContracts(),
          scheduleService.getSchedules()
        ]);

        setBuildings(bRes.data || []);
        setApartments(aptRes.data || []);
        setTenants(tRes.data || []);
        setContracts(cRes || []);
        setSchedules(sRes.data || []);
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

  const totalBuildingsCount = filteredBuildings.length;
  const totalApartmentsCount = filteredApartments.length;

  const rentedApts = filteredApartments.filter(a => a.status === "RENTED");
  const availableApts = filteredApartments.filter(a => a.status === "AVAILABLE");
  const maintenanceApts = filteredApartments.filter(a => a.status === "MAINTENANCE");

  const rentedCount = rentedApts.length;
  const availableCount = availableApts.length;
  const maintenanceCount = maintenanceApts.length;

  const occupancyRate = totalApartmentsCount > 0 ? Math.round((rentedCount / totalApartmentsCount) * 100) : 0;

  // Filter active contracts in selected building apartments
  const activeContracts = contracts.filter(c => {
    const isRoomInBuilding = !branchId || filteredApartments.some(a => a.id === c.apartment_id);
    return c.status === "ACTIVE" && isRoomInBuilding;
  });

  // Unique tenant count in building
  const buildingTenantIds = new Set(activeContracts.map(c => c.tenant_id));
  const activeTenantsCount = branchId ? buildingTenantIds.size : tenants.length;

  // Monthly revenue
  const monthlyRevenue = activeContracts.reduce((sum, c) => sum + Number(c.monthly_rent), 0);

  // Expiring contracts within next 30 days
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const expiringContractsCount = activeContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= thirtyDaysLater;
  }).length;

  // Pending schedules in selected building
  const pendingSchedulesCount = schedules.filter(s => {
    const matchesBuilding = !branchId || s.apartment?.building_id === branchId;
    return s.status === "PENDING" && matchesBuilding;
  }).length;

  // Revenue chart data (mocked baseline with actual scale modifier)
  const baseRevenueFactor = monthlyRevenue > 0 ? monthlyRevenue : 450000000;
  const revenueData = [
    { month: "T1", revenue: Math.round(baseRevenueFactor * 0.7), lastYear: Math.round(baseRevenueFactor * 0.6) },
    { month: "T2", revenue: Math.round(baseRevenueFactor * 0.8), lastYear: Math.round(baseRevenueFactor * 0.65) },
    { month: "T3", revenue: Math.round(baseRevenueFactor * 0.75), lastYear: Math.round(baseRevenueFactor * 0.7) },
    { month: "T4", revenue: Math.round(baseRevenueFactor * 0.9), lastYear: Math.round(baseRevenueFactor * 0.8) },
    { month: "T5", revenue: Math.round(baseRevenueFactor * 0.95), lastYear: Math.round(baseRevenueFactor * 0.85) },
    { month: "T6", revenue: baseRevenueFactor, lastYear: Math.round(baseRevenueFactor * 0.9) },
  ];

  const invoiceData = [
    { name: "Đã thanh toán", value: rentedCount, color: "#10B981" },
    { name: "Chưa thanh toán", value: Math.round(rentedCount * 0.2), color: "#F59E0B" },
    { name: "Quá hạn", value: Math.round(rentedCount * 0.05), color: "#EF4444" },
  ];

  const recentActivities = [
    { text: `Hệ thống ghi nhận ${rentedCount} căn hộ đã thuê`, time: "Vừa xong", color: "bg-primary-500" },
    { text: `Cơ cấu phòng: ${availableCount} trống, ${maintenanceCount} bảo trì`, time: "Hôm nay", color: "bg-success-500" },
    { text: `Có ${pendingSchedulesCount} lịch hẹn khách hàng chờ xử lý`, time: "Gần đây", color: "bg-warning-500" },
    { text: `Có ${expiringContractsCount} hợp đồng sắp hết hạn trong 30 ngày`, time: "Mới cập nhật", color: "bg-info-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* WELCOME SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hệ thống</p>
        </div>

        <div>
          <Combobox
            options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
            value={selectedBranch}
            onChange={setSelectedBranch}
            placeholder="Tất cả chi nhánh"
            className="w-56"
            triggerClassName="h-10 border-gray-300 px-4 py-2.5 bg-white"
            clearable={true}
          />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-12 gap-6">
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
          <StatCard icon={DollarSign} label="Doanh thu tháng (ước tính)" value={formatCurrency(monthlyRevenue)}
            iconColor="text-warning-600" iconBg="bg-warning-50" />
        </div>
      </div>

      {/* ROW 2: Occupancy info */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Home} label="Tỷ lệ lấp đầy" value={`${occupancyRate}%`}
            iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Home} label="Phòng trống" value={availableCount}
            iconColor="text-gray-500" iconBg="bg-gray-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={FileText} label="HĐ sắp hết hạn" value={expiringContractsCount}
            iconColor="text-orange-600" iconBg="bg-orange-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard icon={Wrench} label="Lịch chờ xác nhận" value={pendingSchedulesCount}
            iconColor="text-danger-600" iconBg="bg-danger-50" />
        </div>
      </div>

    </div>
  );
}