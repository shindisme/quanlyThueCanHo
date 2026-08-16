import { Pencil, Trash2 } from "lucide-react";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { SortConfig } from "../../../../hooks/useSort";
import { formatDate } from "../../../../utils/date";
import type { OccupantItem } from "../hooks/useMyOccupants";
import { getTableRowNumber } from "../../../../utils/table";

interface OccupantListProps {
  occupants: OccupantItem[];
  startIdx: number;
  totalItems: number;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onEdit: (occupant: OccupantItem) => void;
  onDelete: (occupant: OccupantItem) => void;
}

export default function OccupantList({ occupants, startIdx, totalItems, sortConfig, onSort, onEdit, onDelete }: OccupantListProps) {
  const columns: Column<OccupantItem>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      preserveRenderIndex: true,
      render: (_, index) => <span className="font-semibold">{getTableRowNumber(index, startIdx, totalItems, sortConfig)}</span>,
    },
    {
      key: "name",
      label: "Họ và tên",
      sortable: false,
      isTitle: true,
      render: (occupant) => <span className="font-semibold text-primary-600">{occupant.name}</span>,
    },
    {
      key: "cccd",
      label: "CCCD",
      sortable: false,
      render: (occupant) => <span className="font-mono text-gray-700">{occupant.cccd}</span>,
    },
    {
      key: "dob",
      label: "Ngày sinh",
      sortable: false,
      sortValue: (occupant) => occupant.dob ? new Date(occupant.dob).getTime() : 0,
      render: (occupant) => <span className="text-gray-600">{formatDate(occupant.dob)}</span>,
    },
    {
      key: "phone",
      label: "Số điện thoại",
      sortable: false,
      render: (occupant) => <span className="text-gray-600">{occupant.phone || "-"}</span>,
    },
    {
      key: "actions",
      label: "Chức năng",
      isAction: true,
      className: "text-right",
      render: (occupant) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => onEdit(occupant)} className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-sky-50 hover:text-sky-600" title="Chỉnh sửa">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => onDelete(occupant)} className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600" title="Xóa">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={occupants} emptyMessage="Chưa có người ở cùng phù hợp" sortConfig={sortConfig} onSort={onSort} />;
}
