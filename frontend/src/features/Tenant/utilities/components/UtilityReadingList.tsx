import DataTable, { type Column } from "../../../../components/ui/DataTable";
import type { SortConfig } from "../../../../hooks/useSort";
import type { UtilityReadingData } from "../../../../types";
import { formatDate } from "../../../../utils/date";
import { meterUsage } from "../../../../utils/utilityMeter";
import { getTableRowNumber } from "../../../../utils/table";
import { Eye } from "lucide-react";

interface UtilityReadingListProps {
  readings: UtilityReadingData[];
  startIdx: number;
  totalItems: number;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  onView: (reading: UtilityReadingData) => void;
}

export default function UtilityReadingList({ readings, startIdx, totalItems, sortConfig, onSort, onView }: UtilityReadingListProps) {
  const columns: Column<UtilityReadingData>[] = [
    {
      key: "index",
      label: "STT",
      className: "w-4",
      preserveRenderIndex: true,
      render: (_, index) => <span className="font-semibold text-gray-800">{getTableRowNumber(index, startIdx, totalItems, sortConfig)}</span>,
    },
    {
      key: "period",
      label: "Kỳ ghi chỉ số",
      sortValue: (reading) => reading.year * 100 + reading.month,
      isTitle: true,
      render: (reading) => <span className="font-semibold text-gray-900">Tháng {reading.month}/{reading.year}</span>,
    },
    {
      key: "electric_consumption",
      label: "Điện dùng (kWh)",
      sortValue: (reading) => meterUsage(reading.electric_old, reading.electric_new),
      sortable: false,
      className: "bg-primary-50/10 font-semibold text-primary-600",
      render: (reading) => <span>{meterUsage(reading.electric_old, reading.electric_new)}</span>,
    },
    {
      key: "water_consumption",
      label: "Nước dùng (m³)",
      sortValue: (reading) => meterUsage(reading.water_old, reading.water_new),
      sortable: false,
      className: "bg-emerald-50/10 font-semibold text-emerald-600",
      render: (reading) => <span>{meterUsage(reading.water_old, reading.water_new)}</span>,
    },
    {
      key: "created_at",
      label: "Ngày ghi",
      sortValue: (reading) => new Date(reading.created_at).getTime(),
      render: (reading) => <span className="text-gray-500">{formatDate(reading.created_at)}</span>,
    },
    {
      key: "actions",
      label: "Chức năng",
      sortable: false,
      isAction: true,
      className: "text-right",
      render: (reading) => (
        <button type="button" onClick={() => onView(reading)} className="cursor-pointer p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-600" title="Xem chi tiết">
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return <DataTable columns={columns} data={readings} emptyMessage="Chưa có lịch sử ghi nhận điện nước." sortConfig={sortConfig} onSort={onSort} />;
}
