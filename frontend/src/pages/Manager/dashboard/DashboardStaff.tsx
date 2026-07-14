import {
  Home, Users, Wrench, CalendarDays, Clock, AlertCircle
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
import { useDashboardStaff } from "./hooks/useDashboardStaff";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

function StatCard({ icon: Icon, label, value, iconColor, iconBg }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="border bg-white border-gray-200 p-5 shadow-lg hover:shadow-xl rounded-none h-full flex flex-col justify-between transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide mb-2 text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-none flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 p-5 shadow-lg rounded-none h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardStaff() {
  const {
    displayName,
    managedBuildingId,
    apartments,
    tenants,
    contracts,
    schedules,
    maintenanceRequests,
    isLoading
  } = useDashboardStaff();

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Filter apartments in staff's building
  const buildingApartments = managedBuildingId
    ? apartments.filter(a => a.building_id === managedBuildingId)
    : apartments;

  const totalApartmentsCount = buildingApartments.length;

  const rentedCount = buildingApartments.filter(a => a.status === "RENTED").length;
  const availableCount = buildingApartments.filter(a => a.status === "AVAILABLE").length;
  const maintenanceCount = buildingApartments.filter(a => a.status === "MAINTENANCE").length;

  // Filter active contracts
  const buildingContracts = contracts.filter(c => {
    const isRoomInBuilding = buildingApartments.some(a => a.id === c.apartment_id);
    return c.status === "ACTIVE" && isRoomInBuilding;
  });

  // Unique tenants in building
  const buildingTenantIds = new Set(buildingContracts.map(c => c.tenant_id));
  const activeTenantsCount = managedBuildingId ? buildingTenantIds.size : tenants.length;

  // Expiring contracts within next 30 days
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const expiringContractsCount = buildingContracts.filter(c => {
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= thirtyDaysLater;
  }).length;

  // Pending schedules in staff's building
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
        <p className="text-sm text-gray-500 mt-1">Tổng quan công việc vận hành</p>
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
          <StatCard icon={Wrench} label="Sự cố đang xử lý" value={processingMaintenanceRequests}
            iconColor="text-orange-600" iconBg="bg-orange-50" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* Left panel: Maintenance Table */}
        <div className="col-span-12 lg:col-span-8">
          <ChartCard
            title="Yêu cầu sửa chữa cần xử lý"
            subtitle="Các sự cố mới nhận hoặc đang tiến hành cần kiểm tra"
          >
            {(() => {
              const unresolvedRequests = maintenanceRequests
                .filter(r => r.status === "PENDING" || r.status === "PROCESSING" || r.status === "NEEDS_RESCHEDULE")
                .slice(0, 5);

              if (unresolvedRequests.length === 0) {
                return (
                  <div className="text-center py-16 text-gray-400 font-sans text-sm">
                    Không có yêu cầu sửa chữa nào cần xử lý.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto min-h-[280px]">
                  <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm font-sans">
                    <thead>
                      <tr className="text-left text-gray-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 pt-2">Căn hộ</th>
                        <th className="pb-3 pt-2">Sự cố</th>
                        <th className="pb-3 pt-2">Mức độ</th>
                        <th className="pb-3 pt-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {unresolvedRequests.map((req) => {
                        const aptLabel = req.apartment ? `P.${req.apartment.room_number}` : `Căn hộ #${req.apartment_id}`;
                        const priorityLabel = req.priority === "HIGH" ? "Cao" : req.priority === "MEDIUM" ? "Trung bình" : "Thấp";
                        const priorityColor = req.priority === "HIGH" ? "text-red-600 bg-red-50 border border-red-200" : req.priority === "MEDIUM" ? "text-amber-600 bg-amber-50 border border-amber-200" : "text-gray-650 bg-gray-50 border border-gray-200";
                        
                        const statusLabel = req.status === "PENDING" ? "Mới tạo" : req.status === "PROCESSING" ? "Đang xử lý" : "Hẹn lại lịch";
                        const statusBg = req.status === "PENDING" ? "bg-amber-100 text-amber-800" : req.status === "PROCESSING" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800";
                        
                        return (
                          <tr key={req.id} className="hover:bg-gray-50/50">
                            <td className="py-3 font-semibold text-gray-800">{aptLabel}</td>
                            <td className="py-3 font-medium text-gray-700">
                              <div className="font-semibold text-gray-800 truncate max-w-[200px]" title={req.title}>{req.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[250px]" title={req.description}>{req.description}</div>
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColor}`}>
                                {priorityLabel}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusBg}`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
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
