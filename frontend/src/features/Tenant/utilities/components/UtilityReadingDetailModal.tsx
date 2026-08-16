import Modal from "../../../../components/ui/Modal";
import type { UtilityReadingData } from "../../../../types";
import { formatDate } from "../../../../utils/date";
import { meter, meterUsage } from "../../../../utils/utilityMeter";

interface Props {
  reading: UtilityReadingData | null;
  onClose: () => void;
}

export default function UtilityReadingDetailModal({ reading, onClose }: Props) {
  return (
    <Modal isOpen={Boolean(reading)} onClose={onClose} title="Chi tiết chỉ số điện nước" size="md">
      {reading && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Detail label="Kỳ ghi" value={`Tháng ${reading.month}/${reading.year}`} />
          <Detail label="Ngày ghi" value={formatDate(reading.created_at)} />
          <Detail label="Điện cũ" value={String(meter(reading.electric_old))} />
          <Detail label="Điện mới" value={String(meter(reading.electric_new))} />
          <Detail label="Điện sử dụng" value={`${meterUsage(reading.electric_old, reading.electric_new)} kWh`} />
          <Detail label="Nước cũ" value={String(meter(reading.water_old))} />
          <Detail label="Nước mới" value={String(meter(reading.water_new))} />
          <Detail label="Nước sử dụng" value={`${meterUsage(reading.water_old, reading.water_new)} m³`} />
          <Detail label="Người ghi" value={reading.staff?.full_name || "Hệ thống"} />
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-800">{value}</p>
    </div>
  );
}
