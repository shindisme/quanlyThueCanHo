import { useMemo } from "react";
import { Link } from "react-router-dom";
import { User, Eye, Pencil, Trash2 } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import Button from "../../../../components/ui/Button";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { Building } from "../../../../types";
import { BUILDING_STATUS_CONFIG, type BuildingStatus } from "../../../../constants";
import { getTableRowNumber } from "../../../../utils/table";

interface BuildingListProps {
  sortedBuildings: Building[];
  role: string | null;
  startIdx?: number;
  totalItems: number;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  setEditItem: (item: Building | null) => void;
  setShowModifyModal: (show: boolean) => void;
  setDeleteItem: (item: Building | null) => void;
}

export default function BuildingList({
  sortedBuildings,
  role,
  startIdx = 0,
  totalItems,
  sortConfig,
  onSort,
  setEditItem,
  setShowModifyModal,
  setDeleteItem,
}: BuildingListProps) {
  const canEdit = role === "ADMIN";

  const columns: Column<Building>[] = useMemo(
    () => [
      {
        key: "index",
        label: "STT",
        className: "w-4",
        preserveRenderIndex: true,
        render: (_, index: number) => (
          <span className="font-semibold text-gray-800 w-2">{getTableRowNumber(index, startIdx, totalItems, sortConfig)}</span>
        ),
      },
      {
        key: "branch_name",
        label: "Tên chi nhánh",
        sortable: false,
        sortValue: (b) => b.branch_name,
        render: (b) => (
          <Link
            to={`/admin/buildings/${b.id}`}
            className="font-semibold text-primary-600 hover:underline"
          >
            {b.branch_name}
          </Link>
        ),
      },
      {
        key: "address",
        label: "Địa chỉ",
        sortable: false,
        sortValue: (b) => b.address,
        render: (b) => (
          <span className="block max-w-xs truncate text-gray-600" title={b.address}>
            {b.address}
          </span>
        ),
      },
      {
        key: "manager",
        label: "Quản lý bởi",
        sortable: false,
        sortValue: (b) => b.manager?.fullName || b.manager?.username || "",
        render: (b) =>
          b.manager ? (
            <div className="flex items-center gap-1.5 font-medium text-primary-600">
              <User size={13} />
              <span>{b.manager.fullName || b.manager.username}</span>
            </div>
          ) : (
            <span className="text-gray-400 italic text-xs">Chưa bàn giao</span>
          ),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: false,
        sortValue: (b) => b.status,
        render: (b) => {
          const config = BUILDING_STATUS_CONFIG[b.status as BuildingStatus];
          return (
            <Badge variant={config?.badge || "gray"}>
              {config?.label || b.status}
            </Badge>
          );
        },
      },
      {
        key: "actions",
        label: "Chức năng",
        className: "text-right",
        render: (b) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/admin/buildings/${b.id}`}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer inline-flex items-center justify-center"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </Link>
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditItem(b);
                    setShowModifyModal(true);
                  }}
                  className="text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                  title="Sửa"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteItem(b)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [startIdx, totalItems, sortConfig, canEdit, setEditItem, setShowModifyModal, setDeleteItem]
  );

  return <DataTable columns={columns} data={sortedBuildings} sortConfig={sortConfig} onSort={onSort} />;
}
