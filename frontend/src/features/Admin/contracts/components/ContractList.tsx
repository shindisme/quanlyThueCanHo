import { useMemo, useCallback } from "react";
import { Eye, FileText, Calendar as CalendarIcon, XCircle, Ban } from "lucide-react";
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
  setCancelContractItem?: (c: RentalContract) => void;
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
  setCancelContractItem,
}: ContractListProps) {
  const tenantMap = useMemo(() => new Map(tenants.map((t) => [t.id, t])), [tenants]);
  const apartmentMap = useMemo(() => new Map(apartments.map((a) => [a.id, a])), [apartments]);
  const buildingMap = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);

  const getStatusBadge = useCallback((status: ContractStatus) => {
    const label = CONTRACT_STATUS_LABELS[status] || status;
    const variant = CONTRACT_STATUS_COLORS[status] || "gray";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Badge variant={variant as any}>{label}</Badge>;
  }, []);

  const tenantName = useCallback(
    (c: RentalContract) => c.tenant?.full_name || tenantMap.get(c.tenant_id)?.full_name || "",
    [tenantMap]
  );

  const contractApartment = useCallback(
    (c: RentalContract) => c.apartment || apartmentMap.get(c.apartment_id),
    [apartmentMap]
  );

  const contractBuilding = useCallback(
    (c: RentalContract) => {
      const apt = contractApartment(c);
      return apt?.building || (apt ? buildingMap.get(apt.building_id) : null);
    },
    [contractApartment, buildingMap]
  );

  const columns: Column<RentalContract>[] = useMemo(
    () => [
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
        render: (c) => <span className="font-semibold text-gray-800 font-sans">HD-{String(c.id).padStart(5, "0")}</span>,
      },
      {
        key: "tenant",
        label: "Người thuê",
        sortValue: (c) => tenantName(c),
        render: (c) => <span className="font-medium text-gray-700">{tenantName(c) || "-"}</span>,
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
        },
      },
      {
        key: "end_date",
        label: "Thời hạn",
        sortValue: (c) => new Date(c.end_date).getTime(),
        render: (c) => (
          <span className="text-xs text-gray-500">
            {formatDate(c.start_date)} - {formatDate(c.end_date)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortValue: (c) => c.status,
        render: (c) => getStatusBadge(c.status as ContractStatus),
      },
      {
        key: "actions",
        label: "Chức năng",
        className: "text-right",
        render: (c) => (
          <div className="flex items-center justify-start gap-1">
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
            {c.status === "ACTIVE" && (
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
            )}
            {c.status === "ACTIVE" && (role === "ADMIN" || role === "MANAGER") && (() => {
              const isFutureContract = new Date(c.start_date) > new Date();
              return (
                <button
                  disabled={role === "ADMIN"}
                  onClick={() => {
                    if (isFutureContract) {
                      setCancelContractItem?.(c);
                    } else {
                      setTerminateItem(c);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${role === "ADMIN"
                    ? "text-gray-400 opacity-60 cursor-not-allowed"
                    : isFutureContract
                      ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                      : "text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    }`}
                  title={
                    role === "ADMIN"
                      ? "Chức năng do Quản lý tòa nhà thực hiện"
                      : isFutureContract
                        ? "Hủy hợp đồng (Chưa nhận phòng)"
                        : "Trả phòng (Thanh lý hợp đồng)"
                  }
                >
                  {isFutureContract ? <Ban size={16} /> : <XCircle size={16} />}
                </button>
              );
            })()}
          </div>
        ),
      },
    ],
    [
      contractApartment,
      contractBuilding,
      getStatusBadge,
      role,
      setCancelContractItem,
      setExtendEndDate,
      setSelectedDetailContract,
      setSelectedDocContract,
      setSelectedExtendContract,
      setTerminateItem,
      tenantName,
    ]
  );

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={paginatedContracts} emptyMessage="Không tìm thấy hợp đồng nào." />
    </div>
  );
}
