import { useMemo } from "react";
import { Eye, Check, X, Trash2, UserCheck, UserX } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { ViewingSchedule, Building } from "../../../../types";
import { formatApartmentDisplay, parseGuestName } from "../../../../utils/string";
import { formatDateTime } from "../../../../utils/date";
import { SCHEDULE_STATUS_LABELS, ATTENDANCE_STATUS_LABELS } from "../../../../constants/labels";
import { SCHEDULE_STATUS_COLORS, ATTENDANCE_STATUS_COLORS } from "../../../../constants/badges";
import type { ScheduleStatus, AttendanceStatus } from "../../../../constants/enums";
import { useSort } from "../../../../hooks/useSort";

interface ScheduleListProps {
  schedules: ViewingSchedule[];
  currentPage: number;
  pageSize?: number;
  role: string | null;
  buildingMap: Partial<Record<number, Building>>;
  onView: (schedule: ViewingSchedule) => void;
  onConfirm: (id: number) => void;
  onCancel: (schedule: ViewingSchedule) => void;
  onMarkAttended: (id: number) => void;
  onMarkAbsent: (id: number) => void;
  onDelete: (schedule: ViewingSchedule) => void;
}

export default function ScheduleList({
  schedules,
  currentPage,
  pageSize = 10,
  role,
  buildingMap,
  onView,
  onConfirm,
  onCancel,
  onMarkAttended,
  onMarkAbsent,
  onDelete,
}: ScheduleListProps) {
  const startIdx = (currentPage - 1) * pageSize;

  const scheduleIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    schedules.forEach((item, idx) => map.set(item.id, idx + 1));
    return map;
  }, [schedules]);

  const sortExtractors = useMemo(
    () => ({
      index: (s: ViewingSchedule) => scheduleIndexMap.get(s.id) ?? s.id,
      guest_name: (s: ViewingSchedule) => parseGuestName(s.guest_name).name.trim(),
      apartment_id: (s: ViewingSchedule) => s.apartment?.room_number || String(s.apartment_id),
      schedule_time: (s: ViewingSchedule) => new Date(s.schedule_time).getTime(),
      created_at: (s: ViewingSchedule) => (s.created_at ? new Date(s.created_at).getTime() : s.id),
    }),
    [scheduleIndexMap]
  );

  const { items: sortedSchedules, requestSort, sortConfig } = useSort(
    schedules,
    { key: "created_at", direction: "desc" },
    sortExtractors
  );

  const paginatedSchedules = useMemo(
    () => sortedSchedules.slice(startIdx, startIdx + pageSize),
    [sortedSchedules, startIdx, pageSize]
  );

  const columns = useMemo<Column<ViewingSchedule>[]>(() => {
    function getStatusBadge(status: ScheduleStatus) {
      const label = SCHEDULE_STATUS_LABELS[status] || status;
      const color = SCHEDULE_STATUS_COLORS[status] || "gray";
      return <Badge variant={color}>{label}</Badge>;
    }

    function getAttendanceBadge(attendance?: AttendanceStatus) {
      const key = (attendance || "NOT_YET") as AttendanceStatus;
      const label = ATTENDANCE_STATUS_LABELS[key] || key;
      const color = ATTENDANCE_STATUS_COLORS[key] || "gray";
      return <Badge variant={color}>{label}</Badge>;
    }

    function renderActions(s: ViewingSchedule) {
      switch (s.status) {
        case "PENDING":
          return (
            <>
              <button
                onClick={() => onConfirm(s.id)}
                className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer border border-emerald-200"
                title="Xác nhận lịch hẹn"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onCancel(s)}
                className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg cursor-pointer border border-red-200"
                title="Hủy lịch"
              >
                <X size={16} />
              </button>
            </>
          );
        case "CONFIRMED":
          return (
            <>
              {(!s.attendance_status || s.attendance_status === "NOT_YET" || s.attendance_status === "ABSENT") && (
                <button
                  onClick={() => onMarkAttended(s.id)}
                  className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer border border-emerald-200"
                  title="Xác nhận khách đã đến"
                >
                  <UserCheck size={16} />
                </button>
              )}
              {(!s.attendance_status || s.attendance_status === "NOT_YET" || s.attendance_status === "ATTENDED") && (
                <button
                  onClick={() => onMarkAbsent(s.id)}
                  className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg cursor-pointer border border-red-200"
                  title="Ghi nhận khách vắng mặt"
                >
                  <UserX size={16} />
                </button>
              )}
            </>
          );
        default:
          return (
            <button
              onClick={() => onDelete(s)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          );
      }
    }

    return [
      {
        key: "index",
        label: "STT",
        sortable: true,
        sortValue: (s: ViewingSchedule) => scheduleIndexMap.get(s.id) ?? s.id,
        render: (_: ViewingSchedule, index: number) => (
          <span className="text-gray-650 font-medium">{startIdx + index + 1}</span>
        ),
      },
      {
        key: "guest_name",
        label: "Họ tên",
        isTitle: true,
        sortable: true,
        sortValue: (s: ViewingSchedule) => parseGuestName(s.guest_name).name.trim(),
        render: (s: ViewingSchedule) => (
          <span className="font-semibold text-gray-805">{parseGuestName(s.guest_name).name}</span>
        ),
      },
      {
        key: "guest_phone",
        label: "SĐT",
        sortable: false,
        render: (s: ViewingSchedule) => <span className="text-gray-650">{s.guest_phone}</span>,
      },
      {
        key: "apartment_id",
        label: "Căn hộ",
        sortable: true,
        sortValue: (s: ViewingSchedule) => s.apartment?.room_number || String(s.apartment_id),
        render: (s: ViewingSchedule) => {
          if (!s.apartment) return <span className="text-gray-400">#{s.apartment_id}</span>;
          const roomName = formatApartmentDisplay(s.apartment.room_number, s.apartment.floor);
          const branch = s.apartment?.building_id ? buildingMap[s.apartment.building_id]?.branch_name : undefined;
          return (
            <div className="flex flex-col">
              <span className="font-semibold">{roomName}</span>
              {role === "ADMIN" && branch && (
                <span className="text-[10px] font-semibold text-primary-600">{branch}</span>
              )}
            </div>
          );
        },
      },
      {
        key: "schedule_time",
        label: "Thời gian",
        sortable: true,
        sortValue: (s: ViewingSchedule) => new Date(s.schedule_time).getTime(),
        render: (s: ViewingSchedule) => (
          <span className="text-gray-650 font-medium">{formatDateTime(s.schedule_time)}</span>
        ),
      },
      {
        key: "status",
        label: "Duyệt lịch",
        sortable: false,
        render: (s: ViewingSchedule) => getStatusBadge(s.status),
      },
      {
        key: "attendance_status",
        label: "Kết quả xem",
        sortable: false,
        render: (s: ViewingSchedule) => getAttendanceBadge(s.attendance_status),
      },
      {
        key: "actions",
        label: "Chức năng",
        isAction: true,
        sortable: false,
        render: (s: ViewingSchedule) => (
          <div className="flex items-center justify-start gap-1">
            <button
              onClick={() => onView(s)}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </button>
            {renderActions(s)}
          </div>
        ),
      },
    ];
  }, [
    startIdx,
    role,
    buildingMap,
    scheduleIndexMap,
    onView,
    onConfirm,
    onCancel,
    onMarkAttended,
    onMarkAbsent,
    onDelete,
  ]);

  return (
    <DataTable
      columns={columns}
      data={paginatedSchedules}
      sortConfig={sortConfig}
      onSort={requestSort}
      emptyMessage="Chưa có lịch xem phòng nào"
    />
  );
}
