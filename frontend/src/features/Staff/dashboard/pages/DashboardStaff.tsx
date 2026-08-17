import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Clock,
  CheckCircle,
  Play,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { useDashboardStaff } from "../hooks/useDashboardStaff";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import ChartCard from "../../../Admin/dashboard/components/ChartCard";
import DashboardStatGrid from "../components/DashboardStatGrid";
import ApartmentStatusChart from "../../../Manager/dashboard/components/ApartmentStatusChart";
import OperationalTasksCard from "../../../Manager/dashboard/components/OperationalTasksCard";
import Badge from "../../../../components/ui/Badge";
import {
  PRIORITY_CONFIG,
  REQUEST_STATUS_CONFIG,
  type Priority,
  type RequestStatus,
} from "../../../../constants";

const ACTIVE_MAINTENANCE_STATUSES: ReadonlySet<RequestStatus> = new Set([
  "PENDING",
  "PROCESSING",
  "NEEDS_RESCHEDULE",
]);

function getPriorityBadge(priority: string) {
  const config = PRIORITY_CONFIG[priority as Priority];
  return <Badge variant={config?.badge || "gray"}>{config?.label || priority}</Badge>;
}

function getStatusBadge(status: string) {
  const config = REQUEST_STATUS_CONFIG[status as RequestStatus];
  return <Badge variant={config?.badge || "gray"}>{config?.label || status}</Badge>;
}

export default function DashboardStaff() {
  const {
    displayName,
    apartments,
    contracts,
    schedules,
    maintenanceRequests,
    isLoading,
    isError,
    currentStaff,
    role,
  } = useDashboardStaff();

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => {
    return now.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [now]);

  const maintenanceUrl = role === "STAFF" ? "/staff/maintenance" : "/manager/maintenance";
  const isTechnician = role === "STAFF" || currentStaff?.position === "Kỹ thuật";

  // Lọc task được phân công cho nhân viên hiện tại
  const myTasks = useMemo(() => {
    if (!isTechnician || !currentStaff) return [];
    return maintenanceRequests.filter(
      (r) => r.assigned_staff_id === currentStaff.id || r.assigned_staff?.id === currentStaff.id
    );
  }, [isTechnician, currentStaff, maintenanceRequests]);

  // Thống kê task theo từng trạng thái
  const taskStats = useMemo(() => {
    const stats = { all: 0, pending: 0, processing: 0, done: 0 };
    for (const task of myTasks) {
      if (task.status !== "CANCELLED") stats.all++;
      if (task.status === "PENDING") stats.pending++;
      if (task.status === "PROCESSING") stats.processing++;
      if (task.status === "DONE") stats.done++;
    }
    return stats;
  }, [myTasks]);

  const attentionTasks = useMemo(() => {
    const priorityRank: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return myTasks
      .filter((t) => ACTIVE_MAINTENANCE_STATUSES.has(t.status as RequestStatus))
      .sort((a, b) => {
        const pDiff = (priorityRank[b.priority as Priority] || 0) - (priorityRank[a.priority as Priority] || 0);
        if (pDiff !== 0) return pDiff;
        if (a.scheduled_at && b.scheduled_at) {
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5);
  }, [myTasks]);

  const totalApartmentsCount = apartments.length;
  const rentedCount = apartments.filter((a) => a.status === "RENTED").length;
  const availableCount = apartments.filter((a) => a.status === "AVAILABLE").length;
  const maintenanceCount = apartments.filter((a) => a.status === "MAINTENANCE").length;

  const apartmentIds = useMemo(() => new Set(apartments.map((a) => a.id)), [apartments]);
  const buildingContracts = useMemo(
    () => contracts.filter((c) => c.status === "ACTIVE" && apartmentIds.has(c.apartment_id)),
    [contracts, apartmentIds]
  );
  const activeTenantsCount = useMemo(() => new Set(buildingContracts.map((c) => c.tenant_id)).size, [buildingContracts]);
  const pendingSchedulesCount = schedules.filter((s) => s.status === "PENDING").length;
  const pendingMaintenanceRequests = maintenanceRequests.filter((r) => ACTIVE_MAINTENANCE_STATUSES.has(r.status as RequestStatus)).length;
  const processingMaintenanceRequests = maintenanceRequests.filter((r) => r.status === "PROCESSING").length;
  const unresolvedRequests = useMemo(
    () => maintenanceRequests.filter((r) => ACTIVE_MAINTENANCE_STATUSES.has(r.status as RequestStatus)).slice(0, 5),
    [maintenanceRequests]
  );

  const apartmentStatus = useMemo(() => [
    { name: "Đang thuê", value: rentedCount, color: "#7C3AED" },
    { name: "Còn trống", value: availableCount, color: "#10B981" },
    { name: "Bảo trì", value: maintenanceCount, color: "#F59E0B" },
  ], [rentedCount, availableCount, maintenanceCount]);

  const thirtyDaysLater = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 30);
    return d;
  }, [now]);

  const expiringContractsCount = useMemo(() => {
    return buildingContracts.filter((c) => {
      const endDate = new Date(c.end_date);
      return endDate >= now && endDate <= thirtyDaysLater;
    }).length;
  }, [buildingContracts, now, thirtyDaysLater]);

  const upcomingTasks = useMemo(() => [
    { id: "expiring", text: `Kiểm tra căn hộ sắp hết hạn (${expiringContractsCount} HĐ)`, time: "Tuần này", urgent: expiringContractsCount > 0 },
    { id: "schedules", text: `Xử lý lịch hẹn xem phòng (${pendingSchedulesCount} lịch chờ)`, time: "Hôm nay", urgent: pendingSchedulesCount > 0 },
    { id: "maintenance", text: "Bảo trì định kỳ hệ thống điện nước hành lang", time: "Thứ 5", urgent: false },
    { id: "readings", text: "Ghi nhận chỉ số điện nước định kỳ cuối tháng", time: "Hàng tháng", urgent: false },
  ], [expiringContractsCount, pendingSchedulesCount]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size={32} /></div>;
  if (isError) return <div className="p-6 text-center text-sm text-red-600 bg-red-50 border border-red-200">Không thể tải dữ liệu bảng điều khiển. Vui lòng thử tải lại trang.</div>;

  if (isTechnician) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Xin chào Kỹ thuật viên, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan công việc sửa chữa & bảo trì hôm nay</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Link
            to={maintenanceUrl}
            className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between hover:border-purple-300 transition-all group"
          >
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-purple-600">Tổng số công việc</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{myTasks.length}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 flex items-center justify-center group-hover:bg-purple-100">
              <ClipboardList size={22} className="text-purple-600" />
            </div>
          </Link>
          <Link
            to={`${maintenanceUrl}?status=PENDING`}
            className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between hover:border-amber-300 transition-all group"
          >
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-amber-600">Chờ xử lý</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{taskStats.pending}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 flex items-center justify-center group-hover:bg-amber-100">
              <Clock size={22} className="text-amber-600" />
            </div>
          </Link>
          <Link
            to={`${maintenanceUrl}?status=PROCESSING`}
            className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between hover:border-blue-300 transition-all group"
          >
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-blue-600">Đang tiến hành</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{taskStats.processing}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
              <Play size={22} className="text-blue-600" />
            </div>
          </Link>
          <Link
            to={`${maintenanceUrl}?status=DONE`}
            className="bg-white border border-gray-200 p-5 shadow-lg flex items-center justify-between hover:border-emerald-300 transition-all group"
          >
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-emerald-600">Đã hoàn thành</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{taskStats.done}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100">
              <CheckCircle size={22} className="text-emerald-600" />
            </div>
          </Link>
        </div>
        <ChartCard
          title="Công việc cần chú ý"
          subtitle="Các sự cố ưu tiên cao hoặc cần thực hiện sớm nhất"
          action={
            <Link to={maintenanceUrl} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
              Xem tất cả <ArrowRight size={13} />
            </Link>
          }
        >
          {attentionTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Hiện không có công việc bảo trì nào cần xử lý ngay.</div>
          ) : (
            <div className="overflow-x-auto min-h-60">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm font-sans">
                <thead>
                  <tr className="text-left text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="pb-3 pt-2">Căn hộ</th>
                    <th className="pb-3 pt-2">Sự cố</th>
                    <th className="pb-3 pt-2">Mức độ</th>
                    <th className="pb-3 pt-2">Trạng thái</th>
                    <th className="pb-3 pt-2">Lịch hẹn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {attentionTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/60">
                      <td className="py-3 font-semibold text-gray-800">P.{task.apartment?.room_number || task.apartment_id}</td>
                      <td className="py-3 font-medium text-gray-700">{task.title}</td>
                      <td className="py-3">{getPriorityBadge(task.priority)}</td>
                      <td className="py-3">{getStatusBadge(task.status)}</td>
                      <td className="py-3 text-xs text-gray-500">
                        {task.scheduled_at ? new Date(task.scheduled_at).toLocaleString("vi-VN") : "Chưa hẹn"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
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
      <DashboardStatGrid
        totalApartments={totalApartmentsCount}
        pendingMaintenance={pendingMaintenanceRequests}
        activeTenants={activeTenantsCount}
        availableApartments={availableCount}
        pendingSchedules={pendingSchedulesCount}
        finalCard={{
          icon: Wrench,
          label: "Sự cố đang xử lý",
          value: processingMaintenanceRequests,
          iconColor: "text-orange-600",
          iconBg: "bg-orange-50",
        }}
      />
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-12 lg:col-span-8">
          <ChartCard
            title="Yêu cầu sửa chữa cần xử lý"
            subtitle="Các sự cố mới nhận hoặc đang tiến hành cần kiểm tra"
            action={
              <Link to={maintenanceUrl} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
                Xem tất cả <ArrowRight size={13} />
              </Link>
            }
          >
            {unresolvedRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">Không có yêu cầu sửa chữa nào cần xử lý.</div>
            ) : (
              <div className="overflow-x-auto min-h-60">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm font-sans">
                  <thead>
                    <tr className="text-left text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pt-2">Căn hộ</th>
                      <th className="pb-3 pt-2">Sự cố</th>
                      <th className="pb-3 pt-2">Mức độ</th>
                      <th className="pb-3 pt-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {unresolvedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/60">
                        <td className="py-3 font-semibold text-gray-800">P.{req.apartment?.room_number || req.apartment_id}</td>
                        <td className="py-3 font-medium text-gray-700">
                          <div className="font-semibold text-gray-800 truncate max-w-50" title={req.title}>
                            {req.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-62.5" title={req.description}>
                            {req.description}
                          </div>
                        </td>
                        <td className="py-3">{getPriorityBadge(req.priority)}</td>
                        <td className="py-3">{getStatusBadge(req.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ApartmentStatusChart data={apartmentStatus} />
        </div>
      </div>

      <OperationalTasksCard tasks={upcomingTasks} />
    </div>
  );
}
