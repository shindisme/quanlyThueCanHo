import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Eye, Star } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { APARTMENT_STATUS_LABELS, APARTMENT_STATUS_COLORS, type ApartmentStatus } from "../../../../constants/enums";
import { formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import type { Apartment } from "../../../../types";
import type { Building } from "../../../../types";
import { useOnOff } from "../../../../hooks/useOnOff";

interface ApartmentListProps {
  paginatedApartments: Apartment[];
  buildings: Building[];
  role: string | null;
  featuredIds: number[];
  toggleFeatured: (id: number) => void;
  setEditItem: (item: Apartment | null) => void;
  modifyModal: ReturnType<typeof useOnOff>;
  setDeleteItem: (item: Apartment | null) => void;
}

export default function ApartmentList({
  paginatedApartments,
  buildings,
  role,
  featuredIds,
  toggleFeatured,
  setEditItem,
  modifyModal,
  setDeleteItem,
}: ApartmentListProps) {
  const navigate = useNavigate();

  function getStatusBadge(status: ApartmentStatus) {
    const label = APARTMENT_STATUS_LABELS[status] || status;
    const variant = APARTMENT_STATUS_COLORS[status] || "gray";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Badge variant={variant as any}>{label}</Badge>;
  }

  const columns: Column<Apartment>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800">{index + 1}</span>,
    },
    {
      key: "room_number",
      label: "Căn hộ",
      sortValue: (apt) => apt.room_number,
      render: (apt) => {
        const roomName = formatApartmentDisplay(apt.room_number, apt.floor);
        const branch = buildings.find((b) => b.id === apt.building_id)?.branch_name;
        return (
          <div
            className="font-semibold cursor-pointer hover:underline"
            onClick={() => navigate(`/admin/apartments/${apt.id}`)}
          >
            <span>{roomName}</span>
            {role === "ADMIN" && branch && (
              <span className="block text-[10px] font-semibold text-primary-600">
                {branch}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "area",
      label: "Diện tích",
      sortValue: (apt) => apt.area,
      render: (apt) => <span className="text-gray-650">{apt.area} m²</span>,
    },
    {
      key: "bedrooms",
      label: "PN",
      sortValue: (apt) => apt.bedrooms,
      render: (apt) => <span className="text-gray-650">{apt.bedrooms}</span>,
    },
    {
      key: "bathrooms",
      label: "PVS",
      sortValue: (apt) => apt.bathrooms,
      render: (apt) => <span className="text-gray-650">{apt.bathrooms}</span>,
    },
    {
      key: "rental_price",
      label: "Giá thuê",
      sortValue: (apt) => apt.rental_price,
      render: (apt) => <span className="font-semibold text-gray-800">{formatCurrency(apt.rental_price)}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      sortValue: (apt) => apt.status,
      render: (apt) => getStatusBadge(apt.status as ApartmentStatus),
    },
    ...(role === "ADMIN"
      ? [
        {
          key: "featured",
          label: "Nổi bật",
          sortable: false,
          render: (apt: Apartment) => (
            <button
              onClick={() => toggleFeatured(apt.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${featuredIds.includes(apt.id)
                ? "text-amber-500 hover:text-amber-600"
                : "text-gray-300 hover:text-gray-400"
                }`}
              title={featuredIds.includes(apt.id) ? "Bỏ nổi bật" : "Bật nổi bật"}
            >
              <Star size={18} fill={featuredIds.includes(apt.id) ? "currentColor" : "none"} />
            </button>
          ),
        },
      ]
      : []),
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      render: (apt) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/admin/apartments/${apt.id}`)}
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
          {role !== "STAFF" && (
            <>
              <button
                onClick={() => {
                  setEditItem(apt);
                  modifyModal.onOpen();
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                title="Sửa"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteItem(apt)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 cursor-pointer"
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

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={paginatedApartments} emptyMessage="Không tìm thấy căn hộ nào." />
    </div>
  );
}
