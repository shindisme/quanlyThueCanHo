import { Zap, Droplet } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { formatApartmentDisplay } from "../../../../utils/string";
import { meter } from "../../../../utils/utilityMeter";
import type { UtilityReadingData } from "../../../../types";

interface Props {
  reading: UtilityReadingData | null;
  onClose: () => void;
}

export default function UtilityReadingDetailModal({ reading, onClose }: Props) {
  if (!reading) return null;

  const roomDisplay = reading.apartment
    ? formatApartmentDisplay(reading.apartment.room_number, reading.apartment.floor)
    : `Phòng ID #${reading.apartment_id}`;
  const branchName = reading.apartment?.building?.branch_name;

  return (
    <Modal
      isOpen={Boolean(reading)}
      onClose={onClose}
      title="Chi tiết chỉ số điện nước"
      footer={
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-5 font-sans">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phòng</label>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{roomDisplay}</span>
              {branchName && (
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1">
                  {branchName}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-gray-500">
              Tháng {reading.month}/{reading.year}
            </span>
          </div>
        </div>

        {/* Điện */}
        <div className="bg-emerald-50/25 p-4 border border-emerald-100 space-y-4 shadow-sm">
          <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
            <Zap size={16} /> Chỉ số Điện (kWh)
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Chỉ số điện cũ"
              type="number"
              value={meter(reading.electric_old)}
              disabled={true}
            />
            <Input
              label="Chỉ số điện mới *"
              type="number"
              value={meter(reading.electric_new)}
              disabled={true}
            />
          </div>
        </div>

        {/* Nước */}
        <div className="bg-blue-50/25 p-4 border border-blue-100 rounded-xl space-y-4 shadow-sm">
          <h4 className="font-bold text-blue-800 text-sm flex items-center gap-1.5">
            <Droplet size={16} /> Chỉ số Nước (m³)
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Chỉ số nước cũ"
              type="number"
              value={meter(reading.water_old)}
              disabled={true}
            />
            <Input
              label="Chỉ số nước mới *"
              type="number"
              value={meter(reading.water_new)}
              disabled={true}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
