import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, ClipboardList, Clock, Play } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import {
  PRIORITY_CONFIG,
  REQUEST_STATUS_CONFIG,
  type Priority,
  type RequestStatus,
} from "../../../../constants";
import ChartCard from "../../../Admin/dashboard/components/ChartCard";
import { useDashboardStaff } from "../hooks/useDashboardStaff";
import RefreshButton from "../../../../components/ui/RefreshButton";

const MAINTENANCE_ROUTE = "/staff/maintenance";
const ACTIVE_STATUSES: ReadonlySet<RequestStatus> = new Set([
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
  const { displayName, maintenanceRequests, isLoading, isError, currentStaff } = useDashboardStaff();
  const today = useMemo(
    () => new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    []
  );

  const myTasks = useMemo(() => {
    if (!currentStaff) return [];
    return maintenanceRequests.filter(
      (request) => request.assigned_staff_id === currentStaff.id
        || request.assigned_staff?.id === currentStaff.id
    );
  }, [currentStaff, maintenanceRequests]);

  const taskStats = useMemo(() => {
    const stats = { pending: 0, processing: 0, done: 0 };
    for (const task of myTasks) {
      if (task.status === "PENDING") stats.pending++;
      if (task.status === "PROCESSING") stats.processing++;
      if (task.status === "DONE") stats.done++;
    }
    return stats;
  }, [myTasks]);

  const attentionTasks = useMemo(() => {
    const priorityRank: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return myTasks
      .filter((task) => ACTIVE_STATUSES.has(task.status as RequestStatus))
      .sort((left, right) => {
        const priorityDifference = (priorityRank[right.priority as Priority] || 0)
          - (priorityRank[left.priority as Priority] || 0);
        if (priorityDifference !== 0) return priorityDifference;
        if (left.scheduled_at && right.scheduled_at) {
          return new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime();
        }
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      })
      .slice(0, 5);
  }, [myTasks]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size={32} /></div>;
  }

  if (isError) {
    return (
      <div className="rounded-none border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        Không thể tải dữ liệu bảng điều khiển. Vui lòng thử tải lại trang.
      </div>
    );
  }

  const summaryCards = [
    { label: "Tổng số công việc", value: myTasks.length, icon: ClipboardList, iconClass: "bg-purple-50 text-purple-600", status: undefined },
    { label: "Chờ xử lý", value: taskStats.pending, icon: Clock, iconClass: "bg-amber-50 text-amber-600", status: "PENDING" },
    { label: "Đang tiến hành", value: taskStats.processing, icon: Play, iconClass: "bg-blue-50 text-blue-600", status: "PROCESSING" },
    { label: "Đã hoàn thành", value: taskStats.done, icon: CheckCircle, iconClass: "bg-emerald-50 text-emerald-600", status: "DONE" },
  ] as const;

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">{today}</p>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Xin chào, <span className="text-primary-600">{displayName}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Tổng quan công việc sửa chữa và bảo trì hôm nay</p>
        </div>
        <RefreshButton />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, iconClass, status }) => (
          <Link
            key={label}
            to={status ? `${MAINTENANCE_ROUTE}?status=${status}` : MAINTENANCE_ROUTE}
            className="group flex items-center justify-between rounded-none border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md sm:p-5"
          >
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 group-hover:text-primary-600">{label}</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-800">{value}</h2>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-none ${iconClass}`}>
              <Icon size={21} />
            </div>
          </Link>
        ))}
      </div>

      <ChartCard
        title="Công việc cần chú ý"
        subtitle="Các sự cố ưu tiên cao hoặc cần thực hiện sớm nhất"
        action={(
          <Link to={MAINTENANCE_ROUTE} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
            Xem tất cả <ArrowRight size={13} />
          </Link>
        )}
      >
        {attentionTasks.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Hiện không có công việc bảo trì nào cần xử lý ngay.
          </div>
        ) : (
          <div className="min-h-60 overflow-x-auto">
            <table className="min-w-[640px] divide-y divide-gray-200 text-xs font-sans sm:text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pt-2">Căn hộ</th>
                  <th className="pb-3 pt-2">Sự cố</th>
                  <th className="pb-3 pt-2">Mức độ</th>
                  <th className="pb-3 pt-2">Trạng thái</th>
                  <th className="pb-3 pt-2">Lịch hẹn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
