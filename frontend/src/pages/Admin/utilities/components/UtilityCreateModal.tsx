import { Zap, Calendar } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Combobox from "../../../../components/ui/Combobox";
import Input from "../../../../components/ui/Input";
import { useUtilityCreate } from "../../../../hooks/admin/useUtilityCreate";
import type { BuildingData } from "../../../../services/buildingService";
import type { ApartmentData } from "../../../../services/apartmentService";
import type { UtilityReadingData } from "../../../../services/utilityService";

interface UtilityCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: BuildingData[];
  apartments: ApartmentData[];
  readings: UtilityReadingData[];
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
  readings,
  preselectedApartment,
  defaultMonth,
  defaultYear,
  role,
  managedBuildingId,
}: UtilityCreateModalProps) {
  const {
    saving,
    formBuildingId,
    setFormBuildingId,
    formFloor,
    setFormFloor,
    formApartmentId,
    setFormApartmentId,
    formMonth,
    setFormMonth,
    formYear,
    setFormYear,
    formElectricOld,
    formElectricNew,
    setFormElectricNew,
    formWaterOld,
    formWaterNew,
    setFormWaterNew,
    handleSave,
    getMonthOptions,
    getYearOptions,
    buildingOptions,
    floorOptions,
    modalApartmentOptions,
  } = useUtilityCreate({
    isOpen,
    onClose,
    onSuccess,
    buildings,
    apartments,
    readings,
    preselectedApartment,
    defaultMonth,
    defaultYear,
    role,
    managedBuildingId,
  });

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
          <Button onClick={handleSave} isLoading={saving}>
            Lưu thông tin
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Building selection */}
        {role === "ADMIN" && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Chi nhánh / Tòa nhà *
            </label>
            <Combobox
              options={buildingOptions}
              value={formBuildingId}
              onChange={(val) => {
                setFormBuildingId(val);
                setFormFloor("");
                setFormApartmentId("");
              }}
              disabled={!!formApartmentId}
              placeholder="Chọn chi nhánh"
              searchPlaceholder="Tìm kiếm chi nhánh..."
              triggerClassName="h-10 border-gray-300"
              clearable={false}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Floor selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Tầng *</label>
            <Combobox
              options={floorOptions}
              value={formFloor}
              onChange={(val) => {
                setFormFloor(val);
                setFormApartmentId("");
              }}
              disabled={!!formApartmentId || !formBuildingId}
              placeholder={formBuildingId ? "Chọn tầng" : "Chọn tòa nhà trước"}
              searchable={false}
              triggerClassName="h-10 border-gray-300"
              clearable={false}
            />
          </div>

          {/* Room selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Căn hộ / Phòng *
            </label>
            <Combobox
              options={modalApartmentOptions}
              value={formApartmentId}
              onChange={(val) => setFormApartmentId(val)}
              disabled={!!formApartmentId || !formFloor}
              placeholder={formFloor ? "Chọn phòng" : "Chọn tầng trước"}
              searchPlaceholder="Tìm phòng..."
              triggerClassName="h-10 border-gray-300"
              clearable={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Tháng ghi *</label>
            <Combobox
              options={getMonthOptions()}
              value={String(formMonth)}
              onChange={(val) => setFormMonth(Number(val))}
              disabled={!!formApartmentId}
              placeholder="Chọn tháng"
              searchable={false}
              triggerClassName="h-10 border-gray-300"
              clearable={false}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Năm ghi *</label>
            <Combobox
              options={getYearOptions()}
              value={String(formYear)}
              onChange={(val) => setFormYear(Number(val))}
              disabled={!!formApartmentId}
              placeholder="Chọn năm"
              searchable={false}
              triggerClassName="h-10 border-gray-300"
              clearable={false}
            />
          </div>
        </div>

        {/* Electric readings */}
        <div className="bg-emerald-50/25 p-4 border border-emerald-100 rounded-lg space-y-4">
          <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
            <Zap size={16} /> Chỉ số Điện (kWh)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chỉ số điện cũ"
              type="number"
              value={formElectricOld}
              disabled={true}
              placeholder="0"
            />
            <Input
              label="Chỉ số điện mới *"
              type="number"
              value={formElectricNew}
              onChange={(e) => setFormElectricNew(e.target.value)}
              placeholder="Nhập số điện mới"
            />
          </div>
          <p className="text-xs text-emerald-700 font-semibold text-right">
            Điện năng sử dụng:{" "}
            {Math.max(0, (Number(formElectricNew) || 0) - (Number(formElectricOld) || 0))} kWh
          </p>
        </div>

        {/* Water readings */}
        <div className="bg-blue-50/25 p-4 border border-blue-100 rounded-lg space-y-4">
          <h4 className="font-bold text-blue-800 text-sm flex items-center gap-1.5">
            <Calendar size={16} /> Chỉ số Nước (m³)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chỉ số nước cũ"
              type="number"
              value={formWaterOld}
              disabled={true}
              placeholder="0"
            />
            <Input
              label="Chỉ số nước mới *"
              type="number"
              value={formWaterNew}
              onChange={(e) => setFormWaterNew(e.target.value)}
              placeholder="Nhập số nước mới"
            />
          </div>
          <p className="text-xs text-blue-700 font-semibold text-right">
            Lượng nước sử dụng:{" "}
            {Math.max(0, (Number(formWaterNew) || 0) - (Number(formWaterOld) || 0))} m³
          </p>
        </div>
      </div>
    </Modal>
  );
}
