import { Eye, X } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { PRIORITY_CONFIG, REQUEST_STATUS_CONFIG } from "../../../../constants";
import type { SortConfig } from "../../../../hooks/useSort";
import type { MaintenanceRequest } from "../../../../types";
import { formatDate } from "../../../../utils/date";
import { getTableRowNumber } from "../../../../utils/table";

interface MaintenanceListProps {
  requests: MaintenanceRequest[];
  startIdx: number;
  totalItems: number;
  saving: boolean;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onDetail: (request: MaintenanceRequest) => void;
  onCancel: (request: MaintenanceRequest) => void;
}

export default function MaintenanceList({
  requests,
  startIdx,
  totalItems,
  saving,
  sortConfig,
  onSort,
  onDetail,
  onCancel,
}: MaintenanceListProps) {
  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      preserveRenderIndex: true,
      render: (_, index) => <span className="font-semibold text-gray-800">{getTableRowNumber(index, startIdx, totalItems, sortConfig)}</span>,
    },
    {
      key: "title",
      label: "Tiêu đề sự cố",
      isTitle: true,
      sortable: false,
      render: (request) => <span className="font-semibold text-primary-600">{request.title}</span>,
    },
    {
      key: "created_at",
      label: "Ngày gửi",
      sortValue: (request) => new Date(request.created_at).getTime(),
      render: (request) => <span className="whitespace-nowrap text-gray-600">{formatDate(request.created_at)}</span>,
    },
    {
      key: "priority",
      label: "Độ ưu tiên",
      sortable: false,
      sortValue: (request) => ({ LOW: 1, MEDIUM: 2, HIGH: 3 })[request.priority],
      render: (request) => {
        const config = PRIORITY_CONFIG[request.priority];
        return <Badge variant={config.badge}>{config.label}</Badge>;
      },
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: false,
      render: (request) => {
        const config = REQUEST_STATUS_CONFIG[request.status];
        return <Badge variant={config.badge}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      isAction: true,
      render: (request) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onDetail(request)}
            className="cursor-pointer rounded-xl p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600"
            title="Xem chi tiết"
          >
            <Eye size={15} />
          </button>
          {request.status === "PENDING" && (
            <button
              type="button"
              onClick={() => onCancel(request)}
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl p-2 text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              title="Hủy yêu cầu"
            >
              <X size={15} /> Hủy
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={requests}
      emptyMessage="Không tìm thấy yêu cầu sửa chữa nào"
      sortConfig={sortConfig}
      onSort={onSort}
    />
  );
}
