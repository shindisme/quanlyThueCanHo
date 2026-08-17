import { useMemo } from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import { formatApartmentDisplay } from "../../../../utils/string";
import { useUtilityCreate } from "../hooks/useUtilityCreate";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";

interface UtilityCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingData[];
  apartments: ApartmentData[];
  preselectedApartment: ApartmentData | null;
  defaultMonth: number;
  defaultYear: number;
  role: string | null;
  managedBuildingId: number | null;
}

export default function UtilityCreateModal({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  apartments,
  preselectedApartment,
  defaultMonth,
  defaultYear,
  role,
  managedBuildingId,
}: UtilityCreateModalProps) {
  const {
    saving,
    setBuildingId,
    setFloor,
    apartmentId,
    setApartmentId,
    month,
    year,
    electricOld,
    electricNew,
    setElectricNew,
    waterOld,
    waterNew,
    setWaterNew,
    modalApartmentOptions,
    handleCreateUtilityReading,
  } = useUtilityCreate({
    isOpen,
    onClose,
    onSuccess,
    buildings,
    apartments,
    preselectedApartment,
    defaultMonth,
    defaultYear,
    role,
    managedBuildingId,
  });

  const selectedApt = useMemo(
    () => preselectedApartment || apartments.find((a) => String(a.id) === apartmentId),
    [preselectedApartment, apartments, apartmentId]
  );

  const isSubmitDisabled = saving || !electricNew || !waterNew || (!preselectedApartment && !apartmentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi chỉ số điện nước mới"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleCreateUtilityReading} isLoading={saving} disabled={isSubmitDisabled}>
            Lưu thông tin
          </Button>
        </>
      }
    >
      <div className="space-y-5 font-sans">
        {/* Streamlined Room Header */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Phòng *
          </label>
          {preselectedApartment ? (
            <div className="p-3 bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between shadow-sm">
              <span className="font-bold text-gray-900">
                {formatApartmentDisplay(preselectedApartment.room_number, preselectedApartment.floor)}
              </span>
              <div className="flex items-center gap-2">
                {preselectedApartment.building?.branch_name && (
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
                    {preselectedApartment.building.branch_name}
                  </span>
                )}
                <span className="text-xs text-gray-500 font-medium">
                  Tháng {month}/{year}
                </span>
              </div>
            </div>
          ) : (
            <Combobox
              options={modalApartmentOptions}
              value={apartmentId}
              onChange={(val) => {
                setApartmentId(val);
                const chosen = apartments.find((a) => String(a.id) === val);
                if (chosen) {
                  setBuildingId(String(chosen.building_id));
                  setFloor(String(chosen.floor));
                }
              }}
              placeholder="Chọn phòng cần ghi chỉ số..."
              searchPlaceholder="Tìm kiếm tên phòng hoặc số phòng..."
              triggerClassName="h-10 border-gray-300 rounded-xl"
              clearable={true}
            />
          )}
        </div>

        {!preselectedApartment && selectedApt && (
          <div className="px-3.5 py-2 bg-primary-50/60 border border-primary-100 rounded-xl text-xs flex items-center justify-between text-primary-900 font-medium">
            <span>
              Đã chọn: <strong>{formatApartmentDisplay(selectedApt.room_number, selectedApt.floor)}</strong>
            </span>
            <span>Tháng {month}/{year}</span>
          </div>
        )}

        {/* Electric readings */}
        <div className="bg-amber-50/25 p-4 border border-amber-100 space-y-4 shadow-sm">
          <h4 className="font-bold text-amber-800 text-sm flex items-center gap-1.5">
            Chỉ số Điện (kWh)
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Chỉ số điện cũ"
              type="number"
              value={electricOld}
              disabled={true}
              placeholder="0"
            />
            <Input
              label="Chỉ số điện mới *"
              type="number"
              value={electricNew}
              onChange={(e) => setElectricNew(e.target.value)}
              placeholder="Nhập số điện mới"
            />
          </div>
        </div>

        {/* Water readings */}
        <div className="bg-blue-50/25 p-4 border border-blue-100 space-y-4 shadow-sm">
          <h4 className="font-bold text-blue-800 text-sm flex items-center gap-1.5">
            Chỉ số Nước (m³)
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Chỉ số nước cũ"
              type="number"
              value={waterOld}
              disabled={true}
              placeholder="0"
            />
            <Input
              label="Chỉ số nước mới *"
              type="number"
              value={waterNew}
              onChange={(e) => setWaterNew(e.target.value)}
              placeholder="Nhập số nước mới"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
