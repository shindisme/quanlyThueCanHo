import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Combobox from "../../../../components/ui/Combobox";
import { DatePicker } from "../../../../components/ui/DatePicker";
import type { Apartment } from "../../../../types";
import type { Building } from "../../../../types";
import type { Tenant } from "../../../../types";
import { useContractCreate } from "../hooks/useContractCreate";
import { formatCurrency } from "../../../../utils/currency";

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: Building[];
  apartments: Apartment[];
  tenants: Tenant[];
  currentUser: { id: number };
  role: string | null;
  managerBuildingId?: number;
  initialTenantId?: number;
  initialBuildingId?: number;
  initialApartmentId?: number;
  initialFloor?: number;
}

export default function ContractCreateModal({
  isOpen,
  onClose,
  onSuccess,
  buildings,
  apartments,
  tenants,
  currentUser,
  role,
  managerBuildingId,
  initialTenantId,
  initialBuildingId,
  initialApartmentId,
  initialFloor,
}: ContractCreateModalProps) {
  const {
    register,
    handleFormSubmit,
    setValue,
    errors,
    saving,
    loadingApartments,
    tenantIdValue,
    buildingIdValue,
    floorValue,
    apartmentIdValue,
    startDateValue,
    endDateValue,
    formFloors,
    formApartments,
    actualOccupantsValue,
    monthlyRentValue,
    maxOccupants,
    buildingApartments,
  } = useContractCreate({
    isOpen,
    onClose,
    onSuccess,
    currentUser: currentUser || { id: 1 },
    role,
    managerBuildingId,
    initialTenantId,
    initialBuildingId,
    initialApartmentId,
    initialFloor,
    apartments,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo hợp đồng mới"
      size="lg"
      closeOnOutsideClick={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleFormSubmit} isLoading={saving}>Tạo hợp đồng</Button>
        </>
      }
    >
      <div className="space-y-6 font-sans text-sm">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Combobox
              label="Người thuê đã đặt cọc *"
              options={tenants.map((t) => ({ value: String(t.id), label: `${t.full_name} (${t.citizen_id})` }))}
              value={tenantIdValue ? String(tenantIdValue) : ""}
              onChange={(val) => setValue("tenant_id", val ? Number(val) : null)}
              placeholder="Chọn người thuê"
              searchPlaceholder="Tìm kiếm người thuê..."
              triggerClassName="rounded-md"
              error={errors.tenant_id?.message}
            />
          </div>
          {role !== "MANAGER" && (
            <div className="col-span-12 sm:col-span-6">
              <Combobox
                label="Chi nhánh *"
                options={buildings.map((b) => ({ value: String(b.id), label: b.branch_name }))}
                value={buildingIdValue ? String(buildingIdValue) : ""}
                onChange={(val) => {
                  setValue("building_id", val ? Number(val) : (undefined as unknown as number));
                  setValue("floor", undefined as unknown as number);
                  setValue("apartment_id", undefined as unknown as number);
                }}
                disabled={role === "MANAGER"}
                placeholder="Chọn chi nhánh"
                searchPlaceholder="Tìm chi nhánh..."
                triggerClassName="rounded-md"
                error={errors.building_id?.message}
              />
            </div>
          )}

          <div className="col-span-12 sm:col-span-6">
            <Combobox
              label="Tầng *"
              options={formFloors.map((floor) => ({ value: String(floor), label: `Tầng ${floor}` }))}
              value={floorValue ? String(floorValue) : ""}
              onChange={(val) => {
                setValue("floor", val ? Number(val) : (undefined as unknown as number));
                setValue("apartment_id", undefined as unknown as number);
              }}
              disabled={!buildingIdValue || loadingApartments}
              placeholder={loadingApartments ? "Đang tải căn hộ..." : "Chọn tầng"}
              searchable={false}
              triggerClassName="rounded-md"
              error={errors.floor?.message}
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <Combobox
              label="Căn hộ *"
              options={formApartments.map((a) => ({ value: String(a.id), label: `P.${a.room_number} (${a.area}m²)` }))}
              value={apartmentIdValue ? String(apartmentIdValue) : ""}
              onChange={(val) => setValue("apartment_id", val ? Number(val) : (undefined as unknown as number))}
              disabled={!floorValue || loadingApartments}
              placeholder={loadingApartments ? "Đang tải căn hộ..." : "Chọn căn hộ"}
              searchPlaceholder="Tìm căn hộ..."
              triggerClassName="rounded-md"
              error={errors.apartment_id?.message}
            />
          </div>

          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Ngày bắt đầu *</label>
            <DatePicker
              value={startDateValue || null}
              onChange={(date) => {
                if (!date) {
                  setValue("start_date", "");
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setValue("start_date", `${y}-${m}-${d}`);
              }}
              placeholder="Chọn ngày bắt đầu..."
            />
            {errors.start_date?.message && (
              <p className="mt-1 text-xs text-danger-500">{errors.start_date.message}</p>
            )}
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Ngày kết thúc *</label>
            <DatePicker
              value={endDateValue || null}
              onChange={(date) => {
                if (!date) {
                  setValue("end_date", "");
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setValue("end_date", `${y}-${m}-${d}`);
              }}
              placeholder="Chọn ngày kết thúc..."
            />
            {errors.end_date?.message && (
              <p className="mt-1 text-xs text-danger-500">{errors.end_date.message}</p>
            )}
          </div>

          <div className="col-span-12">
            <Input
              label={`Số lượng người ở thực tế ${apartmentIdValue ? `(Tối đa: ${maxOccupants} người)` : ""} *`}
              type="number"
              min={1}
              value={actualOccupantsValue || ""}
              {...register("actual_occupants", { valueAsNumber: true })}
              error={errors.actual_occupants?.message}
              className="rounded-md"
            />
          </div>
          <div className="col-span-12 sm:col-span-6">
            <Input
              label="Tiền thuê/tháng (VND) *"
              type="number"
              value={monthlyRentValue || 0}
              {...register("monthly_rent", { valueAsNumber: true })}
              error={errors.monthly_rent?.message}
              className="rounded-md"
            />
            {apartmentIdValue && (() => {
              const apt = buildingApartments.find((a) => a.id === apartmentIdValue) || apartments.find((a) => a.id === apartmentIdValue);
              const occupantsCount = Number(actualOccupantsValue) || 1;
              if (apt && occupantsCount > maxOccupants) {
                return (
                  <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                    (Phụ thu {formatCurrency((occupantsCount - maxOccupants) * 1000000)} do quá số người ở quy định)
                  </span>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </Modal>
  );
}