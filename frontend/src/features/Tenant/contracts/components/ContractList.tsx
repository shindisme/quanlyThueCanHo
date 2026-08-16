import { useMemo } from "react";
import { FileText, Star, XCircle } from "lucide-react";
import DataTable, { type Column } from "../../../../components/ui/DataTable";
import Badge from "../../../../components/ui/Badge";
import { formatCurrency } from "../../../../utils/currency";
import { formatDate } from "../../../../utils/date";
import {
  CONTRACT_STATUS_CONFIG,
  CONTRACT_TERMINATION_STATUS_CONFIG,
  isOpenContractTerminationStatus,
} from "../../../../constants";
import type { ContractTermination, RentalContract } from "../../../../types";
import { getTableRowNumber } from "../../../../utils/table";

interface ContractListProps {
  contracts: RentalContract[];
  terminations: ContractTermination[];
  onViewContract: (contract: RentalContract) => void;
  onOpenReview: (contract: RentalContract) => void;
  onOpenTermination: (contract: RentalContract) => void;
  onCancelTermination: (termination: ContractTermination) => void;
  startIdx?: number;
  totalItems: number;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
}

export default function ContractList({
  contracts,
  terminations,
  onViewContract,
  onOpenReview,
  onOpenTermination,
  onCancelTermination,
  startIdx = 0,
  totalItems,
  sortConfig,
  onSort,
}: ContractListProps) {
  const openTerminationByContract = useMemo(() => {
    const map = new Map<number, ContractTermination>();
    terminations.forEach((item) => {
      if (isOpenContractTerminationStatus(item.status) && !map.has(item.contract_id)) {
        map.set(item.contract_id, item);
      }
    });
    return map;
  }, [terminations]);

  const columns: Column<RentalContract>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      preserveRenderIndex: true,
      render: (_, index: number) => (
        <span className="font-semibold text-gray-800">{getTableRowNumber(index, startIdx, totalItems, sortConfig)}</span>
      ),
    },
    {
      key: "id",
      label: "Mã hợp đồng",
      sortable: false,
      sortValue: (c) => c.id,
      render: (c) => <span className="font-semibold text-gray-800">HD-{String(c.id).padStart(5, "0")}</span>,
    },
    {
      key: "start_date",
      label: "Bắt đầu",
      sortable: true,
      sortValue: (c) => (c.start_date ? new Date(c.start_date).getTime() : 0),
      render: (c) => <span className="text-gray-600 whitespace-nowrap">{formatDate(c.start_date)}</span>,
    },
    {
      key: "end_date",
      label: "Kết thúc",
      sortable: true,
      sortValue: (c) => (c.end_date ? new Date(c.end_date).getTime() : 0),
      render: (c) => <span className="text-gray-600 whitespace-nowrap">{formatDate(c.end_date)}</span>,
    },
    {
      key: "monthly_rent",
      label: "Tiền thuê/tháng",
      className: "text-right",
      sortable: false,
      sortValue: (c) => Number(c.monthly_rent || 0),
      render: (c) => <span className="font-medium text-gray-800 whitespace-nowrap">{formatCurrency(c.monthly_rent)}</span>,
    },
    {
      key: "deposit_amount",
      label: "Tiền cọc",
      className: "text-right",
      sortable: false,
      sortValue: (c) => Number(c.deposit_amount || 0),
      render: (c) => <span className="font-medium text-gray-800 whitespace-nowrap">{formatCurrency(c.deposit_amount)}</span>,
    },
    {
      key: "status",
      label: "Trạng thái",
      className: "text-center",
      sortable: false,
      sortValue: (c) => c.status,
      render: (c) => {
        const contractConfig = CONTRACT_STATUS_CONFIG[c.status];
        const termination = openTerminationByContract.get(c.id);
        const terminationConfig = termination
          ? CONTRACT_TERMINATION_STATUS_CONFIG[termination.status]
          : null;

        return (
          <div className="flex flex-col items-center gap-1">
            <Badge variant={contractConfig.badge}>{contractConfig.label}</Badge>
            {terminationConfig && (
              <Badge variant={terminationConfig.badge}>
                Trả phòng: {terminationConfig.label}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Chức năng",
      className: "text-right",
      isAction: true,
      render: (c) => {
        const openTermination = openTerminationByContract.get(c.id);

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onViewContract(c)}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 cursor-pointer transition-colors"
              title="Xem hợp đồng"
              aria-label="Xem hợp đồng"
            >
              <FileText size={16} />
            </button>
            {c.status === "ENDED" && (
              <button
                type="button"
                onClick={() => onOpenReview(c)}
                className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 cursor-pointer transition-colors"
                title="Đánh giá"
                aria-label="Đánh giá"
              >
                <Star size={16} />
              </button>
            )}
            {c.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => {
                  if (openTermination) {
                    if (openTermination.status === "PENDING") {
                      onCancelTermination(openTermination);
                    }
                    return;
                  }
                  onOpenTermination(c);
                }}
                disabled={Boolean(openTermination && openTermination.status !== "PENDING")}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                title={
                  openTermination?.status === "PENDING"
                    ? "Hủy yêu cầu trả phòng"
                    : openTermination
                      ? "Yêu cầu trả phòng đang được xử lý"
                      : "Yêu cầu trả phòng"
                }
                aria-label={
                  openTermination?.status === "PENDING"
                    ? "Hủy yêu cầu trả phòng"
                    : "Yêu cầu trả phòng"
                }
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={contracts}
      emptyMessage="Không tìm thấy hợp đồng nào."
      sortConfig={sortConfig}
      onSort={onSort}
    />
  );
}
