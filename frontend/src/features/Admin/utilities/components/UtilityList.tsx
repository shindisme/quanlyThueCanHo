import { useMemo } from "react";
import { Pencil, Eye } from "lucide-react";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import { meterUsage } from "../utils/utilityMeter";
import type { UtilityReadingData } from "../../../../services/utilityService";
import type { ApartmentData } from "../../../../services/apartmentService";

interface UtilityListProps {
  paginatedApartments: ApartmentData[];
  readings: UtilityReadingData[];
  filterMonth: string;
  filterYear: string;
  currentPage: number;
  pageSize: number;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
  isLockedMonth: (month: number, year: number) => boolean;
  isWritable: boolean;
  handleOpenCreateModal: (preselectedApartment?: ApartmentData | null) => void;
  handleOpenModifyModal: (item: UtilityReadingData, viewOnly: boolean) => void;
  role: string | null;
}

export default function UtilityList({
  paginatedApartments,
  readings,
  filterMonth,
  filterYear,
  currentPage,
  pageSize,
  sortConfig,
  onSort,
  isLockedMonth,
  isWritable,
  handleOpenCreateModal,
  handleOpenModifyModal,
  role,
}: UtilityListProps) {
  const startIdx = (currentPage - 1) * pageSize;

  const readingMap = useMemo(() => {
    const map = new Map<number, UtilityReadingData>();
    const monthNum = Number(filterMonth);
    const yearNum = Number(filterYear);
    readings.forEach((r) => {
      if (r.month === monthNum && r.year === yearNum) {
        map.set(r.apartment_id, r);
      }
    });
    return map;
  }, [readings, filterMonth, filterYear]);

  const columns = useMemo<Column<ApartmentData>[]>(
    () => [
      {
        key: "index",
        label: "STT",
        className: "w-4 text-center",
        sortable: true,
        sortValue: (apt: ApartmentData) => apt.id,
        render: (_, index: number) => (
          <span className="font-semibold text-gray-800 w-2">
            {startIdx + index + 1}
          </span>
        ),
      },
      {
        key: "room",
        label: "Phòng",
        sortable: true,
        sortValue: (apt: ApartmentData) => formatApartmentDisplay(apt.room_number, apt.floor),
        render: (apt: ApartmentData) => {
          const room = formatApartmentDisplay(apt.room_number, apt.floor);
          const branch = apt.building?.branch_name || "";
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800">{room}</span>
              {role === "ADMIN" && branch && (
                <span className="text-[10px] font-semibold text-primary-600">{branch}</span>
              )}
            </div>
          );
        },
      },
      {
        key: "electric_usage",
        label: "Điện dùng (kWh)",
        className: "text-left bg-amber-50/10 font-bold text-amber-600 font-mono",
        sortable: false,
        render: (apt: ApartmentData) => {
          const r = readingMap.get(apt.id);
          return r ? (
            meterUsage(r.electric_old, r.electric_new)
          ) : (
            <span className="italic text-gray-400 font-normal font-sans">Chưa ghi</span>
          );
        },
      },
      {
        key: "water_usage",
        label: "Nước dùng (m³)",
        className: "text-left bg-blue-50/10 font-bold text-blue-600 font-mono",
        sortable: false,
        render: (apt: ApartmentData) => {
          const r = readingMap.get(apt.id);
          return r ? (
            meterUsage(r.water_old, r.water_new)
          ) : (
            <span className="italic text-gray-400 font-normal font-sans">Chưa ghi</span>
          );
        },
      },
      {
        key: "period",
        label: "Tháng / Năm",
        className: "text-center",
        sortable: false,
        render: () => (
          <span className="text-gray-600 font-medium">
            Tháng {filterMonth}/{filterYear}
          </span>
        ),
      },
      {
        key: "created_at",
        label: "Ngày ghi",
        sortable: false,
        render: (apt: ApartmentData) => {
          const r = readingMap.get(apt.id);
          return r ? (
            <span className="text-gray-500">{formatDate(r.created_at)}</span>
          ) : (
            <span className="italic text-gray-400">Chưa ghi</span>
          );
        },
      },
      {
        key: "staff_name",
        label: "Người ghi",
        sortable: false,
        render: (apt: ApartmentData) => {
          const r = readingMap.get(apt.id);
          return r ? (
            <span className="text-gray-600">{r.staff?.full_name || "Hệ thống"}</span>
          ) : (
            <span className="italic text-gray-400">Chưa ghi</span>
          );
        },
      },
      {
        key: "actions",
        label: "Chức năng",
        className: "text-center w-28",
        isAction: true,
        sortable: false,
        render: (apt: ApartmentData) => {
          const r = readingMap.get(apt.id);
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
              )}
            </div>
          );
        },
      },
    ],
    [
      startIdx,
      role,
      filterMonth,
      filterYear,
      readingMap,
      isLockedMonth,
      isWritable,
      handleOpenModifyModal,
      handleOpenCreateModal,
    ]
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={paginatedApartments}
        sortConfig={sortConfig}
        onSort={onSort}
        emptyMessage="Không tìm thấy căn hộ đang thuê nào"
      />
    </div>
  );
}
