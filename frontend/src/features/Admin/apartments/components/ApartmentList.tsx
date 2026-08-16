import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Eye } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import Button from "../../../../components/ui/Button";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { APARTMENT_STATUS_CONFIG, type ApartmentStatus } from "../../../../constants";
import { formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import { getApartmentThumbnail } from "../../../../utils/file";
import type { Apartment, Building } from "../../../../types";
import { useOnOff } from "../../../../hooks/useOnOff";
import { getTableRowNumber } from "../../../../utils/table";

interface ApartmentListProps {
  paginatedApartments: Apartment[];
  buildings: Building[];
  role: string | null;
  startIdx?: number;
  totalItems: number;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  setEditItem: (item: Apartment | null) => void;
  modifyModal: ReturnType<typeof useOnOff>;
  setDeleteItem: (item: Apartment | null) => void;
}

export default function ApartmentList({
  paginatedApartments,
  buildings,
  role,
  startIdx = 0,
  totalItems,
  sortConfig,
  onSort,
  setEditItem,
  modifyModal,
  setDeleteItem,
}: ApartmentListProps) {
  const basePath = role === "MANAGER" ? "/manager" : "/admin";
  const canEdit = role === "ADMIN" || role === "MANAGER";

  const buildingMap = useMemo(
    () => new Map(buildings.map((b) => [b.id, b.branch_name])),
    [buildings]
  );

  const rowNumberByApartmentId = useMemo(
    () => new Map(
      paginatedApartments.map((apartment, index) => [
        apartment.id,
        getTableRowNumber(index, startIdx, totalItems, sortConfig),
      ])
    ),
    [paginatedApartments, sortConfig, startIdx, totalItems]
  );

  function getStatusBadge(status: ApartmentStatus) {
    const config = APARTMENT_STATUS_CONFIG[status];
    return <Badge variant={config.badge}>{config.label}</Badge>;
  }

  const columns: Column<Apartment>[] = useMemo(
    () => [
      {
        key: "index",
        label: "STT",
        className: "w-4",
        render: (apt) => (
          <span className="font-semibold text-gray-800">
            {rowNumberByApartmentId.get(apt.id) ?? "-"}
          </span>
        ),
      },
      {
        key: "room_number",
        label: "Căn hộ",
        sortable: false,
        render: (apt) => {
          const roomName = formatApartmentDisplay(apt.room_number, apt.floor);
          const branch = apt.building?.branch_name || buildingMap.get(apt.building_id);
          const thumbnail = getApartmentThumbnail(apt);
          return (
            <Link
              to={`${basePath}/apartments/${apt.id}`}
              className="flex items-center gap-3 font-semibold cursor-pointer group"
            >
              <img
                src={thumbnail}
                alt={roomName}
                className="w-12 h-10 rounded-lg object-cover border border-gray-200 group-hover:border-primary-500 transition-all shrink-0 bg-gray-50"
              />
              <div>
                <span className="group-hover:underline text-gray-900 group-hover:text-primary-600 block">{roomName}</span>
                {role === "ADMIN" && branch && (
                  <span className="block text-[10px] font-semibold text-primary-600">
                    {branch}
                  </span>
                )}
              </div>
            </Link>
          );
        },
      },
      {
        key: "area",
        label: "Diện tích",
        render: (apt) => <span className="text-gray-650">{apt.area} m²</span>,
      },
      {
        key: "bedrooms",
        label: "PN",
        render: (apt) => <span className="text-gray-650">{apt.bedrooms}</span>,
      },
      {
        key: "bathrooms",
        label: "PVS",
        render: (apt) => <span className="text-gray-650">{apt.bathrooms}</span>,
      },
      {
        key: "rental_price",
        label: "Giá thuê",
        render: (apt) => <span className="font-semibold text-gray-800">{formatCurrency(apt.rental_price)}</span>,
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: false,
        render: (apt) => getStatusBadge(apt.status as ApartmentStatus),
      },
      {
        key: "actions",
        label: "Chức năng",
        className: "text-right",
        render: (apt) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`${basePath}/apartments/${apt.id}`}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
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
                    setEditItem(apt);
                    modifyModal.onOpen();
                  }}
                  className="text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                  title="Sửa"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteItem(apt)}
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
    [rowNumberByApartmentId, buildingMap, role, basePath, canEdit, setEditItem, modifyModal, setDeleteItem]
  );

  return (
    <div className="mt-6">
      <DataTable
        columns={columns}
        data={paginatedApartments}
        rowKey={(apartment) => apartment.id}
        sortConfig={sortConfig}
        onSort={onSort}
        emptyMessage="Không tìm thấy căn hộ nào."
      />
    </div>
  );
}
