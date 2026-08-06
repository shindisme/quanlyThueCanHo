import { useMemo, useCallback } from "react";
import { Eye, FileText, Calendar as CalendarIcon, XCircle, CheckCircle, ClipboardCheck, Info, RotateCcw } from "lucide-react";
import Badge from "../../../../components/ui/Badge";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_CONFIG,
  CONTRACT_TERMINATION_STATUS_CONFIG,
  type ContractStatus,
} from "../../../../constants/enums";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import type { ContractTermination, RentalContract } from "../../../../types";
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
  openTerminationsByContractId: Map<number, ContractTermination>;
  overdueCandidateIds: Set<number>;
  onApproveTermination: (termination: ContractTermination) => void;
  onRejectTermination: (termination: ContractTermination) => void;
  onCancelTermination: (termination: ContractTermination) => void;
  onCreateOverdueTermination: (contract: RentalContract) => void;
  onOpenTerminationCheckout: (contract: RentalContract, termination: ContractTermination) => void;
  onViewTermination: (termination: ContractTermination) => void;
  isTerminationActionPending: boolean;
}

function getTerminationLabel(termination: ContractTermination) {
  const config = CONTRACT_TERMINATION_STATUS_CONFIG[termination.status];
  return config?.label || termination.status;
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
  openTerminationsByContractId,
  overdueCandidateIds,
  onApproveTermination,
  onRejectTermination,
  onCancelTermination,
  onCreateOverdueTermination,
  onOpenTerminationCheckout,
  onViewTermination,
  isTerminationActionPending,
}: ContractListProps) {
  const tenantMap = useMemo(() => new Map(tenants.map((t) => [t.id, t])), [tenants]);
  const apartmentMap = useMemo(() => new Map(apartments.map((a) => [a.id, a])), [apartments]);
  const buildingMap = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);

  const getStatusBadge = useCallback((status: ContractStatus) => {
    const config = CONTRACT_STATUS_CONFIG[status];
    if (config) return <Badge variant={config.badge}>{config.label}</Badge>;
    const label = CONTRACT_STATUS_LABELS[status] || status;
    const variant = CONTRACT_STATUS_COLORS[status] || "gray";
    return <Badge variant={variant}>{label}</Badge>;
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

  const renderTerminationActions = useCallback(
    (contract: RentalContract) => {
      if (contract.status !== "ACTIVE" || (role !== "ADMIN" && role !== "MANAGER")) return null;
      const termination = openTerminationsByContractId.get(contract.id);

      if (termination?.status === "PENDING") {
        return (
          <>
            <button
              disabled={isTerminationActionPending}
              onClick={() => onApproveTermination(termination)}
              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer disabled:opacity-60"
              title="Duyệt yêu cầu trả phòng"
            >
              <CheckCircle size={16} />
            </button>
            <button
              disabled={isTerminationActionPending}
              onClick={() => onRejectTermination(termination)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-60"
              title="Từ chối yêu cầu trả phòng"
            >
              <XCircle size={16} />
            </button>
          </>
        );
      }

      if (termination) {
        return (
          <button
            disabled={isTerminationActionPending}
            onClick={() => onOpenTerminationCheckout(contract, termination)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-60"
            title="Kiểm tra và hoàn tất bàn giao"
          >
            <ClipboardCheck size={16} />
          </button>
        );
      }

      if (contract.status === "ACTIVE" || overdueCandidateIds.has(contract.id)) {
        return (
          <button
            disabled={isTerminationActionPending}
            onClick={() => onCreateOverdueTermination(contract)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-60"
            title="Thanh lý hợp đồng"
          >
            <XCircle size={16} />
          </button>
        );
      }

      return null;
    },
    [
      role,
      openTerminationsByContractId,
      overdueCandidateIds,
      isTerminationActionPending,
      onApproveTermination,
      onRejectTermination,
      onCreateOverdueTermination,
      onOpenTerminationCheckout,
    ]
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
        render: (c) => {
          const termination = openTerminationsByContractId.get(c.id);
          return (
            <div className="flex flex-col items-start gap-1">
              {getStatusBadge(c.status as ContractStatus)}
              {termination && <Badge variant="warning">{getTerminationLabel(termination)}</Badge>}
            </div>
          );
        },
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
            {(() => {
              const termination = openTerminationsByContractId.get(c.id);
              return termination ? (
                <>
                  <button
                    onClick={() => onViewTermination(termination)}
                    className="p-2 rounded-lg text-gray-400 hover:text-info-600 hover:bg-info-50 cursor-pointer"
                    title="Xem chi tiết yêu cầu thanh lý"
                  >
                    <Info size={16} />
                  </button>
                  <button
                    disabled={isTerminationActionPending}
                    onClick={() => onCancelTermination(termination)}
                    className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer disabled:opacity-60"
                    title="Hủy thanh lý hợp đồng"
                  >
                    <RotateCcw size={16} />
                  </button>
                </>
              ) : null;
            })()}
            {renderTerminationActions(c)}
          </div>
        ),
      },
    ],
    [
      contractApartment,
      contractBuilding,
      getStatusBadge,
      openTerminationsByContractId,
      renderTerminationActions,
      role,
      setExtendEndDate,
      setSelectedDetailContract,
      setSelectedDocContract,
      setSelectedExtendContract,
      onViewTermination,
      onCancelTermination,
      isTerminationActionPending,
      tenantName,
    ]
  );

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={paginatedContracts} emptyMessage="Không tìm thấy hợp đồng nào." />
    </div>
  );
}
