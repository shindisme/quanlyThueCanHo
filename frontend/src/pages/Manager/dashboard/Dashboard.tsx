import {
  Home, Users, DollarSign, Wrench, TrendingUp, TrendingDown,
  ArrowUpRight, CalendarDays, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../../stores/auth.store";
import * as buildingService from "../../../services/buildingService";
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === "up" ? "text-success-600" : "text-danger-600"
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
  const { email, managedBuildingId, managedBuildingName } = useAuthStore();
  const displayName = email?.split("@")[0] || "Quản lý";

  const [apartments, setApartments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [aptRes, tRes, cRes, sRes] = await Promise.all([
          apartmentService.getAllApartments({ limit: 1000 }),
          tenantService.getAllTenants({ limit: 1000 }),
          contractService.getAllContracts(),
          scheduleService.getSchedules()
        ]);

        setApartments(aptRes.data || []);
        setTenants(tRes.data || []);
        setContracts(cRes || []);
        setSchedules(sRes.data || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard quản lý:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function formatCurrency(amount: number) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(0) + " tr";
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Filter apartments in manager's building
  const buildingApartments = managedBuildingId
    ? apartments.filter(a => a.building_id === managedBuildingId)
    : apartments;

  const totalApartmentsCount = buildingApartments.length;

  const rentedApts = buildingApartments.filter(a => a.status === "RENTED");
  const availableApts = buildingApartments.filter(a => a.status === "AVAILABLE");
  const maintenanceApts = buildingApartments.filter(a => a.status === "MAINTENANCE");

  const rentedCount = rentedApts.length;
  const availableCount = availableApts.length;
  const maintenanceCount = maintenanceApts.length;

  const occupancyRate = totalApartmentsCount > 0 ? Math.round((rentedCount / totalApartmentsCount) * 100) : 0;

  // Filter active contracts in manager's building
  const buildingContracts = contracts.filter(c => {
    const isRoomInBuilding = buildingApartments.some(a => a.id === c.apartment_id);
    return c.status === "ACTIVE" && isRoomInBuilding;
  });

  // Unique tenants in building
  const buildingTenantIds = new Set(buildingContracts.map(c => c.tenant_id));
  const activeTenantsCount = managedBuildingId ? buildingTenantIds.size : tenants.length;

  // Monthly revenue
  const monthlyRevenue = buildingContracts.reduce((sum, c) => sum + Number(c.monthly_rent), 0);

  // Expiring contracts within next 30 days
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const expiringContractsCount = buildingContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= thirtyDaysLater;
  }).length;

  // Pending schedules in manager's building
  const pendingSchedulesCount = schedules.filter(s => {
    const matchesBuilding = !managedBuildingId || s.apartment?.building_id === managedBuildingId;
    return s.status === "PENDING" && matchesBuilding;
  }).length;

  // Revenue chart data (mocked baseline with actual scale modifier)
  const baseRevenueFactor = monthlyRevenue > 0 ? monthlyRevenue : 150000000;
  const revenueData = [
    { month: "T1", revenue: Math.round(baseRevenueFactor * 0.8) },
    { month: "T2", revenue: Math.round(baseRevenueFactor * 0.85) },
    { month: "T3", revenue: Math.round(baseRevenueFactor * 0.9) },
    { month: "T4", revenue: Math.round(baseRevenueFactor * 0.95) },
    { month: "T5", revenue: baseRevenueFactor },
    { month: "T6", revenue: baseRevenueFactor },
  ];

  const apartmentStatus = [
    { name: "Đang thuê", value: rentedCount, color: "#7C3AED" },
    { name: "Còn trống", value: availableCount, color: "#E5E7EB" },
    { name: "Bảo trì", value: maintenanceCount, color: "#F59E0B" },
  ];

  const upcomingTasks = [
    { text: `Kiểm tra căn hộ sắp hết hạn (${expiringContractsCount} HĐ)`, time: "Tuần này", urgent: expiringContractsCount > 0 },
    { text: `Xử lý lịch hẹn xem phòng (${pendingSchedulesCount} lịch chờ)`, time: "Hôm nay", urgent: pendingSchedulesCount > 0 },
    { text: "Bảo trì định kỳ hệ thống điện nước hành lang", time: "Thứ 5", urgent: false },
    { text: "Ghi nhận chỉ số điện nước định kỳ cuối tháng", time: "Hàng tháng", urgent: false },
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
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-800">
          Xin chào, <span className="text-primary-600">{displayName}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tổng quan chi nhánh: <span className="font-semibold text-primary-700">{managedBuildingName || "Tòa nhà chưa gán"}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Tổng căn hộ" value={totalApartmentsCount}
            iconColor="text-primary-600" iconBg="bg-primary-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label={`Đang thuê (${occupancyRate}%)`} value={rentedCount}
            trend={occupancyRate > 70 ? "up" : "down"} trendValue={`${occupancyRate}%`}
            iconColor="text-success-600" iconBg="bg-success-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Users} label="Người thuê" value={activeTenantsCount}
            iconColor="text-info-600" iconBg="bg-info-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={DollarSign} label="Doanh thu tháng (ước tính)" value={formatCurrency(monthlyRevenue)}
            iconColor="text-warning-600" iconBg="bg-warning-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Home} label="Còn trống" value={availableCount}
            iconColor="text-gray-500" iconBg="bg-gray-50" />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <StatCard icon={Wrench} label="Lịch chờ xác nhận" value={pendingSchedulesCount}
            iconColor="text-danger-600" iconBg="bg-danger-50" />
        </div>
      </div>

    </div>
  );
}
