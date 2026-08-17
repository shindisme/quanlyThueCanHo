import { Link } from "react-router-dom";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { useDashboardManager } from "../hooks/useDashboardManager";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import StatCard from "../../../Admin/dashboard/components/StatCard";
import ChartCard from "../../../Admin/dashboard/components/ChartCard";
import ApartmentStatusChart from "../components/ApartmentStatusChart";
import RevenueAreaChart from "../components/RevenueAreaChart";
import ContractExpirationTracker from "../components/ContractExpirationTracker";
import OperationalTasksCard from "../components/OperationalTasksCard";
import Badge from "../../../../components/ui/Badge";
import { formatDashboardCurrency } from "../utils/dashboardHelpers";
import { parseGuestName } from "../../../../utils/string";
import RefreshButton from "../../../../components/ui/RefreshButton";
import {
  PRIORITY_CONFIG,
  REQUEST_STATUS_CONFIG,
  SCHEDULE_STATUS_CONFIG,
  type Priority,
  type RequestStatus,
  type ScheduleStatus,
} from "../../../../constants";

function getPriorityBadge(priority: string) {
  const config = PRIORITY_CONFIG[priority as Priority];
  return <Badge variant={config?.badge || "gray"}>{config?.label || priority}</Badge>;
}

function getRequestStatusBadge(status: string) {
  const config = REQUEST_STATUS_CONFIG[status as RequestStatus];
  return <Badge variant={config?.badge || "gray"}>{config?.label || status}</Badge>;
}

function getScheduleStatusBadge(status: string) {
  const config = SCHEDULE_STATUS_CONFIG[status as ScheduleStatus];
  return <Badge variant={config?.badge || "gray"}>{config?.label || status}</Badge>;
}

export default function DashboardManager() {
  const {
    displayName,
    managedBuildingName,
    isLoading,
    isError,
    today,
    timeFrame,
    setTimeFrame,
    currentYear,
    totalApartmentsCount,
    rentedCount,
    availableCount,
    maintenanceCount,
    occupancyRate,
    roomStatusData,
    activeTenantsCount,
    contractExpirations,
    revenueStats,
    chartData,
    pendingSchedulesCount,
    recentPendingSchedules,
    pendingMaintenanceRequests,
    unresolvedMaintenance,
    upcomingTasks,
    hasAlerts,
  } = useDashboardManager();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-sm text-red-600 bg-red-50 border border-red-200">
        Không thể tải toàn bộ dữ liệu thống kê bảng điều khiển. Vui lòng thử tải lại trang.
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header  */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tổng quan chi nhánh{managedBuildingName ? `: ${managedBuildingName}` : ""}
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Cảnh báo và nhắc nhở nghiệp vụ */}
      {hasAlerts && (
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert size={16} className="text-amber-600" />
            <span>Chú ý & Cảnh báo nghiệp vụ</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-amber-900 pt-1">
            {pendingSchedulesCount > 0 && (
              <Link
                to="/manager/schedules"
                className="flex items-center gap-1.5 hover:underline text-indigo-700 bg-indigo-100/70 px-2.5 py-1 border border-indigo-200"
              >
                <CalendarCheck size={14} />
                <span>
                  <strong>{pendingSchedulesCount}</strong> lịch xem phòng chờ duyệt
                </span>
              </Link>
            )}
            {pendingMaintenanceRequests > 0 && (
              <Link
                to="/manager/maintenance"
                className="flex items-center gap-1.5 hover:underline text-amber-800 bg-amber-100/70 px-2.5 py-1 border border-amber-200"
              >
                <Wrench size={14} />
                <span>
                  <strong>{pendingMaintenanceRequests}</strong> sự cố cần phân công / xử lý
                </span>
              </Link>
            )}
            {contractExpirations.expiring30Count > 0 && (
              <Link
                to="/manager/contracts"
                className="flex items-center gap-1.5 hover:underline text-orange-700 bg-orange-100/60 px-2.5 py-1 border border-orange-200/60"
              >
                <span>
                  <strong>{contractExpirations.expiring30Count}</strong> hợp đồng sắp hết hạn (30 ngày)
                </span>
              </Link>
            )}
            {revenueStats.unpaidInvoicesCount > 0 && (
              <Link
                to="/manager/invoices"
                className="flex items-center gap-1.5 hover:underline text-rose-700 bg-rose-100/60 px-2.5 py-1 border border-rose-200/60"
              >
                <span>
                  <strong>{revenueStats.unpaidInvoicesCount}</strong> hóa đơn chưa thu ({formatDashboardCurrency(revenueStats.unpaidRevenue)})
                </span>
              </Link>
            )}
            {maintenanceCount > 0 && (
              <Link
                to="/manager/apartments"
                className="flex items-center gap-1.5 hover:underline text-amber-700 bg-amber-100/60 px-2.5 py-1 border border-amber-200/60"
              >
                <Wrench size={14} />
                <span>
                  <strong>{maintenanceCount}</strong> căn hộ đang bảo trì
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Thao tác nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-gray-200 shadow-sm">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          Thao tác nhanh
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/manager/schedules"
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all flex items-center gap-1"
          >
            Duyệt lịch xem phòng
          </Link>
          <Link
            to="/manager/maintenance"
            className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center gap-1"
          >
            Phân công bảo trì
          </Link>
          <Link
            to="/manager/contracts"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Tạo hợp đồng
          </Link>
          <Link
            to="/manager/invoices"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Tạo hóa đơn
          </Link>
          <Link
            to="/manager/tenants"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Thêm cư dân
          </Link>
          <Link
            to="/manager/apartments"
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1"
          >
            Thêm căn hộ
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 items-stretch">
        {/* Tỷ lệ lấp đầy */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Tỷ lệ lấp đầy
                </p>
                <p className="text-2xl font-bold text-gray-900">{occupancyRate}%</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {rentedCount} / {totalApartmentsCount} căn ({availableCount} căn trống)
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Doanh thu tháng  */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            icon={DollarSign}
            label="Doanh thu tháng"
            value={formatDashboardCurrency(revenueStats.currentMonthRevenue)}
            trend={revenueStats.revenueTrend}
            trendValue={revenueStats.revenueTrendValue}
            iconColor="text-white"
            iconBg="bg-white/20"
            variant="green"
          />
        </div>

        {/* Tiền chưa thu */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <StatCard
            icon={AlertTriangle}
            label={`Tiền chưa thu (${revenueStats.unpaidInvoicesCount} HĐ)`}
            value={formatDashboardCurrency(revenueStats.unpaidRevenue)}
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

      {/* Biểu đồ doanh thu */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        <div className="col-span-12 lg:col-span-8">
          <RevenueAreaChart
            data={chartData}
            timeFrame={timeFrame}
            setTimeFrame={setTimeFrame}
            currentYear={currentYear}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ApartmentStatusChart data={roomStatusData} />
        </div>
      </div>

      {/* Bảng lịch xem phòng và sự cố bảo trì */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        <div className="col-span-12 lg:col-span-6">
          <ChartCard
            title="Lịch xem phòng gần đây"
            subtitle={`Có ${pendingSchedulesCount} lịch hẹn đang chờ quản lý xác nhận`}
            action={
              <Link
                to="/manager/schedules"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Xem tất cả <ArrowRight size={13} />
              </Link>
            }
          >
            {recentPendingSchedules.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Chưa có lịch hẹn xem phòng nào trong chi nhánh.
              </div>
            ) : (
              <div className="overflow-x-auto min-h-60">
                <table className="min-w-[620px] divide-y divide-gray-200 text-xs font-sans sm:text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pt-2">Khách hàng</th>
                      <th className="pb-3 pt-2">Căn hộ</th>
                      <th className="pb-3 pt-2">Ngày xem</th>
                      <th className="pb-3 pt-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {recentPendingSchedules.map((sch) => {
                      const roomStr = sch.apartment ? `P.${sch.apartment.floor}${sch.apartment.room_number}` : `Căn hộ #${sch.apartment_id}`;
                      const { name } = parseGuestName(sch.guest_name);

                      return (
                        <tr key={sch.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 font-semibold text-gray-800">
                            <div>{name}</div>
                            <div className="text-[11px] text-gray-400 font-normal">{sch.guest_phone}</div>
                          </td>
                          <td className="py-3 font-semibold text-gray-700">{roomStr}</td>
                          <td className="py-3 text-xs text-gray-500 font-medium">
                            {sch.schedule_time ? (
                              <span className="text-primary-600 font-semibold">
                                {new Date(sch.schedule_time).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              <span className="text-gray-400">Chưa hẹn ngày</span>
                            )}
                          </td>
                          <td className="py-3">{getScheduleStatusBadge(sch.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Sự cố & bảo trì cần xử lý */}
        <div className="col-span-12 lg:col-span-6">
          <ChartCard
            title="Sự cố & bảo trì cần xử lý"
            subtitle={`Có ${pendingMaintenanceRequests} sự cố đang chờ xử lý hoặc đang sửa chữa`}
            action={
              <Link
                to="/manager/maintenance"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Xem tất cả <ArrowRight size={13} />
              </Link>
            }
          >
            {unresolvedMaintenance.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Không có sự cố bảo trì nào cần xử lý ngay.
              </div>
            ) : (
              <div className="overflow-x-auto min-h-60">
                <table className="min-w-[560px] divide-y divide-gray-200 text-xs font-sans sm:text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pt-2">Căn hộ</th>
                      <th className="pb-3 pt-2">Sự cố</th>
                      <th className="pb-3 pt-2">Mức độ</th>
                      <th className="pb-3 pt-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {unresolvedMaintenance.map((req) => {
                      const roomStr = req.apartment ? `P.${req.apartment.floor}${req.apartment.room_number}` : `Phòng #${req.apartment_id}`;

                      return (
                        <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 font-semibold text-gray-800">{roomStr}</td>
                          <td className="py-3 font-medium text-gray-700">
                            <div className="font-semibold text-gray-800 truncate max-w-44" title={req.title}>
                              {req.title}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-52" title={req.description}>
                              {req.description}
                            </div>
                          </td>
                          <td className="py-3">{getPriorityBadge(req.priority)}</td>
                          <td className="py-3">{getRequestStatusBadge(req.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Theo dõi thời hạn hợp đồng */}
      <ContractExpirationTracker
        expiredCount={contractExpirations.expiredCount}
        expiring30Count={contractExpirations.expiring30Count}
        expiring60Count={contractExpirations.expiring60Count}
        expiring90Count={contractExpirations.expiring90Count}
        contractsRoute="/manager/contracts"
      />

      <OperationalTasksCard tasks={upcomingTasks} />
    </div>
  );
}
