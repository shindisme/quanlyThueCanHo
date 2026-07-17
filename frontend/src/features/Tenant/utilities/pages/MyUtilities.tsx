import { Receipt, Zap, Droplet } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useTenantUtilities } from "../hooks/useTenantUtilities";
import { formatDate } from "../../../../utils/date";
import { formatApartmentDisplay } from "../../../../utils/string";
import DataTable, { type Column } from "../../../../components/ui/DataTable";

const meter = (value: number) => Math.round(Number(value));
const meterUsage = (oldValue: number, newValue: number) =>
  Math.max(0, meter(newValue) - meter(oldValue));

export default function MyUtilities() {
  const {
    apartment,
    readings,
    isLoading
  } = useTenantUtilities();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={36} />
        <span className="text-sm text-gray-400 mt-2 font-sans">Đang tải lịch sử chỉ số điện nước...</span>
      </div>
    );
  }

  const sortedReadings = [...readings].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  const columns: Column<any>[] = [
    {
      key: "period",
      label: "Kỳ thanh toán",
      render: (r) => <span className="font-semibold text-gray-900">Tháng {r.month}/{r.year}</span>
    },
    {
      key: "electric_old",
      label: "Số điện cũ",
      className: "text-center",
      render: (r) => <span className="text-gray-600">{meter(r.electric_old)}</span>
    },
    {
      key: "electric_new",
      label: "Số điện mới",
      className: "text-center",
      render: (r) => <span className="text-gray-600">{meter(r.electric_new)}</span>
    },
    {
      key: "electric_consumption",
      label: "Tiêu thụ điện (kWh)",
      className: "text-center bg-primary-50/10 font-semibold text-primary-600",
      render: (r) => <span>{meterUsage(r.electric_old, r.electric_new)}</span>
    },
    {
      key: "water_old",
      label: "Số nước cũ",
      className: "text-center",
      render: (r) => <span className="text-gray-600">{meter(r.water_old)}</span>
    },
    {
      key: "water_new",
      label: "Số nước mới",
      className: "text-center",
      render: (r) => <span className="text-gray-600">{meter(r.water_new)}</span>
    },
    {
      key: "water_consumption",
      label: "Tiêu thụ nước (m³)",
      className: "text-center bg-emerald-50/10 font-semibold text-emerald-600",
      render: (r) => <span>{meterUsage(r.water_old, r.water_new)}</span>
    },
    {
      key: "created_at",
      label: "Ngày ghi nhận",
      render: (r) => <span className="text-gray-500">{formatDate(r.created_at)}</span>
    },
    {
      key: "recorded_by",
      label: "Người ghi",
      render: (r) => <span className="text-gray-750 font-semibold">{r.staff?.full_name || "Quản trị viên"}</span>
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        icon={Zap}
        title="Chỉ số điện nước"
        subtitle="Lịch sử ghi nhận điện nước của căn hộ bạn đang thuê"
        count={sortedReadings.length}
        iconColor="linear-gradient(135deg, #10B981, #34D399)"
      />

      {/* Apartment Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">
            {apartment ? formatApartmentDisplay(apartment.room_number, apartment.floor, "TENANT", apartment.building?.branch_name) : "Chưa nhận căn hộ"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {apartment?.building?.address_new || "Hệ thống chung cư Yuki House"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-semibold">
            <Zap size={14} /> Điện sinh hoạt
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold">
            <Droplet size={14} /> Nước sinh hoạt
          </div>
        </div>
      </div>

      {/* History list */}
      {sortedReadings.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-200">
          <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="font-medium">Chưa có lịch sử ghi nhận điện nước cho căn hộ này</p>
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} data={sortedReadings} emptyMessage="Chưa có lịch sử ghi nhận điện nước nào." />
        </div>
      )}
    </div>
  );
}
