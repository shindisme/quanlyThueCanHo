import { useNavigate } from "react-router-dom";
import { User, Eye, Pencil, Trash2 } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { Building } from "../../../../types";

interface BuildingListProps {
  sortedBuildings: Building[];
  role: string | null;
  setEditItem: (item: Building | null) => void;
  setShowModifyModal: (show: boolean) => void;
  setDeleteItem: (item: Building | null) => void;
}

export default function BuildingList({
  sortedBuildings,
  role,
  setEditItem,
  setShowModifyModal,
  setDeleteItem,
}: BuildingListProps) {
  const navigate = useNavigate();

  const columns: Column<Building>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800 w-2">{index + 1}</span>,
    },
    {
      key: "branch_name",
      label: "Tên chi nhánh",
      sortValue: (b) => b.branch_name,
      render: (b) => (
        <span
          className="font-semibold text-primary-600 cursor-pointer hover:underline"
          onClick={() => navigate(`/admin/buildings/${b.id}`)}
        >
          {b.branch_name}
        </span>
      ),
    },
    {
      key: "address",
      label: "Địa chỉ",
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
      sortValue: (b) => b.status,
      render: (b) => (
        <Badge variant={b.status === "ACTIVE" ? "success" : "gray"}>
          {b.status === "ACTIVE" ? "Hoạt động" : "Ngừng"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/admin/buildings/${b.id}`)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          {role === "ADMIN" && (
            <>
              <button
                onClick={() => {
                  setEditItem(b);
                  setShowModifyModal(true);
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                title="Sửa"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteItem(b)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={sortedBuildings} />;
}
