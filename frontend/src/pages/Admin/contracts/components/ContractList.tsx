import { Eye, FileText, Calendar as CalendarIcon, XCircle } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../../../components/ui/Table";
import { formatCurrency } from "../../../../utils/currency";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { RentalContract, Tenant } from "../../../../types";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { BuildingData } from "../../../../services/buildingService";

interface ContractListProps {
  paginatedContracts: RentalContract[];
  tenants: Tenant[];
  apartments: ApartmentData[];
  buildings: BuildingData[];
  role: string | null;
  setSelectedDetailContract: (c: RentalContract) => void;
  setSelectedDocContract: (c: RentalContract) => void;
  setSelectedExtendContract: (c: RentalContract) => void;
  setExtendEndDate: (date: string) => void;
  setTerminateItem: (c: RentalContract) => void;
  requestSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
}

export default function ContractList({
  paginatedContracts,
  tenants,
  apartments,
  buildings,
  role,
  setSelectedDetailContract,
  setSelectedDocContract,
  setSelectedExtendContract,
  setExtendEndDate,
  setTerminateItem,
  requestSort,
  getSortIcon,
}: ContractListProps) {


  function getStatusBadge(status: string) {
    if (status === "ACTIVE") return <Badge variant="success">Còn hạn</Badge>;
    if (status === "ENDED") return <Badge variant="gray">Hết hạn</Badge>;
    return <Badge variant="danger">Đã thanh lý</Badge>;
  }

  return (
    <div className="space-y-4">
      {/* View Card */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedContracts.map((c) => {
          const tenant = tenants.find((t) => t.id === c.tenant_id);
          const apt = apartments.find((a) => a.id === c.apartment_id);
          const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
          const code = `HD-${String(c.id).padStart(5, "0")}`;
          const tenantName = tenant ? tenant.full_name : "-";
          const aptDisplay = apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : `-`;

          return (
            <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-base">
                  {code}
                </span>
                {getStatusBadge(c.status)}
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  <span className="font-semibold text-gray-700">Người thuê:</span> {tenantName}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Căn hộ:</span> <span className="text-primary-600 font-semibold">{aptDisplay}</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Giá thuê:</span> <span className="font-bold text-gray-855">{formatCurrency(c.monthly_rent)} / tháng</span>
                </p>
                <p className="text-xs">
                  <span className="font-semibold text-gray-700">Thời hạn:</span> {formatDate(c.start_date)} - {formatDate(c.end_date)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setSelectedDetailContract(c)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Eye size={14} /> Chi tiết
                </button>
                <button
                  onClick={() => setSelectedDocContract(c)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 flex items-center gap-1 text-xs cursor-pointer"
                >
                  <FileText size={14} /> Tải/In HĐ
                </button>
                {c.status === "ACTIVE" && role !== "TENANT" && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedExtendContract(c);
                        setExtendEndDate("");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <CalendarIcon size={14} /> Gia hạn
                    </button>
                    <button
                      onClick={() => setTerminateItem(c)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <XCircle size={14} /> Hủy HĐ
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View List */}
      <div className="hidden md:block border border-gray-200 overflow-hidden bg-white shadow-lg">
        <Table className="compact">
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("id")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Mã HĐ {getSortIcon("id")}
              </TableHead>
              <TableHead onClick={() => requestSort("tenant")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Người thuê {getSortIcon("tenant")}
              </TableHead>
              <TableHead onClick={() => requestSort("apartment")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Căn hộ {getSortIcon("apartment")}
              </TableHead>
              <TableHead onClick={() => requestSort("monthly_rent")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Giá thuê {getSortIcon("monthly_rent")}
              </TableHead>
              <TableHead onClick={() => requestSort("end_date")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Thời hạn {getSortIcon("end_date")}
              </TableHead>
              <TableHead onClick={() => requestSort("status")} className="cursor-pointer select-none hover:bg-gray-100 transition-colors">
                Trạng thái {getSortIcon("status")}
              </TableHead>
              <TableHead className="text-right">Chức năng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContracts.map((c) => {
              const tenant = tenants.find((t) => t.id === c.tenant_id);
              const apt = apartments.find((a) => a.id === c.apartment_id);
              const bld = apt ? buildings.find((b) => b.id === apt.building_id) : null;
              const code = `HD-${String(c.id).padStart(5, "0")}`;
              const tenantName = tenant ? tenant.full_name : "-";
              const aptDisplay = apt ? formatApartmentDisplay(apt.room_number, apt.floor, role || undefined, bld?.branch_name) : `-`;

              return (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-gray-800">{code}</TableCell>
                  <TableCell className="text-gray-655 font-medium">{tenantName}</TableCell>
                  <TableCell className="text-primary-600 font-semibold">{aptDisplay}</TableCell>
                  <TableCell className="text-gray-600">{formatCurrency(c.monthly_rent)}</TableCell>
                  <TableCell className="text-xs text-gray-500 font-medium">
                    {formatDate(c.start_date)} - {formatDate(c.end_date)}
                  </TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedDetailContract(c)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedDocContract(c)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer"
                        title="Tải/In hợp đồng"
                      >
                        <FileText size={16} />
                      </button>
                      {c.status === "ACTIVE" && role !== "TENANT" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedExtendContract(c);
                              setExtendEndDate("");
                            }}
                            className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer"
                            title="Gia hạn hợp đồng"
                          >
                            <CalendarIcon size={16} />
                          </button>
                          <button
                            onClick={() => setTerminateItem(c)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-55/20 cursor-pointer"
                            title="Hủy/Thanh lý hợp đồng"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
