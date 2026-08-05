import { Zap, Droplet } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import { formatApartmentDisplay } from "../../../../utils/string";
import { useUtilityModify } from "../hooks/useUtilityModify";
import type { UtilityReadingData } from "../../../../services/utilityService";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";

interface UtilityModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem: UtilityReadingData | null;
  isViewOnly?: boolean;
  buildings: BuildingData[];
  apartments: ApartmentData[];
}

export default function UtilityModifyModal({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  isViewOnly = false,
  buildings,
  apartments,
}: UtilityModifyModalProps) {
  const {
    saving,
    electricOld,
    electricNew,
    setElectricNew,
    waterOld,
    waterNew,
    setWaterNew,
    handleUpdateUtilityReading,
  } = useUtilityModify({
    isOpen,
    onClose,
    onSuccess,
    editItem,
    isViewOnly,
    buildings,
    apartments,
  });

  const currentApartment = apartments.find((a) => a.id === editItem?.apartment_id);
  const currentBuilding = currentApartment
    ? buildings.find((b) => b.id === currentApartment.building_id)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isViewOnly ? "Chi tiết chỉ số điện nước" : "Cập nhật chỉ số điện nước"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {isViewOnly ? "Đóng" : "Hủy"}
          </Button>
          {!isViewOnly && (
            <Button onClick={handleUpdateUtilityReading} isLoading={saving}>
              Lưu thông tin
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5 font-sans">
        {/* Streamlined Room & Period Header */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phòng</label>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                {currentApartment
                  ? formatApartmentDisplay(currentApartment.room_number, currentApartment.floor)
                  : `Phòng ID #${editItem?.apartment_id}`}
              </span>
              {currentBuilding?.branch_name && (
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1">
                  {currentBuilding.branch_name}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-gray-500">
              Tháng {editItem?.month}/{editItem?.year}
            </span>
          </div>
        </div>

        {/* Electric readings */}
        <div className="bg-emerald-50/25 p-4 border border-emerald-100  space-y-4 shadow-sm">
          <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
            <Zap size={16} /> Chỉ số Điện (kWh)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chỉ số điện cũ"
              type="number"
              value={electricOld}
              disabled={true}
              readOnly={true}
            />
            <Input
              label="Chỉ số điện mới *"
              type="number"
              value={electricNew}
              onChange={(e) => setElectricNew(e.target.value)}
              disabled={isViewOnly}
            />
          </div>
        </div>

        {/* Water readings */}
        <div className="bg-blue-50/25 p-4 border border-blue-100 rounded-xl space-y-4 shadow-sm">
          <h4 className="font-bold text-blue-800 text-sm flex items-center gap-1.5">
            <Droplet size={16} /> Chỉ số Nước (m³)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chỉ số nước cũ"
              type="number"
              value={waterOld}
              disabled={true}
              readOnly={true}
            />
            <Input
              label="Chỉ số nước mới *"
              type="number"
              value={waterNew}
              onChange={(e) => setWaterNew(e.target.value)}
              disabled={isViewOnly}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
