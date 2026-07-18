import { Pencil, Trash2, Eye } from "lucide-react";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { UtilityReadingData } from "../../../../services/utilityService";
import type { ApartmentData } from "../../../../services/apartmentService";

const meter = (value: number) => Math.round(Number(value));
const meterUsage = (oldValue: number, newValue: number) =>
  Math.max(0, meter(newValue) - meter(oldValue));

interface UtilityListProps {
  paginatedApartments: ApartmentData[];
  readings: UtilityReadingData[];
  filterMonth: string;
  filterYear: string;
  currentPage: number;
  pageSize: number;
  isLockedMonth: (month: number, year: number) => boolean;
  isWritable: boolean;
  handleOpenCreateModal: (preselectedApartment?: ApartmentData | null) => void;
  handleOpenModifyModal: (item: UtilityReadingData, viewOnly: boolean) => void;
  handleOpenDeleteModal: (item: UtilityReadingData) => void;
  role: string | null;
}

export default function UtilityList({
  paginatedApartments,
  readings,
  filterMonth,
  filterYear,
  currentPage,
  pageSize,
  isLockedMonth,
  isWritable,
  handleOpenCreateModal,
  handleOpenModifyModal,
  handleOpenDeleteModal,
  role,
}: UtilityListProps) {
  const columns: Column<ApartmentData>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4 text-center",
      render: (_, index: number) => (
        <span className="font-semibold text-gray-800 w-2">
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      key: "room",
      label: "Phòng",
      sortValue: (apt: ApartmentData) => formatApartmentDisplay(apt.room_number, apt.floor),
      render: (apt: ApartmentData) => {
        const room = formatApartmentDisplay(apt.room_number, apt.floor);
        const branch = apt.building?.branch_name || "";
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{room}</span>
            {role === "ADMIN" && branch && <span className="text-[10px] font-semibold text-primary-600">{branch}</span>}
          </div>
        );
      }
    },
    {
      key: "period",
      label: "Tháng / Năm",
      className: "text-center",
      render: () => <span className="text-gray-600 font-medium">Tháng {filterMonth}/{filterYear}</span>,
    },
    {
      key: "electric_usage",
      label: "Điện dùng (kWh)",
      className: "text-right bg-emerald-50/10 font-bold text-emerald-600 font-mono",
      render: (apt: ApartmentData) => {
        const r = readings.find(
          (x) =>
            x.apartment_id === apt.id &&
            x.month === Number(filterMonth) &&
            x.year === Number(filterYear)
        );
        return r ? meterUsage(r.electric_old, r.electric_new) : "-";
      }
    },
    {
      key: "water_usage",
      label: "Nước dùng (m³)",
      className: "text-right bg-blue-50/10 font-bold text-blue-600 font-mono",
      render: (apt: ApartmentData) => {
        const r = readings.find(
          (x) =>
            x.apartment_id === apt.id &&
            x.month === Number(filterMonth) &&
            x.year === Number(filterYear)
        );
        return r ? meterUsage(r.water_old, r.water_new) : "-";
      }
    },
    {
      key: "staff_name",
      label: "Người ghi",
      render: (apt: ApartmentData) => {
        const r = readings.find(
          (x) =>
            x.apartment_id === apt.id &&
            x.month === Number(filterMonth) &&
            x.year === Number(filterYear)
        );
        return <span className="text-gray-600">{r?.staff?.full_name || (r ? "Hệ thống" : "-")}</span>;
      }
    },
    {
      key: "created_at",
      label: "Ngày ghi",
      render: (apt: ApartmentData) => {
        const r = readings.find(
          (x) =>
            x.apartment_id === apt.id &&
            x.month === Number(filterMonth) &&
            x.year === Number(filterYear)
        );
        return <span className="text-gray-500">{r ? formatDate(r.created_at) : "-"}</span>;
      }
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-center w-28",
      isAction: true,
      render: (apt: ApartmentData) => {
        const r = readings.find(
          (x) =>
            x.apartment_id === apt.id &&
            x.month === Number(filterMonth) &&
            x.year === Number(filterYear)
        );
        const locked = isLockedMonth(Number(filterMonth), Number(filterYear));

        return (
          <div className="flex items-center justify-center gap-1.5">
            {r && (
              <button
                type="button"
                onClick={() => handleOpenModifyModal(r, true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                title="Xem chi tiết"
              >
                <Eye size={16} />
              </button>
            )}
            {isWritable && !locked && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (r) {
                      handleOpenModifyModal(r, false);
                    } else {
                      handleOpenCreateModal(apt);
                    }
                  }}
                  className={`p-1.5 rounded-lg border cursor-pointer ${r
                      ? "border-transparent text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                      : "border-emerald-250 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-semibold"
                    }`}
                  title={r ? "Sửa chỉ số" : "Ghi chỉ số mới"}
                >
                  <Pencil size={16} />
                </button>
                {r && role !== "STAFF" && (
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(r)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 cursor-pointer"
                    title="Xóa bản ghi"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={paginatedApartments}
        emptyMessage="Không tìm thấy căn hộ đang thuê nào"
      />
    </div>
  );
}
