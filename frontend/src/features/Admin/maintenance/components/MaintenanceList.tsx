import { Eye, Calendar as CalendarIcon, Check, ShieldAlert } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, type RequestStatus, type Priority } from "../../../../constants/enums";
import { formatDate } from "../../../../utils/date";

interface MaintenanceListProps {
  requests: any[];
  role: string | null;
  saving: boolean;
  onOpenDetail: (req: any) => void;
  onOpenAssign: (req: any) => void;
  onOpenUnable: (req: any) => void;
  onComplete: (id: number) => void;
}

export default function MaintenanceList({
  requests,
  role,
  saving,
  onOpenDetail,
  onOpenAssign,
  onOpenUnable,
  onComplete,
}: MaintenanceListProps) {
  function getStatusBadge(status: RequestStatus) {
    const label = REQUEST_STATUS_LABELS[status] || status;
    const variant = REQUEST_STATUS_COLORS[status] || "gray";
    return <Badge variant={variant as any}>{label}</Badge>;
  }

  function getPriorityBadge(priority: Priority) {
    const label = PRIORITY_LABELS[priority] || priority;
    const variant = PRIORITY_COLORS[priority] || "gray";
    return <Badge variant={variant as any}>{label}</Badge>;
  }

  const columns: Column<any>[] = [
    {
      key: "created_at",
      label: "Ngày gửi",
      sortValue: (req) => new Date(req.created_at).getTime(),
      render: (req) => <span className="text-gray-605 text-xs whitespace-nowrap">{formatDate(req.created_at)}</span>
    },
    {
      key: "apartment",
      label: "Căn hộ",
      sortValue: (req) => req.apartment?.room_number || "",
      render: (req) => {
        const buildingName = req.apartment?.building?.branch_name || "Chưa rõ";
        const roomNum = req.apartment?.room_number ? `P.${req.apartment.room_number}` : "Chưa rõ";
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{roomNum}</span>
            {role === "ADMIN" && (
              <span className="text-[10px] text-gray-400 font-normal">{buildingName}</span>
            )}
          </div>
        );
      }
    },
    {
      key: "title",
      label: "Sự cố",
      sortValue: (req) => req.title,
      render: (req) => (
        <div className="flex flex-col max-w-xs">
          <span className="font-semibold text-primary-600">{req.title}</span>
          <span className="text-xs text-gray-400 truncate" title={req.description}>
            {req.description}
          </span>
        </div>
      )
    },
    {
      key: "assigned_staff",
      label: "Nhân viên kỹ thuật",
      sortValue: (req) => req.assigned_staff?.full_name || "",
      render: (req) => req.assigned_staff ? (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-gray-800">{req.assigned_staff.full_name}</span>
          <span className="text-gray-400 font-normal">{req.assigned_staff.phone}</span>
        </div>
      ) : (
        <span className="text-xs text-gray-400 italic">Chưa phân công</span>
      )
    },
    {
      key: "scheduled_at",
      label: "Hẹn sửa",
      sortValue: (req) => req.scheduled_at ? new Date(req.scheduled_at).getTime() : 0,
      render: (req) => <span className="text-xs text-gray-600">{req.scheduled_at ? formatDate(req.scheduled_at) : "-"}</span>
    },
    {
      key: "priority",
      label: "Độ ưu tiên",
      sortValue: (req) => req.priority,
      render: (req) => getPriorityBadge(req.priority as Priority)
    },
    {
      key: "status",
      label: "Trạng thái",
      sortValue: (req) => req.status,
      render: (req) => (
        <div className="flex flex-col items-center gap-0.5 text-center">
          {getStatusBadge(req.status as RequestStatus)}
          {req.status === "NEEDS_RESCHEDULE" && req.unable_reason && (
            <span className="text-[10px] text-red-500 font-medium max-w-[120px] truncate" title={req.unable_reason}>
              Lý do: {req.unable_reason}
            </span>
          )}
        </div>
      )
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      render: (req) => {
        const showAssignBtn = (role === "ADMIN" || role === "MANAGER") && (req.status === "PENDING" || req.status === "NEEDS_RESCHEDULE");
        const showStaffActions = role === "STAFF" && req.status === "PROCESSING";

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onOpenDetail(req)}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </button>
            {showAssignBtn && (
              <button
                type="button"
                onClick={() => onOpenAssign(req)}
                disabled={saving}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer disabled:opacity-50 transition-colors"
                title="Phân công sửa chữa"
              >
                <CalendarIcon size={16} />
              </button>
            )}
            {showStaffActions && (
              <>
                <button
                  type="button"
                  onClick={() => onComplete(req.id)}
                  disabled={saving}
                  className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer disabled:opacity-50 transition-colors"
                  title="Hoàn thành sửa chữa"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenUnable(req)}
                  disabled={saving}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 cursor-pointer disabled:opacity-50 transition-colors"
                  title="Báo cáo không sửa được"
                >
                  <ShieldAlert size={16} />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={requests} emptyMessage="Không tìm thấy yêu cầu sửa chữa nào." />
    </div>
  );
}
