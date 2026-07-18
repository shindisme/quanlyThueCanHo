import { Eye, FileText, Calendar as CalendarIcon, XCircle } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, type ContractStatus } from "../../../../constants/enums";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { RentalContract } from "../../../../types";
import type { Tenant } from "../../../../types";
import type { Apartment } from "../../../../types";
import type { Building } from "../../../../types";

interface ContractListProps {
  paginatedContracts: RentalContract[];
  tenants: Tenant[];
  apartments: Apartment[];
  buildings: Building[];
  role: string | null;
  setSelectedDetailContract: (c: RentalContract) => void;
  setSelectedDocContract: (c: RentalContract) => void;
  setSelectedExtendContract: (c: RentalContract) => void;
  setExtendEndDate: (date: string) => void;
  setTerminateItem: (c: RentalContract) => void;
  onRenewContract?: (c: RentalContract) => void;
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
  onRenewContract,
}: ContractListProps) {

  function getStatusBadge(status: ContractStatus) {
    const label = CONTRACT_STATUS_LABELS[status] || status;
    const variant = CONTRACT_STATUS_COLORS[status] || "gray";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Badge variant={variant as any}>{label}</Badge>;
  }

  const tenantName = (c: RentalContract) =>
    c.tenant?.full_name || tenants.find((t) => t.id === c.tenant_id)?.full_name || "";

  const contractApartment = (c: RentalContract) =>
    c.apartment || apartments.find((a) => a.id === c.apartment_id);

  const contractBuilding = (c: RentalContract) => {
    const apt = contractApartment(c);
    return apt?.building || (apt ? buildings.find((b) => b.id === apt.building_id) : null);
  };

  const columns: Column<RentalContract>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      render: (_, index: number) => <span className="font-semibold text-gray-800 w-2">{index + 1}</span>,
    },
    {
      key: "id",
      label: "Mã HĐ",
      sortValue: (c) => c.id,
      render: (c) => <span className="font-semibold text-gray-800 font-sans">HD-{String(c.id).padStart(5, "0")}</span>
    },
    {
      key: "tenant",
      label: "Người thuê",
      sortValue: (c) => tenantName(c),
      render: (c) => <span className="font-medium text-gray-700">{tenantName(c) || "-"}</span>
    },
    {
      key: "apartment",
      label: "Căn hộ",
      sortValue: (c) => contractApartment(c)?.room_number || "",
      render: (c) => {
        const apt = contractApartment(c);
        const bld = contractBuilding(c);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">
              {apt ? formatApartmentDisplay(apt.room_number, apt.floor) : "-"}
            </span>
            {role === "ADMIN" && bld?.branch_name && (
              <span className="text-[10px] font-semibold text-primary-600">{bld.branch_name}</span>
            )}
          </div>
        );
      }
    },
    {
      key: "end_date",
      label: "Thời hạn",
      sortValue: (c) => new Date(c.end_date).getTime(),
      render: (c) => <span className="text-xs text-gray-500">{formatDate(c.start_date)} - {formatDate(c.end_date)}</span>
    },
    {
      key: "status",
      label: "Trạng thái",
      sortValue: (c) => c.status,
      render: (c) => getStatusBadge(c.status as ContractStatus)
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      render: (c) => (
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
            title="Biên bản bàn giao"
          >
            <FileText size={16} />
          </button>
          {c.status === "ENDED" ? (
            <button
              onClick={() => onRenewContract?.(c)}
              className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 cursor-pointer"
              title="Ký lại hợp đồng"
            >
              <CalendarIcon size={16} />
            </button>
          ) : (
            c.status === "ACTIVE" && (
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
            )
          )}
          {c.status === "ACTIVE" && (role === "ADMIN" || role === "MANAGER") && (
            <button
              onClick={() => setTerminateItem(c)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
              title="Hủy/Thanh lý hợp đồng"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={paginatedContracts} emptyMessage="Không tìm thấy hợp đồng nào." />
    </div>
  );
}
