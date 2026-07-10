import { Pencil, Trash2, Sparkles, Eye } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../../components/ui/Table";
import { formatDate } from "../../../../utils/date";
import type { UtilityReadingData } from "../../../../services/utilityService";
import type { ApartmentData } from "../../../../services/apartmentService";

interface UtilityListProps {
  paginatedApartments: ApartmentData[];
  readings: UtilityReadingData[];
  filterMonth: string;
  filterYear: string;
  currentPage: number;
  pageSize: number;
  requestSort: (key: any) => void;
  getSortIcon: (key: any) => React.ReactNode;
  isLockedMonth: (month: number, year: number) => boolean;
  isWritable: boolean;
  handleOpenCreateModal: (preselectedApartment?: ApartmentData | null) => void;
  handleOpenModifyModal: (item: UtilityReadingData, viewOnly: boolean) => void;
  handleOpenDeleteModal: (item: UtilityReadingData) => void;
  filteredRentedApartmentsLength: number;
  role: string | null;
}

export default function UtilityList({
  paginatedApartments,
  readings,
  filterMonth,
  filterYear,
  currentPage,
  pageSize,
  requestSort,
  getSortIcon,
  isLockedMonth,
  isWritable,
  handleOpenCreateModal,
  handleOpenModifyModal,
  handleOpenDeleteModal,
  filteredRentedApartmentsLength,
  role,
}: UtilityListProps) {
  return (
    <div className="space-y-4">
      {/* View Card */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedApartments.map((apt) => {
          const r = readings.find(
            (x) =>
              x.apartment_id === apt.id &&
              x.month === Number(filterMonth) &&
              x.year === Number(filterYear)
          );

          const electricDiff = r ? Number(r.electric_new) - Number(r.electric_old) : "-";
          const waterDiff = r ? Number(r.water_new) - Number(r.water_old) : "-";
          const staffName = r?.staff?.full_name || (r ? "Hệ thống" : "-");
          const createdAt = r ? formatDate(r.created_at) : "-";

          const locked = isLockedMonth(Number(filterMonth), Number(filterYear));

          return (
            <div key={apt.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-base">
                  {apt.building?.branch_name || "Yuki House"} - <span className="text-[#3f6ad8]">P.{apt.floor}{apt.room_number}</span>
                </span>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
                  Tháng {filterMonth}/{filterYear}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="bg-emerald-50/30 p-2 rounded-lg border border-emerald-100/50">
                  <span className="text-xs text-emerald-700 font-semibold block">Điện dùng (kWh)</span>
                  <span className="text-base font-bold text-emerald-600 font-mono">{electricDiff}</span>
                </div>
                <div className="bg-blue-50/30 p-2 rounded-lg border border-blue-100/50">
                  <span className="text-xs text-blue-700 font-semibold block">Nước dùng (m³)</span>
                  <span className="text-base font-bold text-blue-600 font-mono">{waterDiff}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1 pt-1">
                <p>
                  <span className="font-semibold text-gray-700">Người ghi:</span> {staffName}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Ngày ghi:</span> {createdAt}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                {r && (
                  <button
                    onClick={() => handleOpenModifyModal(r, true)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                )}
                {isWritable && !locked && (
                  <>
                    <button
                      onClick={() => {
                        if (r) {
                          handleOpenModifyModal(r, false);
                        } else {
                          handleOpenCreateModal(apt);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 text-xs cursor-pointer ${r
                        ? "border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold"
                        }`}
                    >
                      <Pencil size={14} /> {r ? "Sửa" : "Ghi mới"}
                    </button>
                    {r && role !== "STAFF" && (
                      <button
                        onClick={() => handleOpenDeleteModal(r)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filteredRentedApartmentsLength === 0 && (
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
            <Sparkles size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Không tìm thấy căn hộ đang thuê nào</p>
          </div>
        )}
      </div>

      {/* View List */}
      <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-lg">
        <Table className="compact">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead
                onClick={() => requestSort("building.branch_name")}
                className="cursor-pointer select-none hover:bg-gray-100 transition-colors"
              >
                Chi nhánh {getSortIcon("building.branch_name")}
              </TableHead>
              <TableHead
                onClick={() => requestSort("room_number")}
                className="cursor-pointer select-none hover:bg-gray-100 transition-colors"
              >
                Căn hộ {getSortIcon("room_number")}
              </TableHead>
              <TableHead className="text-center">Tháng / Năm</TableHead>
              <TableHead className="text-right font-semibold text-emerald-600 bg-emerald-50/30">
                Điện dùng (kWh)
              </TableHead>
              <TableHead className="text-right font-semibold text-blue-600 bg-blue-50/30">
                Nước dùng (m³)
              </TableHead>
              <TableHead>Người ghi</TableHead>
              <TableHead>Ngày ghi</TableHead>
              <TableHead className="text-center w-28">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApartments.map((apt, index) => {
              const r = readings.find(
                (x) =>
                  x.apartment_id === apt.id &&
                  x.month === Number(filterMonth) &&
                  x.year === Number(filterYear)
              );

              const electricDiff = r ? Number(r.electric_new) - Number(r.electric_old) : "-";
              const waterDiff = r ? Number(r.water_new) - Number(r.water_old) : "-";
              const staffName = r?.staff?.full_name || (r ? "Hệ thống" : "-");
              const createdAt = r ? formatDate(r.created_at) : "-";

              const locked = isLockedMonth(Number(filterMonth), Number(filterYear));

              return (
                <TableRow key={apt.id}>
                  <TableCell className="text-center text-gray-500 font-medium">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-semibold text-gray-800">
                    {apt.building?.branch_name || "Yuki House"}
                  </TableCell>
                  <TableCell className="font-semibold text-[#3f6ad8]">
                    P.{apt.floor}{apt.room_number}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {filterMonth}/{filterYear}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 bg-emerald-50/20 font-mono">
                    {electricDiff}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600 bg-blue-50/20 font-mono">
                    {waterDiff}
                  </TableCell>
                  <TableCell className="font-medium text-gray-700">{staffName}</TableCell>
                  <TableCell className="text-xs text-gray-500">{createdAt}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {r && (
                        <button
                          onClick={() => handleOpenModifyModal(r, true)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      {isWritable && !locked && (
                        <>
                          <button
                            onClick={() => {
                              if (r) {
                                handleOpenModifyModal(r, false);
                              } else {
                                handleOpenCreateModal(apt);
                              }
                            }}
                            className={`p-1.5 rounded-lg cursor-pointer ${r
                              ? "text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                              : "text-emerald-650 hover:bg-emerald-55/70 hover:bg-emerald-50 font-semibold"
                              }`}
                            title={r ? "Sửa chỉ số" : "Ghi chỉ số mới"}
                          >
                            <Pencil size={15} />
                          </button>
                          {r && role !== "STAFF" && (
                            <button
                              onClick={() => handleOpenDeleteModal(r)}
                              className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Xóa bản ghi"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredRentedApartmentsLength === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-gray-500">
                  <Sparkles size={48} className="mx-auto mb-3 text-gray-300" />
                  Không tìm thấy căn hộ đang thuê nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
