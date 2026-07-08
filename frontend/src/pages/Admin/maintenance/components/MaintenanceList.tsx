import { Eye, Calendar as CalendarIcon, Check, ShieldAlert } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../../components/ui/Table";
import Badge, { type BadgeVariant } from "../../../../components/ui/Badge";
import { formatDate } from "../../../../utils/date";

interface MaintenanceListProps {
  requests: any[];
  role: string | null;
  saving: boolean;
  onOpenDetail: (req: any) => void;
  onOpenAssign: (req: any) => void;
  onOpenUnable: (req: any) => void;
  onComplete: (id: number) => void;
  requestSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
}

export default function MaintenanceList({
  requests,
  role,
  saving,
  onOpenDetail,
  onOpenAssign,
  onOpenUnable,
  onComplete,
  requestSort,
  getSortIcon,
}: MaintenanceListProps) {
  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
      PENDING: { label: "Chờ xử lý", variant: "warning" },
      PROCESSING: { label: "Đang sửa chữa", variant: "info" },
      DONE: { label: "Hoàn thành", variant: "success" },
      NEEDS_RESCHEDULE: { label: "Báo không sửa được", variant: "danger" },
    };
    const s = statusMap[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  }

  function getPriorityBadge(priority: string) {
    if (priority === "HIGH") return <Badge variant="danger">Khẩn cấp</Badge>;
    if (priority === "MEDIUM") return <Badge variant="warning">Trung bình</Badge>;
    return <Badge variant="gray">Thấp</Badge>;
  }

  return (
    <div className="border border-gray-200 overflow-hidden bg-white shadow-md rounded-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => requestSort("created_at")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
              Ngày gửi {getSortIcon("created_at")}
            </TableHead>
            <TableHead onClick={() => requestSort("apartment.room_number")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
              Căn hộ {getSortIcon("apartment.room_number")}
            </TableHead>
            <TableHead onClick={() => requestSort("title")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
              Sự cố {getSortIcon("title")}
            </TableHead>
            <TableHead onClick={() => requestSort("assigned_staff.full_name")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
              Nhân viên kỹ thuật {getSortIcon("assigned_staff.full_name")}
            </TableHead>
            <TableHead onClick={() => requestSort("scheduled_at")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors text-center">
              Hẹn sửa {getSortIcon("scheduled_at")}
            </TableHead>
            <TableHead onClick={() => requestSort("priority")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors text-center">
              Độ ưu tiên {getSortIcon("priority")}
            </TableHead>
            <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors text-center">
              Trạng thái {getSortIcon("status")}
            </TableHead>
            <TableHead className="text-right">Chức năng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const buildingName = req.apartment?.building?.branch_name || "Chưa rõ";
            const roomNum = req.apartment?.room_number ? `P.${req.apartment.room_number}` : "Chưa rõ";
            const showAssignBtn = (role === "ADMIN" || role === "MANAGER") && (req.status === "PENDING" || req.status === "NEEDS_RESCHEDULE");
            const showStaffActions = role === "STAFF" && req.status === "PROCESSING";

            return (
              <TableRow key={req.id}>
                <TableCell className="text-gray-600 whitespace-nowrap">{formatDate(req.created_at)}</TableCell>
                <TableCell className="font-medium text-gray-800 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{roomNum}</span>
                    {role === "ADMIN" && (
                      <span className="text-xs text-gray-400 font-normal">{buildingName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">
                  <div className="flex flex-col max-w-xs">
                    <span className="font-semibold text-primary-600">{req.title}</span>
                    <span className="text-xs text-gray-400 truncate" title={req.description}>
                      {req.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 whitespace-nowrap">
                  {req.assigned_staff ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{req.assigned_staff.full_name}</span>
                      <span className="text-xs text-gray-400">{req.assigned_staff.phone}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Chưa phân công</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-gray-600 text-xs whitespace-nowrap">
                  {req.scheduled_at ? formatDate(req.scheduled_at) : "-"}
                </TableCell>
                <TableCell className="text-center">{getPriorityBadge(req.priority)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    {getStatusBadge(req.status)}
                    {req.status === "NEEDS_RESCHEDULE" && req.unable_reason && (
                      <span className="text-[10px] text-red-500 font-medium max-w-[120px] truncate" title={req.unable_reason}>
                        Lý do: {req.unable_reason}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {/* Chi tiết */}
                    <button
                      type="button"
                      onClick={() => onOpenDetail(req)}
                      className="p-2 rounded-none text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>

                    {showAssignBtn && (
                      <button
                        type="button"
                        onClick={() => onOpenAssign(req)}
                        disabled={saving}
                        className="p-2 rounded-none text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer disabled:opacity-50 transition-colors"
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
                          className="p-2 rounded-none text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer disabled:opacity-50 transition-colors"
                          title="Hoàn thành sửa chữa"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenUnable(req)}
                          disabled={saving}
                          className="p-2 rounded-none text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 transition-colors"
                          title="Báo cáo không sửa được"
                        >
                          <ShieldAlert size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
