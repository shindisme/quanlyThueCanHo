import { Pencil, Trash2, Eye, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Badge from "../../../../components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../../components/ui/Table";
import { formatApartmentDisplay } from "../../../../utils/string";
import { formatCurrency } from "../../../../utils/currency";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";

interface ApartmentListProps {
  paginatedApartments: ApartmentData[];
  buildings: BuildingData[];
  role: string | null;
  featuredIds: number[];
  toggleFeatured: (id: number) => void;
  setEditItem: (item: ApartmentData | null) => void;
  modifyModal: { onOpen: () => void; onClose: () => void; isOpen: boolean };
  setDeleteItem: (item: ApartmentData | null) => void;
  requestSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
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
  requestSort,
  getSortIcon,
}: ApartmentListProps) {
  const navigate = useNavigate();

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; variant: string }> = {
      AVAILABLE: { label: "Còn trống", variant: "success" },
      RENTED: { label: "Đang thuê", variant: "info" },
      MAINTENANCE: { label: "Bảo trì", variant: "warning" },
    };
    const s = map[status] || { label: status, variant: "gray" };
    return <Badge variant={s.variant as "success" | "info" | "warning" | "gray"}>{s.label}</Badge>;
  }

  return (
    <div className="space-y-4 mt-6">
      {/* View Card */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedApartments.map((apt) => {
          const roomName = formatApartmentDisplay(apt.room_number, apt.floor);
          const branch = buildings.find((b) => b.id === apt.building_id)?.branch_name;
          return (
            <div key={apt.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold text-primary-600 cursor-pointer text-base hover:underline flex flex-col"
                  onClick={() => navigate(`/${role?.toLowerCase()}/apartments/${apt.id}`)}
                >
                  <span>{roomName}</span>
                  {role === "ADMIN" && branch && (
                    <span className="text-xs font-semibold text-purple-600">{branch}</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {role === "ADMIN" && (
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
                  )}
                  {getStatusBadge(apt.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
                <p>
                  <span className="font-semibold text-gray-700">Diện tích:</span> {apt.area} m²
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Giá thuê:</span> <span className="font-bold text-gray-800">{formatCurrency(apt.rental_price)}</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Phòng ngủ:</span> {apt.bedrooms}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Phòng tắm:</span> {apt.bathrooms}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/${role?.toLowerCase()}/apartments/${apt.id}`)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Eye size={14} /> Chi tiết
                </button>
                {role !== "STAFF" && (
                  <>
                    <button
                      onClick={() => { setEditItem(apt); modifyModal.onOpen(); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Pencil size={14} /> Sửa
                    </button>
                    <button
                      onClick={() => setDeleteItem(apt)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View List */}
      <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-xl rounded-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("room_number")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Phòng {getSortIcon("room_number")}
              </TableHead>
              <TableHead onClick={() => requestSort("area")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Diện tích {getSortIcon("area")}
              </TableHead>
              <TableHead onClick={() => requestSort("bedrooms")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                P.Ngủ {getSortIcon("bedrooms")}
              </TableHead>
              <TableHead onClick={() => requestSort("bathrooms")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                P.Tắm {getSortIcon("bathrooms")}
              </TableHead>
              <TableHead onClick={() => requestSort("rental_price")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Giá thuê {getSortIcon("rental_price")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Trạng thái {getSortIcon("status")}
              </TableHead>
              {role === "ADMIN" && (
                <TableHead className="text-center w-24">Nổi bật</TableHead>
              )}
              <TableHead className="text-right">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApartments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell className="whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {formatApartmentDisplay(apt.room_number, apt.floor)}
                    </span>
                    {role === "ADMIN" && (
                      <span className="text-[10px] font-semibold text-purple-600">
                        {buildings.find((b) => b.id === apt.building_id)?.branch_name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{apt.area} m²</TableCell>
                <TableCell className="text-gray-655">{apt.bedrooms}</TableCell>
                <TableCell className="text-gray-655">{apt.bathrooms}</TableCell>
                <TableCell className="font-semibold text-gray-855">{formatCurrency(apt.rental_price)}</TableCell>
                <TableCell>{getStatusBadge(apt.status)}</TableCell>
                {role === "ADMIN" && (
                  <TableCell className="text-center">
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
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => navigate(`/${role?.toLowerCase()}/apartments/${apt.id}`)}
                      className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Xem chi tiết">
                      <Eye size={16} />
                    </button>
                    {role !== "STAFF" && (
                      <>
                        <button onClick={() => { setEditItem(apt); modifyModal.onOpen(); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer" title="Sửa">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { setDeleteItem(apt); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
